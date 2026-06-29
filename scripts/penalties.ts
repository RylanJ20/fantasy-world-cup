// ─────────────────────────────────────────────────────────────────────────────
//  Pure parser: pull penalty events out of an ESPN match summary.
//
//  ESPN surfaces every penalty OUTCOME as a structured `keyEvent` (the noisy
//  "Penalty conceded / awarded / VAR" lines live only in commentary, never as
//  keyEvents — so keyEvents are already clean). Each carries the taker
//  (`participants[0].athlete`), the taker's `team`, a `shootout` flag, and the
//  full Opta `text`. We classify scored / saved / missed from that text and, for
//  a SAVED penalty, pull the keeper out of the "…saved … by <Keeper> (<Team>)"
//  clause. A commentary scan for "Penalty saved!" is kept as a backstop in case a
//  save ever lands without a keyEvent.
//
//  SHOOTOUTS: ESPN does NOT surface shootout kicks as keyEvents — they live only
//  in free-text commentary ("Penalty saved/missed", "Goal! … converts") and in a
//  structured top-level `summary.shootout` array (taker, team, didScore per kick,
//  no keeper). So we (a) build the set of shootout takers from that array to tag a
//  commentary penalty as a shootout kick (the saved branch needs this — a shootout
//  save scores +3 and must NOT decrement the box-score save total, unlike an
//  in-play pen save), and (b) fold the array's scored/missed kicks into the log so
//  the tournament penalty record is complete.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */

import { normalizeName } from "@/lib/names";

export type PenaltyKind = "scored" | "saved" | "missed" | "unknown";

export interface PenaltyEvent {
  kind: PenaltyKind;
  /** True for a penalty-shootout kick, false for one in the run of play. */
  shootout: boolean;
  minute: string;
  period: number;
  /** Penalty taker (from the keyEvent participants). */
  taker: string | null;
  /** Taker's nation (display name). */
  takerTeam: string | null;
  /** Goalkeeper credited with the save (saved penalties only). */
  keeper: string | null;
  /** Keeper's nation (display name) — the side defending the kick. */
  keeperTeam: string | null;
  text: string;
}

const SCORED = /converts the penalty|penalty[\s-]*scored|scores the penalty/i;
const SAVED = /penalty\s+saved/i;
const MISSED = /penalty\s+missed|misses the penalty|penalty[\s-]*missed/i;
/** First "by <Name> (<Team>)" in a save sentence is the keeper (assists carry no team). */
const BY_KEEPER = /\bby\s+([^()]+?)\s+\(([^)]+)\)/i;
/** "Penalty saved! <Taker> (<Team>) …" — the taker leads the save sentence.
 *  ESPN ends the lead with either "!" or ".", so consume any punctuation/space
 *  before the name (otherwise a "Penalty saved." leaks a ". " into the taker). */
const SAVE_TAKER = /penalty\s+saved[\s!.]*([^()]+?)\s+\(([^)]+)\)/i;

function classify(text: string, typeText: string): PenaltyKind {
  if (SCORED.test(text) || /scored/i.test(typeText)) return "scored";
  if (SAVED.test(text)) return "saved";
  if (MISSED.test(text) || /missed/i.test(typeText)) return "missed";
  return "unknown";
}

/**
 * Credit one saved penalty onto a keeper's match object, in place. A shootout
 * save adds `shootoutSaves` only. An in-play save adds `pkSaves` AND removes one
 * from `saves`, because ESPN's box-score save total already counts the saved
 * penalty as a save — keeping both would pay it twice (+2 as a save, +5 as a pk).
 */
export function creditSave(match: { saves?: number; pkSaves?: number; shootoutSaves?: number }, shootout: boolean): void {
  if (shootout) {
    match.shootoutSaves = (match.shootoutSaves ?? 0) + 1;
  } else {
    match.pkSaves = (match.pkSaves ?? 0) + 1;
    match.saves = Math.max(0, (match.saves ?? 0) - 1);
  }
}

export function extractPenalties(summary: any): PenaltyEvent[] {
  const out: PenaltyEvent[] = [];
  const seen = new Set<string>();
  const add = (e: PenaltyEvent, key: string) => {
    if (seen.has(key)) return;
    seen.add(key);
    out.push(e);
  };

  // Everyone who took a SHOOTOUT kick (normalised name → team). Shootout pens are
  // absent from keyEvents, so this is how a commentary penalty is recognised as a
  // shootout kick rather than an in-play one — which changes how a save scores.
  const shootoutTakers = new Map<string, string | null>();
  for (const t of summary.shootout ?? []) {
    for (const s of t.shots ?? []) {
      if (s.player) shootoutTakers.set(normalizeName(s.player), t.team ?? null);
    }
  }
  const isShootoutTaker = (name: string | null) =>
    name != null && shootoutTakers.has(normalizeName(name));

  // ── Primary: structured keyEvents ──
  for (const ke of summary.keyEvents ?? []) {
    const typeText: string = ke.type?.text ?? "";
    const text: string = ke.text ?? "";
    if (!/penalty/i.test(typeText) && !/penalty/i.test(text)) continue;

    const kind = classify(text, typeText);
    // A keyEvent that mentions "penalty" but is neither scored/saved/missed is
    // almost always not a spot-kick outcome — skip rather than log noise, but
    // keep genuine unknowns (a penalty keyEvent we couldn't classify) for review.
    const isPenaltyType = /penalty/i.test(typeText);
    if (kind === "unknown" && !isPenaltyType) continue;

    let keeper: string | null = null;
    let keeperTeam: string | null = null;
    if (kind === "saved") {
      const m = BY_KEEPER.exec(text);
      if (m) {
        keeper = m[1].trim();
        keeperTeam = m[2].trim();
      }
    }
    add(
      {
        kind,
        shootout: ke.shootout === true,
        minute: ke.clock?.displayValue ?? "",
        period: ke.period?.number ?? 0,
        taker: ke.participants?.[0]?.athlete?.displayName ?? null,
        takerTeam: ke.team?.displayName ?? null,
        keeper,
        keeperTeam,
        text,
      },
      `ke:${ke.id ?? `${ke.period?.number}-${ke.clock?.value}-${kind}`}`,
    );
  }

  // ── Backstop: a "Penalty saved!" in commentary with no matching keyEvent ──
  for (const c of summary.commentary ?? []) {
    const text: string = c.text ?? "";
    if (!SAVED.test(text)) continue;
    const k = BY_KEEPER.exec(text);
    const t = SAVE_TAKER.exec(text);
    const keeper = k?.[1]?.trim() ?? null;
    const taker = t?.[1]?.trim() ?? null;
    // Skip if a keyEvent already captured this save. Compare on NORMALISED names:
    // ESPN's keyEvent (structured participants) and commentary (free text) spell
    // the same player differently — accents, or a stray "." leading the taker —
    // so an exact-string check would let the duplicate through.
    const sameName = (a: string | null, b: string | null) =>
      normalizeName(a ?? "") === normalizeName(b ?? "");
    if (out.some((e) => e.kind === "saved" && sameName(e.keeper, keeper) && sameName(e.taker, taker)))
      continue;
    add(
      {
        kind: "saved",
        // A save whose taker is in the shootout list is a shootout save (+3, not
        // in the box-score save total); otherwise it's an in-play pen save.
        shootout: isShootoutTaker(taker),
        minute: c.time?.displayValue ?? "",
        period: 0,
        taker,
        takerTeam: t?.[2]?.trim() ?? null,
        keeper,
        keeperTeam: k?.[2]?.trim() ?? null,
        text,
      },
      `comm:${c.sequence}`,
    );
  }

  // ── Complete the shootout log from the structured array ──
  // Saved shootout kicks are already captured above (commentary carries the
  // keeper); here we add the scored and missed kicks so the penalty log/counts
  // cover the whole shootout. A non-scoring kick already logged as a save is
  // skipped; any other non-scoring kick is a miss.
  for (const t of summary.shootout ?? []) {
    for (const s of t.shots ?? []) {
      const taker: string | null = s.player ?? null;
      const alreadySaved = out.some(
        (e) =>
          e.shootout &&
          e.kind === "saved" &&
          normalizeName(e.taker ?? "") === normalizeName(taker ?? ""),
      );
      if (alreadySaved) continue;
      add(
        {
          kind: s.didScore === true ? "scored" : "missed",
          shootout: true,
          minute: "",
          period: 0,
          taker,
          takerTeam: t.team ?? null,
          keeper: null,
          keeperTeam: null,
          text: "",
        },
        `so:${s.id ?? `${t.team}-${s.shotNumber}`}`,
      );
    }
  }

  return out;
}
