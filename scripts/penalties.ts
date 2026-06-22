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
//  NOTE: as of this writing no penalty has been SAVED in the tournament (all were
//  converted) and there have been no shootouts, so the saved/shootout branches
//  are written to Opta's standard phrasing but have not been seen against live
//  data yet. import-penalties.ts prints every detected penalty so the first real
//  save can be eyeballed and this parser tuned if ESPN's wording differs.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */

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
/** "Penalty saved! <Taker> (<Team>) …" — the taker leads the save sentence. */
const SAVE_TAKER = /penalty\s+saved!?\s*([^()]+?)\s+\(([^)]+)\)/i;

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
    // Skip if a keyEvent already captured this save (same keeper + taker).
    if (out.some((e) => e.kind === "saved" && e.keeper === keeper && e.taker === taker)) continue;
    add(
      {
        kind: "saved",
        shootout: false,
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

  return out;
}
