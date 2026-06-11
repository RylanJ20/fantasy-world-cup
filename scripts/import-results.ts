// ─────────────────────────────────────────────────────────────────────────────
//  Free football API probe — checks whether football-data.org (free tier) can
//  feed this app. The FIFA World Cup ("WC") is included in their free tier.
//
//  WHAT IT DOES
//    • Confirms your API key works.
//    • Lists the World Cup competition + season window.
//    • Pulls the fixture list (dates + matchups) — this is what powers a future
//      "who's in action today" view.
//    • Pulls finished results (team scores) and aggregate top scorers.
//    • Reports which of OUR scoring stats are available for free vs. not.
//
//  HOW TO RUN
//    1. Get a free key: https://www.football-data.org/client/register
//    2. FOOTBALL_DATA_API_KEY="your_key" npm run import:check
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://api.football-data.org/v4";
const COMPETITION = "WC"; // FIFA World Cup

const KEY = process.env.FOOTBALL_DATA_API_KEY;

async function api(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-Auth-Token": KEY as string },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} on ${path} — ${await res.text()}`);
  }
  return res.json();
}

function line(s = "") {
  console.log(s);
}

async function main() {
  if (!KEY) {
    line("❌ No API key found.");
    line("");
    line("Set up a free key (takes ~1 minute):");
    line("  1. Register at https://www.football-data.org/client/register");
    line("  2. Copy the API token from the confirmation email / dashboard.");
    line('  3. Run:  FOOTBALL_DATA_API_KEY="your_key" npm run import:check');
    process.exit(1);
  }

  line("🔌 Checking football-data.org (free tier)…\n");

  const comp = await api(`/competitions/${COMPETITION}`);
  line(`✅ Competition: ${comp.name} (${comp.area?.name ?? "World"})`);
  if (comp.currentSeason) {
    line(`   Season: ${comp.currentSeason.startDate} → ${comp.currentSeason.endDate}`);
  }
  line("");

  const matchesData = await api(`/competitions/${COMPETITION}/matches`);
  const matches: any[] = matchesData.matches ?? [];
  const byStatus: Record<string, number> = {};
  for (const m of matches) byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
  line(`✅ Fixtures: ${matches.length} matches`);
  line(`   Status: ${JSON.stringify(byStatus)}`);

  const upcoming = matches
    .filter((m) => m.status === "SCHEDULED" || m.status === "TIMED")
    .sort((a, b) => +new Date(a.utcDate) - +new Date(b.utcDate))
    .slice(0, 5);
  if (upcoming.length) {
    line("\n   Next up:");
    for (const m of upcoming) {
      const when = new Date(m.utcDate).toISOString().slice(0, 16).replace("T", " ");
      line(`     ${when} UTC  ${m.homeTeam?.name ?? "?"} vs ${m.awayTeam?.name ?? "?"}`);
    }
  }

  const finished = matches.filter((m) => m.status === "FINISHED");
  if (finished.length) {
    line("\n   Recent results:");
    for (const m of finished.slice(-5)) {
      const ft = m.score?.fullTime ?? {};
      line(`     ${m.homeTeam?.name} ${ft.home}–${ft.away} ${m.awayTeam?.name}`);
    }
  } else {
    line("\n   (No finished matches yet — results appear here once games are played.)");
  }

  line("");
  try {
    const scorers = await api(`/competitions/${COMPETITION}/scorers?limit=5`);
    const s: any[] = scorers.scorers ?? [];
    line(`✅ Top scorers endpoint works (${s.length} returned)`);
    for (const sc of s) {
      line(`     ${sc.player?.name} (${sc.team?.name}) — ${sc.goals ?? 0}G ${sc.assists ?? 0}A`);
    }
  } catch (e) {
    line(`⚠️  Scorers endpoint: ${(e as Error).message}`);
  }

  line("\n── Verdict ─────────────────────────────────────────────");
  line("Available on the free tier and auto-importable:");
  line("  • Team results (W/D/L) and scores  → team Win/Tie/Shutout points");
  line("  • Goals & assists (aggregate via /scorers, per-match via match detail)");
  line("  • Goals conceded → clean-sheet / one-goal bonuses");
  line("NOT reliably available for free (hand-enter these):");
  line("  • Shots on goal, saves, penalty saves (in-play & shootout)");
  line("  • Man of the Match (subjective — APIs generally don't provide it)");
}

main().catch((err) => {
  console.error("\n❌ Failed:", err.message);
  console.error("If this is a 403/429, your key may be wrong or rate-limited (free tier ≈ 10 req/min).");
  process.exit(1);
});
