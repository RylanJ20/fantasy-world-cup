// ─────────────────────────────────────────────────────────────────────────────
//  Builds data/fixtures.json from ESPN's free World Cup feed (no API key needed).
//  One ranged scoreboard request returns all 104 matches with live status, scores
//  and round info; the standings feed supplies group letters for group-stage
//  labels. Output shape is unchanged, so lib/fixtures.ts keeps working as-is.
//
//  Run:  npm run import:fixtures      (then commit data/fixtures.json)
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */
import { writeFileSync } from "node:fs";
import { countryCode } from "@/lib/flags";
import {
  buildGroupMap,
  fetchScoreboard,
  fetchStandings,
  mapStatus,
  stageLabel,
  teamName,
} from "./espn";

function isoMinute(date: string): string {
  // ESPN dates look like "2026-06-11T19:00Z"; normalise to "...T19:00:00Z".
  return new Date(date).toISOString().replace(".000Z", "Z");
}

async function main() {
  console.log("📡 Fetching World Cup fixtures from ESPN…");
  const [board, standings] = await Promise.all([fetchScoreboard(), fetchStandings()]);
  const groupMap = buildGroupMap(standings);
  const events: any[] = board.events ?? [];

  const fixtures = events.map((ev) => {
    const comp = ev.competitions?.[0] ?? {};
    const comps: any[] = comp.competitors ?? [];
    const home = comps.find((c) => c.homeAway === "home") ?? comps[0] ?? {};
    const away = comps.find((c) => c.homeAway === "away") ?? comps[1] ?? {};
    const status = mapStatus(ev);
    const started = status !== "TIMED";
    const score = (c: any) => (started ? Number.parseInt(c.score ?? "", 10) : null);
    const hs = score(home);
    const as = score(away);

    // Penalty-shootout tally — present only on a knockout decided on spot-kicks.
    // ESPN carries it on the scoreboard competitor as `shootoutScore`, so the
    // 1–1-then-won-on-pens result is available without fetching match summaries.
    const shootout = (c: any) => {
      const v = Number(c.shootoutScore);
      return Number.isFinite(v) ? v : null;
    };
    const hsk = shootout(home);
    const ask = shootout(away);
    const hasShootout = hsk != null && ask != null;

    let winner: string | null = null;
    if (home.winner) winner = "HOME_TEAM";
    else if (away.winner) winner = "AWAY_TEAM";
    else if (status === "FINISHED" && hs != null && as != null) {
      if (hs !== as) winner = hs > as ? "HOME_TEAM" : "AWAY_TEAM";
      // Level after extra time → the shootout decides it (the side that advances
      // is recorded as the winner); a genuine group-stage draw has no shootout.
      else if (hasShootout && hsk !== ask)
        winner = hsk! > ask! ? "HOME_TEAM" : "AWAY_TEAM";
      else winner = "DRAW";
    }

    const utcDate = isoMinute(ev.date);
    return {
      n: Number.parseInt(ev.id, 10),
      date: utcDate.slice(0, 10),
      utcDate,
      stage: stageLabel(ev, groupMap),
      home: teamName(home.team?.displayName ?? "TBD"),
      away: teamName(away.team?.displayName ?? "TBD"),
      status,
      homeScore: Number.isNaN(hs as number) ? null : hs,
      awayScore: Number.isNaN(as as number) ? null : as,
      ...(hasShootout ? { homeShootout: hsk, awayShootout: ask } : {}),
      winner,
    };
  });

  fixtures.sort((a, b) => a.utcDate.localeCompare(b.utcDate) || a.n - b.n);
  writeFileSync("data/fixtures.json", JSON.stringify(fixtures, null, 2) + "\n");
  console.log(`✅ Wrote ${fixtures.length} fixtures to data/fixtures.json`);

  // Flag real team names (group stage only — knockout slots are placeholders like
  // "Group A 2nd Place") that don't map to a flag, so they can be added to flags.ts.
  const unknown = new Set<string>();
  for (const f of fixtures) {
    if (!f.stage.startsWith("Group")) continue;
    for (const name of [f.home, f.away]) {
      if (name !== "TBD" && countryCode(name) === null) unknown.add(name);
    }
  }
  if (unknown.size) {
    console.log(`\n⚠️  ${unknown.size} unmapped team name(s) (add to lib/flags.ts):`);
    for (const n of [...unknown].sort()) console.log(`   - "${n}"`);
  } else {
    console.log("👍 All group-stage team names map to a flag.");
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
