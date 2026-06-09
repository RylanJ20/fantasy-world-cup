// ─────────────────────────────────────────────────────────────────────────────
//  Fetches the real World Cup group standings from football-data.org and writes
//  them to data/groups.json — the source for the /groups page.
//
//  Run:  FOOTBALL_DATA_API_KEY="your_key" npm run import:groups
//  (or put FOOTBALL_DATA_API_KEY=your_key in .env.local — it's gitignored)
//
//  Re-run to refresh as group games are played.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync } from "node:fs";

try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    ".env.local",
  );
} catch {
  /* no .env.local — fine */
}

const KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = "https://api.football-data.org/v4";

async function main() {
  if (!KEY) {
    console.error("❌ FOOTBALL_DATA_API_KEY not set.");
    console.error('   Run:  FOOTBALL_DATA_API_KEY="your_key" npm run import:groups');
    process.exit(1);
  }

  console.log("📡 Fetching World Cup group standings…");
  const res = await fetch(`${BASE}/competitions/WC/standings`, {
    headers: { "X-Auth-Token": KEY },
  });
  if (!res.ok) {
    console.error(`❌ ${res.status} ${res.statusText} — ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  const standings: any[] = data.standings ?? [];

  const groups = standings
    .filter((s) => s.type === "TOTAL" && s.group)
    .map((s) => ({
      group: String(s.group).replace("GROUP_", "Group "),
      table: (s.table ?? []).map((r: any) => ({
        position: r.position,
        team: r.team?.name ?? "TBD",
        played: r.playedGames ?? 0,
        won: r.won ?? 0,
        draw: r.draw ?? 0,
        lost: r.lost ?? 0,
        gf: r.goalsFor ?? 0,
        ga: r.goalsAgainst ?? 0,
        gd: r.goalDifference ?? 0,
        points: r.points ?? 0,
      })),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  writeFileSync("data/groups.json", JSON.stringify(groups, null, 2) + "\n");
  console.log(`✅ Wrote ${groups.length} group tables to data/groups.json`);
  console.log("\nNext: git add data/groups.json && git commit -m 'Update groups' && git push");
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
