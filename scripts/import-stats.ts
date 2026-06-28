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
import { motm } from "@/data/motm";
import { countryCode } from "@/lib/flags";
import { isDefender } from "@/lib/scoring";
import { normalizeName, playerKey } from "@/lib/names";
import type { Player, Position } from "@/lib/types";
import { fetchAthlete, fetchScoreboard, fetchSummary, mapStatus, teamName } from "./espn";

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
  /** Per-match stats for every appearance — feeds the tournament points board. */
  matches: any[];
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

  // Drafted players, with every manager who picked each one. A replaced slot
  // contributes BOTH occupants (the outgoing player's pre-swap games and the
  // incoming player's post-swap games are each needed), so follow the
  // `replacedBy` chain and import stats for every player in it.
  const slotOccupants = (p: Player & { replacedBy?: Player }): Player[] => {
    const out: Player[] = [];
    let cur: (Player & { replacedBy?: Player }) | undefined = p;
    while (cur) {
      out.push(cur);
      cur = cur.replacedBy;
    }
    return out;
  };
  const draftedByCode = new Map<string, Drafted[]>();
  for (const m of league.managers) {
    for (const slot of [...m.players, ...(m.bench ?? [])]) {
      for (const p of slotOccupants(slot)) {
        const code = countryCode(p.country);
        if (!code) continue;
        const list = draftedByCode.get(code) ?? [];
        const key = playerKey(p.country, p.name);
        const existing = list.find((d) => d.key === key);
        if (existing) {
          if (!existing.managers.some((mm) => mm.id === m.id))
            existing.managers.push({ id: m.id, name: m.name });
        } else
          list.push({ key, name: p.name, country: p.country, position: p.position, managers: [{ id: m.id, name: m.name }] });
        draftedByCode.set(code, list);
      }
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
        const cur: Agg =
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
            matches: [],
          };
        cur.goals += statVal(a, "totalGoals");
        cur.assists += statVal(a, "goalAssists");
        cur.saves += statVal(a, "saves");
        cur.apps += 1;
        if (status === "FINISHED" && conceded === 0) cur.cleanSheets += 1;
        const grp = positionGroup(a.position);
        if (!cur.position && grp) cur.position = grp; // first known role wins
        // Full per-match line so the app can fantasy-score this player exactly
        // like a drafted one. saves/goalsConceded are kept for everyone — the
        // scoring engine only reads them for keepers / defenders.
        const tMatch: any = {
          opponent,
          goals: statVal(a, "totalGoals"),
          assists: statVal(a, "goalAssists"),
          shotsOnGoal: statVal(a, "shotsOnTarget"),
          saves: statVal(a, "saves"),
          goalsConceded: statVal(a, "goalsConceded"),
        };
        if (result) tMatch.result = result;
        cur.matches.push(tMatch);
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

  // Recover positions ESPN left blank: a player who only came on as a sub is
  // tagged "Substitute", so look up their listed role from the athlete profile.
  // Bounded to players who could actually surface on a board (scorers, keepers
  // with saves, drafted picks) so we don't fetch a profile for every benchwarmer.
  let recovered = 0;
  for (const [id, a] of agg) {
    if (a.position) continue;
    const notable = a.goals > 0 || a.assists > 0 || a.saves > 0 || a.managers.length > 0;
    if (!notable || !/^\d+$/.test(id)) continue;
    try {
      const grp = positionGroup((await fetchAthlete(id))?.position);
      if (grp) {
        a.position = grp;
        recovered += 1;
      }
    } catch (e) {
      console.log(`   ⚠️  position lookup failed for ${a.name}: ${(e as Error).message}`);
    }
  }
  if (recovered) console.log(`   ↪︎ recovered ${recovered} sub position(s) from athlete profiles.`);

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

  // Every appeared player, with full per-match stats + manager tags — the app
  // fantasy-scores these to rank the whole tournament on the points board.
  const tournamentPlayers = all
    .sort((x, y) => x.country.localeCompare(y.country) || x.name.localeCompare(y.name))
    .map((a) => ({
      name: a.name,
      country: a.country,
      position: a.position,
      managers: a.managers,
      matches: a.matches,
    }));

  writeFileSync("data/player-stats.json", JSON.stringify(playerStats, null, 2) + "\n");
  writeFileSync("data/tournament-leaders.json", JSON.stringify(leaders, null, 2) + "\n");
  writeFileSync(
    "data/tournament-players.json",
    JSON.stringify(tournamentPlayers, null, 2) + "\n",
  );

  const draftedLines = Object.values(playerStats).reduce((s, p) => s + p.matches.length, 0);
  console.log(
    `✅ player-stats: ${draftedLines} line(s) for ${Object.keys(playerStats).length} drafted player(s).`,
  );
  console.log(
    `✅ tournament-leaders: goals ${leaders.goals.length} · assists ${leaders.assists.length} · saves ${leaders.saves.length} · clean sheets ${leaders.cleanSheets.length}.`,
  );
  console.log(`✅ tournament-players: ${tournamentPlayers.length} player(s) across all nations.`);

  // Sanity-check the hand-logged MOTM awards (data/motm.ts) against what actually
  // imported. A typo in a name or opponent silently drops the +2 and can park a
  // phantom row on the MOTM board — so surface any mismatch loudly here.
  const oppMatch = (a: string, b: string): boolean => {
    const ca = countryCode(a);
    const cb = countryCode(b);
    return (ca != null && ca === cb) || normalizeName(a) === normalizeName(b);
  };
  const tpByKey = new Map(
    tournamentPlayers.map((p) => [playerKey(p.country, p.name), p]),
  );
  const motmIssues: string[] = [];
  for (const e of motm) {
    const p = tpByKey.get(playerKey(e.country, e.player));
    if (!p) {
      motmIssues.push(`${e.player} (${e.country}) — no imported player by that name`);
    } else if (!p.matches.some((m: any) => oppMatch(m.opponent, e.opponent))) {
      motmIssues.push(
        `${e.player} (${e.country}) vs ${e.opponent} — no imported match against that opponent`,
      );
    }
  }
  if (motmIssues.length) {
    console.log(
      `\n⚠️  ${motmIssues.length} MOTM entr${motmIssues.length === 1 ? "y" : "ies"} in data/motm.ts didn't match imported stats (the +2 won't apply — check spelling, or re-run once the match is in):`,
    );
    for (const i of motmIssues) console.log(`   - ${i}`);
  }

  if (unmatched.length) {
    console.log(`\n⚠️  ${unmatched.length} drafted player(s) unmatched (DNP or name alias needed):`);
    for (const u of unmatched) console.log(`   - ${u}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
