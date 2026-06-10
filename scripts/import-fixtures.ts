// ─────────────────────────────────────────────────────────────────────────────
//  Fetches the World Cup fixture list from football-data.org (free tier) and
//  writes it to data/fixtures.json — the source for the "Who's in action" page.
//
//  Run:  FOOTBALL_DATA_API_KEY="your_key" npm run import:fixtures
//  (or put FOOTBALL_DATA_API_KEY=your_key in a .env.local file — it's gitignored)
//
//  Re-run any time to refresh (e.g. once the group draw teams are in, or to pull
//  in results). Then commit data/fixtures.json and push.
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync } from "node:fs";
import { countryCode, displayName } from "@/lib/flags";

// Optionally load a local .env.local (Node 20.6+/24). Safe if it doesn't exist.
try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    ".env.local",
  );
} catch {
  /* no .env.local — that's fine */
}

const KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE = "https://api.football-data.org/v4";

function stageLabel(group: string | null, stage: string): string {
  if (group) return group.replace("GROUP_", "Group ");
  const map: Record<string, string> = {
    GROUP_STAGE: "Group stage",
    LAST_32: "Round of 32",
    LAST_16: "Round of 16",
    QUARTER_FINALS: "Quarter-final",
    SEMI_FINALS: "Semi-final",
    THIRD_PLACE: "Third place",
    FINAL: "Final",
  };
  return map[stage] ?? stage.replaceAll("_", " ");
}

async function main() {
  if (!KEY) {
    console.error("❌ FOOTBALL_DATA_API_KEY not set.");
    console.error('   Run:  FOOTBALL_DATA_API_KEY="your_key" npm run import:fixtures');
    process.exit(1);
  }

  console.log("📡 Fetching World Cup fixtures…");
  const res = await fetch(`${BASE}/competitions/WC/matches`, {
    headers: { "X-Auth-Token": KEY },
  });
  if (!res.ok) {
    console.error(`❌ ${res.status} ${res.statusText} — ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  const matches: any[] = data.matches ?? [];

  const fixtures = matches.map((m) => ({
    n: m.id as number,
    date: (m.utcDate as string).slice(0, 10),
    utcDate: m.utcDate as string,
    stage: stageLabel(m.group ?? null, m.stage),
    home: displayName(m.homeTeam?.name ?? "TBD"),
    away: displayName(m.awayTeam?.name ?? "TBD"),
    status: m.status as string,
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    winner: m.score?.winner ?? null,
  }));

  fixtures.sort((a, b) => a.utcDate.localeCompare(b.utcDate));

  writeFileSync("data/fixtures.json", JSON.stringify(fixtures, null, 2) + "\n");
  console.log(`✅ Wrote ${fixtures.length} fixtures to data/fixtures.json`);

  // Report any team names we can't map to a flag/country code, so they can be
  // added to lib/flags.ts (otherwise they won't match rosters or show a flag).
  const unknown = new Set<string>();
  for (const f of fixtures) {
    for (const name of [f.home, f.away]) {
      if (name !== "TBD" && countryCode(name) === null) unknown.add(name);
    }
  }
  if (unknown.size) {
    console.log(
      `\n⚠️  ${unknown.size} team name(s) not recognised (add to lib/flags.ts):`,
    );
    for (const n of [...unknown].sort()) console.log(`   - "${n}"`);
  } else {
    console.log("👍 All team names map to a country/flag.");
  }

  console.log("\nNext: git add data/fixtures.json && git commit -m 'Update fixtures' && git push");
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
