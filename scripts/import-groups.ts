// ─────────────────────────────────────────────────────────────────────────────
//  Builds data/groups.json (the 12 group tables) from ESPN's free standings feed
//  (no API key needed). Output shape is unchanged, so lib/groups.ts works as-is.
//
//  Run:  npm run import:groups        (then commit data/groups.json)
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */
import { writeFileSync } from "node:fs";
import { fetchStandings, teamName } from "./espn";

const stat = (entry: any, name: string): number => {
  const s = (entry.stats ?? []).find((x: any) => x.name === name);
  const v = s?.value ?? Number.parseInt(s?.displayValue ?? "", 10);
  return Number.isFinite(v) ? v : 0;
};

async function main() {
  console.log("📡 Fetching World Cup group standings from ESPN…");
  const standings = await fetchStandings();

  const groups = (standings.children ?? [])
    .map((g: any) => {
      const entries = [...(g.standings?.entries ?? [])].sort(
        (a, b) => stat(a, "rank") - stat(b, "rank"),
      );
      return {
        group: g.name ?? g.displayName,
        table: entries.map((e: any, i: number) => ({
          position: stat(e, "rank") || i + 1,
          team: teamName(e.team?.displayName ?? e.team?.name ?? "TBD"),
          played: stat(e, "gamesPlayed"),
          won: stat(e, "wins"),
          draw: stat(e, "ties"),
          lost: stat(e, "losses"),
          gf: stat(e, "pointsFor"),
          ga: stat(e, "pointsAgainst"),
          gd: stat(e, "pointDifferential"),
          points: stat(e, "points"),
        })),
      };
    })
    .sort((a: { group: string }, b: { group: string }) => a.group.localeCompare(b.group));

  writeFileSync("data/groups.json", JSON.stringify(groups, null, 2) + "\n");
  console.log(`✅ Wrote ${groups.length} group tables to data/groups.json`);
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
