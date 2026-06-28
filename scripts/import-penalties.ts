// ─────────────────────────────────────────────────────────────────────────────
//  Auto-imports PENALTY SAVES — the one keeper stat that scores differently from
//  an ordinary save (in-play +5 / shootout +3, vs a regular save +2) and that the
//  plain box score can't express. Runs AFTER import:stats (it edits the
//  player-stats.json that step writes) and reads the same ESPN match summaries.
//
//  What it does, per finished/in-play match:
//   1. Parses every penalty outcome from the summary (see scripts/penalties.ts).
//   2. For a SAVED penalty whose keeper is a drafted goalkeeper, writes
//      `pkSaves` (in play) or `shootoutSaves` (shootout) onto that keeper's match
//      in data/player-stats.json so the scoring engine awards the +5 / +3.
//      ESPN's box-score `saves` total already counts a saved in-play penalty as a
//      save, so we decrement `saves` by the same amount to avoid double-paying
//      (+2 as a save AND +5 as a pk save). Shootout kicks are NOT in the box-score
//      save total, so those are left alone.
//   3. Writes data/penalties.json — a full tournament penalty log (scored / saved
//      / missed, run-of-play and shootout) for auditing and reference.
//
//  The manual overlay in data/league.ts still wins at read time (lib/playerStats),
//  so any miss here can be corrected by hand with a pm(opponent, { pkSaves }).
//
//  Run:  npm run import:penalties        (then commit the two json files)
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */
import { readFileSync, writeFileSync } from "node:fs";
import { league } from "@/data/league";
import type { Player } from "@/lib/types";
import { countryCode } from "@/lib/flags";
import { normalizeName, playerKey } from "@/lib/names";
import { fetchScoreboard, fetchSummary, mapStatus } from "./espn";
import { creditSave, extractPenalties } from "./penalties";

interface DraftedKeeper {
  key: string;
  name: string;
  country: string;
  managers: string[];
}

/** Does `name` refer to `candidate`? Exact → token-subset → shared surname. */
function nameMatches(name: string, candidate: string): boolean {
  const a = normalizeName(name);
  const b = normalizeName(candidate);
  if (a === b) return true;
  const at = a.split(" ");
  const bt = b.split(" ");
  if (at.every((t) => bt.includes(t)) || bt.every((t) => at.includes(t))) return true;
  return at.at(-1) === bt.at(-1);
}

async function main() {
  console.log("📡 Importing penalty saves from ESPN match summaries…");

  // Drafted goalkeepers, indexed by nation flag code. A replaced slot can hold
  // two keepers across the tournament (e.g. a group-stage GK swapped out for the
  // knockouts), so follow the `replacedBy` chain — each keeper's saves land on
  // their own match line, and the read-time window keeps each to their stint.
  const occupants = (p: Player): Player[] => {
    const out: Player[] = [];
    let cur: Player | undefined = p;
    while (cur) {
      out.push(cur);
      cur = cur.replacedBy;
    }
    return out;
  };
  const keepersByCode = new Map<string, DraftedKeeper[]>();
  for (const m of league.managers) {
    for (const slot of [...m.players, ...(m.bench ?? [])]) {
      for (const p of occupants(slot)) {
        if (p.position !== "GK") continue;
        const code = countryCode(p.country);
        if (!code) continue;
        const list = keepersByCode.get(code) ?? [];
        const key = playerKey(p.country, p.name);
        const existing = list.find((k) => k.key === key);
        if (existing) {
          if (!existing.managers.includes(m.name)) existing.managers.push(m.name);
        } else list.push({ key, name: p.name, country: p.country, managers: [m.name] });
        keepersByCode.set(code, list);
      }
    }
  }

  // Penalty saves are an overlay on top of the core stats — a transient ESPN
  // hiccup here must never fail the whole import (and block the commit of the
  // fixtures/stats that already succeeded). Bail gracefully and leave the data
  // as import:stats left it; the next run re-derives everything from scratch.
  let board: any;
  try {
    board = await fetchScoreboard();
  } catch (e) {
    console.log(`   ⚠️  ESPN scoreboard fetch failed (${(e as Error).message}); leaving penalty data unchanged.`);
    return;
  }
  const events: any[] = (board.events ?? []).filter((ev: any) => mapStatus(ev) !== "TIMED");
  console.log(`   ${events.length} started/finished match(es) to scan.`);

  // A save we will apply to a drafted keeper's match in player-stats.json.
  interface AppliedSave {
    key: string;
    fixtureId: number;
    shootout: boolean;
    keeper: string;
    manager: string;
    opponent: string | null;
  }
  const applied: AppliedSave[] = [];
  const log: any[] = [];
  const warnings: string[] = [];

  for (const ev of events) {
    let summary: any;
    try {
      summary = await fetchSummary(ev.id);
    } catch (e) {
      warnings.push(`summary failed for ${ev.name}: ${(e as Error).message}`);
      continue;
    }
    const fixtureId = Number.parseInt(ev.id, 10);
    const pens = extractPenalties(summary);

    for (const pen of pens) {
      // Resolve the drafted keeper (if any) for a saved penalty.
      let draftedKeeper: DraftedKeeper | null = null;
      if (pen.kind === "saved" && pen.keeper && pen.keeperTeam) {
        const kc = countryCode(pen.keeperTeam);
        const candidates = (kc && keepersByCode.get(kc)) || [];
        draftedKeeper = candidates.find((k) => nameMatches(pen.keeper!, k.name)) ?? null;
        if (draftedKeeper) {
          applied.push({
            key: draftedKeeper.key,
            fixtureId,
            shootout: pen.shootout,
            keeper: draftedKeeper.name,
            manager: draftedKeeper.managers.join(", "),
            opponent: pen.takerTeam,
          });
        }
      }
      if (pen.kind === "unknown") {
        warnings.push(`${ev.name}: unclassified penalty keyEvent — "${pen.text}"`);
      }
      if (pen.kind === "saved" && (!pen.keeper || !pen.keeperTeam)) {
        warnings.push(`${ev.name}: saved penalty but couldn't read the keeper — "${pen.text}"`);
      }

      log.push({
        fixtureId,
        match: ev.name,
        date: ev.date,
        minute: pen.minute,
        shootout: pen.shootout,
        kind: pen.kind,
        taker: pen.taker,
        takerTeam: pen.takerTeam,
        keeper: pen.keeper,
        keeperTeam: pen.keeperTeam,
        draftedKeeper: draftedKeeper ? `${draftedKeeper.name} (${draftedKeeper.managers.join(", ")})` : undefined,
        text: pen.text,
      });
    }
  }

  // ── Apply saves to drafted keepers in player-stats.json ──
  const statsPath = "data/player-stats.json";
  const stats: Record<string, { country: string; name: string; matches: any[] }> = JSON.parse(
    readFileSync(statsPath, "utf8"),
  );

  let appliedCount = 0;
  for (const s of applied) {
    const entry = stats[s.key];
    const match = entry?.matches.find((m) => m.fixtureId === s.fixtureId);
    if (!match) {
      warnings.push(
        `couldn't apply save: ${s.keeper} vs ${s.opponent ?? "?"} (fixture ${s.fixtureId}) not in player-stats.json — re-run import:stats first?`,
      );
      continue;
    }
    creditSave(match, s.shootout);
    appliedCount += 1;
  }

  writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");

  // ── Tournament penalty log ──
  const saved = log.filter((p) => p.kind === "saved");
  const summaryCounts = {
    total: log.length,
    scored: log.filter((p) => p.kind === "scored").length,
    saved: saved.length,
    missed: log.filter((p) => p.kind === "missed").length,
    unknown: log.filter((p) => p.kind === "unknown").length,
    inPlaySaves: saved.filter((p) => !p.shootout).length,
    shootoutSaves: saved.filter((p) => p.shootout).length,
  };
  log.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  writeFileSync(
    "data/penalties.json",
    JSON.stringify({ summary: summaryCounts, events: log }, null, 2) + "\n",
  );

  console.log(
    `✅ penalties: ${summaryCounts.total} penalty event(s) — ${summaryCounts.scored} scored · ${summaryCounts.saved} saved · ${summaryCounts.missed} missed.`,
  );
  console.log(
    `✅ applied ${appliedCount} save(s) to drafted keepers (${summaryCounts.inPlaySaves} in play, ${summaryCounts.shootoutSaves} shootout).`,
  );
  if (saved.length) {
    console.log("   Saved penalties seen:");
    for (const p of saved)
      console.log(
        `   - ${p.keeper ?? "?"} (${p.keeperTeam ?? "?"})${p.draftedKeeper ? ` ⭐ ${p.draftedKeeper}` : ""} vs ${p.taker ?? "?"} [${p.shootout ? "shootout" : "in play"}] — ${p.match}`,
      );
  }
  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} note(s):`);
    for (const w of warnings) console.log(`   - ${w}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
