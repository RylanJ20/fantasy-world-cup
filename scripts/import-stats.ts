// ─────────────────────────────────────────────────────────────────────────────
//  Builds two stat files from ESPN match summaries (no API key), in ONE pass over
//  every started/finished match (each summary fetched once):
//
//   • data/player-stats.json      — per-match auto stats for DRAFTED players
//                                    (goals, assists, SoG, saves, conceded, result),
//                                    merged with the manual overlay in league.ts.
//   • data/tournament-leaders.json — tournament-wide leaders across ALL 48 nations
//                                    (top scorers, assists, saves, clean sheets),
//                                    with drafted players tagged by their manager.
//
//  Run:  npm run import:stats         (then commit both json files)
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */
import { writeFileSync } from "node:fs";
import { league } from "@/data/league";
import { countryCode } from "@/lib/flags";
import { isDefender } from "@/lib/scoring";
import { normalizeName, playerKey } from "@/lib/names";
import type { Position } from "@/lib/types";
import { fetchScoreboard, fetchSummary, mapStatus, teamName } from "./espn";

const TOP_N = 12;

interface Drafted {
  key: string;
  name: string;
  country: string;
  position: Position;
  managers: { id: string; name: string }[];
}
interface Agg {
  name: string;
  country: string;
  position: string;
  goals: number;
  assists: number;
  saves: number;
  cleanSheets: number;
  apps: number;
  managers: { id: string; name: string }[];
}

const statVal = (a: any, name: string): number => {
  const s = (a.stats ?? []).find((x: any) => x.name === name);
  return Number.isFinite(s?.value) ? s.value : 0;
};
const appeared = (a: any): boolean =>
  statVal(a, "appearances") >= 1 || a.subbedIn === true || a.starter === true;

/** ESPN's granular position (e.g. "CD-L", "LB", "DM", "Substitute") → GK/DEF/MID/FWD. */
function positionGroup(pos: any): string {
  const abbr = (pos?.abbreviation ?? "").toUpperCase();
  const name = (pos?.name ?? "").toLowerCase();
  // abbr exactly in set, or a "BASE-x" variant like "CD-L" / "CM-R".
  const inSet = (set: string[]) =>
    set.some((p) => abbr === p || abbr.startsWith(p + "-"));
  if (abbr === "G" || abbr === "GK" || /goalkeeper|keeper/.test(name)) return "GK";
  if (inSet(["D", "CB", "CD", "LB", "RB", "WB", "RWB", "LWB", "SW", "LCB", "RCB"]) ||
    /defender|defence|defense|\bback\b|sweeper/.test(name))
    return "DEF"; // incl. wing/full-backs; "Defensive Midfielder" falls through to MID
  if (inSet(["M", "DM", "CM", "AM", "LM", "RM", "CDM", "CAM"]) || /midfield/.test(name)) return "MID";
  if (inSet(["F", "CF", "ST", "SS", "LW", "RW", "W"]) || /forward|striker|wing|attack/.test(name))
    return "FWD";
  return ""; // e.g. an always-substitute with no assigned role
}

/** Unique-match index of `name` within candidate display names (-1 if none). */
function matchName(name: string, candidates: string[]): number {
  const dn = normalizeName(name);
  const dt = dn.split(" ");
  const norm = candidates.map(normalizeName);
  const uniq = (idxs: number[]) => (idxs.length === 1 ? idxs[0] : -1);
  const idx = (pred: (n: string) => boolean) =>
    norm.flatMap((n, i) => (pred(n) ? [i] : []));

  let hit = uniq(idx((n) => n === dn));
  if (hit >= 0) return hit;
  hit = uniq(
    idx((n) => {
      const at = n.split(" ");
      return dt.every((t) => at.includes(t)) || at.every((t) => dt.includes(t));
    }),
  );
  if (hit >= 0) return hit;
  return uniq(idx((n) => n.split(" ").at(-1) === dt.at(-1)));
}

async function main() {
  console.log("📡 Building player + tournament stats from ESPN…");

  // Drafted players, with every manager who picked each one.
  const draftedByCode = new Map<string, Drafted[]>();
  for (const m of league.managers) {
    for (const p of [...m.players, ...(m.bench ?? [])]) {
      const code = countryCode(p.country);
      if (!code) continue;
      const list = draftedByCode.get(code) ?? [];
      const key = playerKey(p.country, p.name);
      const existing = list.find((d) => d.key === key);
      if (existing) existing.managers.push({ id: m.id, name: m.name });
      else
        list.push({ key, name: p.name, country: p.country, position: p.position, managers: [{ id: m.id, name: m.name }] });
      draftedByCode.set(code, list);
    }
  }

  const board = await fetchScoreboard();
  const events: any[] = (board.events ?? []).filter((ev: any) => mapStatus(ev) !== "TIMED");
  console.log(`   ${events.length} started/finished match(es) to read.`);

  const playerStats: Record<string, { country: string; name: string; matches: any[] }> = {};
  const agg = new Map<string, Agg>(); // by ESPN athlete id
  const unmatched: string[] = [];

  for (const ev of events) {
    const status = mapStatus(ev);
    const comps: any[] = ev.competitions?.[0]?.competitors ?? [];
    let summary: any;
    try {
      summary = await fetchSummary(ev.id);
    } catch (e) {
      console.log(`   ⚠️  summary failed for ${ev.name}: ${(e as Error).message}`);
      continue;
    }

    for (const roster of summary.rosters ?? []) {
      const rosterCode = countryCode(roster.team?.displayName ?? "");
      // Match this roster to its scoreboard competitor by id, then country as a
      // fallback (summary/scoreboard id shapes can differ). If neither matches we
      // can't tell which side this is — skip, rather than mis-credit the own team.
      const me =
        comps.find((c) => String(c.team?.id) === String(roster.team?.id)) ??
        comps.find((c) => countryCode(c.team?.displayName ?? "") === rosterCode);
      if (!me) continue;
      const them = comps.find((c) => c !== me);
      const country = teamName(roster.team?.displayName ?? "TBD");
      const opponent = teamName(them?.team?.displayName ?? "TBD");
      const conceded = them?.score != null ? Number.parseInt(them.score, 10) : null;
      const result: "W" | "D" | "L" | undefined =
        status === "FINISHED" ? (me.winner ? "W" : them?.winner ? "L" : "D") : undefined;
      const players: any[] = (roster.roster ?? []).filter(appeared);

      // ── Tournament-wide aggregation (every player) ──
      for (const a of players) {
        const id = String(a.athlete?.id ?? a.athlete?.displayName);
        const cur =
          agg.get(id) ??
          {
            name: a.athlete?.displayName ?? "?",
            country,
            position: "",
            goals: 0,
            assists: 0,
            saves: 0,
            cleanSheets: 0,
            apps: 0,
            managers: [],
          };
        cur.goals += statVal(a, "totalGoals");
        cur.assists += statVal(a, "goalAssists");
        cur.saves += statVal(a, "saves");
        cur.apps += 1;
        if (status === "FINISHED" && conceded === 0) cur.cleanSheets += 1;
        const grp = positionGroup(a.position);
        if (!cur.position && grp) cur.position = grp; // first known role wins
        agg.set(id, cur);
      }

      // ── Drafted per-match stats (only nations someone drafted players from) ──
      const drafted = rosterCode && draftedByCode.get(rosterCode);
      if (!drafted) continue;
      const names = players.map((a) => a.athlete?.displayName ?? "");
      for (const d of drafted) {
        const i = matchName(d.name, names);
        if (i < 0) {
          unmatched.push(`${d.name} (${d.country}) vs ${opponent}`);
          continue;
        }
        const a = players[i];
        const match: any = {
          fixtureId: Number.parseInt(ev.id, 10),
          opponent,
          date: ev.date,
          goals: statVal(a, "totalGoals"),
          assists: statVal(a, "goalAssists"),
          shotsOnGoal: statVal(a, "shotsOnTarget"),
        };
        if (d.position === "GK") match.saves = statVal(a, "saves");
        if (isDefender(d.position)) match.goalsConceded = statVal(a, "goalsConceded");
        if (result) match.result = result;
        playerStats[d.key] = playerStats[d.key] ?? { country: d.country, name: d.name, matches: [] };
        playerStats[d.key].matches.push(match);
      }
    }
  }

  // Tag aggregated athletes that are drafted (so leaders can show the manager).
  for (const [code, drafted] of draftedByCode) {
    const mine = [...agg.values()].filter((a) => countryCode(a.country) === code);
    const names = mine.map((a) => a.name);
    for (const d of drafted) {
      const i = matchName(d.name, names);
      if (i >= 0) mine[i].managers = d.managers;
    }
  }

  // Build top-N leaderboards.
  const all = [...agg.values()];
  const top = (
    valueFn: (a: Agg) => number,
    filter: (a: Agg) => boolean = () => true,
  ) =>
    all
      .filter((a) => filter(a) && valueFn(a) > 0)
      .sort((x, y) => valueFn(y) - valueFn(x) || x.name.localeCompare(y.name))
      .slice(0, TOP_N)
      .map((a) => ({
        name: a.name,
        country: a.country,
        position: a.position,
        value: valueFn(a),
        managers: a.managers,
      }));

  const leaders = {
    goals: top((a) => a.goals),
    assists: top((a) => a.assists),
    saves: top((a) => a.saves, (a) => a.position === "GK"),
    cleanSheets: top((a) => a.cleanSheets, (a) => a.position === "DEF"),
  };

  writeFileSync("data/player-stats.json", JSON.stringify(playerStats, null, 2) + "\n");
  writeFileSync("data/tournament-leaders.json", JSON.stringify(leaders, null, 2) + "\n");

  const draftedLines = Object.values(playerStats).reduce((s, p) => s + p.matches.length, 0);
  console.log(
    `✅ player-stats: ${draftedLines} line(s) for ${Object.keys(playerStats).length} drafted player(s).`,
  );
  console.log(
    `✅ tournament-leaders: goals ${leaders.goals.length} · assists ${leaders.assists.length} · saves ${leaders.saves.length} · clean sheets ${leaders.cleanSheets.length}.`,
  );
  if (unmatched.length) {
    console.log(`\n⚠️  ${unmatched.length} drafted player(s) unmatched (DNP or name alias needed):`);
    for (const u of unmatched) console.log(`   - ${u}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
