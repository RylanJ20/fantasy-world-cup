// ──────────────────────────────────────────────────────────────────────────
//  Derived selectors over the league data. Everything the UI reads goes
//  through here so scoring is computed once, consistently.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import type { Manager, Player } from "./types";
import { fixtures, resultsForCountry } from "./fixtures";
import { mergedPlayerMatches } from "./playerStats";
import { tournamentLeader, tournamentLeaders } from "./tournamentLeaders";
import { undraftedPlayerScores, tournamentPosition } from "./tournamentPlayers";
import { motmLeaders } from "./motm";
import { playerKey } from "./names";
import {
  scoreManager,
  type ManagerScore,
  type TeamScore,
} from "./scoring";

/**
 * Auto-fill each drafted team's results from the imported fixtures, unless the
 * team already has manually-entered matches (manual always wins). So managers
 * only need to list 6 country names — team points compute from real results.
 */
function withAutoResults(m: Manager): Manager {
  return {
    ...m,
    teams: m.teams.map((t) =>
      t.matches.length > 0 ? t : { ...t, matches: resultsForCountry(t.country) },
    ),
  };
}

/**
 * Fill each drafted player's matches from ESPN's imported stats, with their
 * league.ts entries layered on top as a manual overlay (MOTM / penalty saves).
 */
function withAutoPlayerStats(m: Manager): Manager {
  const fill = (p: Player): Player => ({ ...p, matches: mergedPlayerMatches(p) });
  return {
    ...m,
    players: m.players.map(fill),
    ...(m.bench ? { bench: m.bench.map(fill) } : {}),
  };
}

/** Earliest imported fixture, or the data fallback if none are loaded. */
function earliestKickoff(): string {
  const times = fixtures
    .map((f) => f.utcDate)
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .sort();
  return times[0] ?? league.kickoff;
}

export const leagueMeta = {
  name: league.name,
  season: league.season,
  kickoff: earliestKickoff(),
};

/** All managers, scored and sorted by total points (highest first). */
export function getManagerScores(): ManagerScore[] {
  return league.managers
    .map((m) => scoreManager(withAutoPlayerStats(withAutoResults(m))))
    .sort((a, b) => b.total - a.total || a.manager.name.localeCompare(b.manager.name));
}

export interface StandingRow extends ManagerScore {
  rank: number;
  /** True when this row shares its rank with the row above (tie). */
  tied: boolean;
}

/** Standings with competition ranking (ties share a rank: 1, 2, 2, 4…). */
export function getStandings(): StandingRow[] {
  const scores = getManagerScores();
  let lastTotal: number | null = null;
  let lastRank = 0;
  return scores.map((s, i) => {
    const tied = lastTotal === s.total;
    const rank = tied ? lastRank : i + 1;
    lastTotal = s.total;
    lastRank = rank;
    return { ...s, rank, tied };
  });
}

export function getManagerScore(slug: string): StandingRow | undefined {
  return getStandings().find((s) => s.manager.id === slug);
}

export function getAllManagerSlugs(): string[] {
  return league.managers.map((m) => m.id);
}

export interface StripCard {
  key: "points" | "boot" | "glove" | "team";
  label: string;
  name: string;
  meta: string;
  value: number;
  unit: string;
  href?: string;
}

/**
 * Homepage strip: best drafted player (fantasy points) and best team pick, plus
 * the REAL tournament Golden Boot / Golden Glove (top scorer / keeper across all
 * nations, drafted or not). Fantasy cards only appear once points are on the board.
 */
export function getLeagueLeaders(): StripCard[] {
  const scores = getManagerScores();
  let topTeam: { t: TeamScore; mgr: Manager } | null = null;
  for (const m of scores) {
    for (const t of m.teams)
      if (!topTeam || t.total > topTeam.t.total) topTeam = { t, mgr: m.manager };
  }

  const cards: StripCard[] = [];
  // Top points — the real leader across ALL nations (drafted or not), mirroring
  // the Golden Boot / Glove cards below: links to a manager only when owned.
  const topPoints = tournamentPointsRanking()[0];
  if (topPoints && topPoints.value > 0)
    cards.push({
      key: "points",
      label: "Top points",
      name: topPoints.name,
      meta: topPoints.managerName
        ? `${topPoints.country} · ${topPoints.managerName}`
        : topPoints.country,
      value: topPoints.value,
      unit: "pts",
      href: topPoints.managerId ? `/manager/${topPoints.managerId}` : "/leaderboards",
    });

  const pushTournament = (
    key: "boot" | "glove",
    label: string,
    unit: string,
    leader: ReturnType<typeof tournamentLeader>,
  ) => {
    if (!leader) return;
    const owner = leader.managers[0];
    cards.push({
      key,
      label,
      name: leader.name,
      meta: owner ? `${leader.country} · ${owner.name}` : leader.country,
      value: leader.value,
      unit,
      href: owner ? `/manager/${owner.id}` : "/leaderboards",
    });
  };
  pushTournament("boot", "Golden boot", "goals", tournamentLeader("goals"));
  pushTournament("glove", "Golden glove", "saves", tournamentLeader("saves"));

  if (topTeam && topTeam.t.total > 0)
    cards.push({
      key: "team",
      label: "Best team pick",
      name: topTeam.t.team.country,
      meta: `${topTeam.t.record.w}W-${topTeam.t.record.d}D-${topTeam.t.record.l}L · ${topTeam.mgr.name}`,
      value: topTeam.t.total,
      unit: "pts",
      href: `/manager/${topTeam.mgr.id}`,
    });

  return cards;
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

export interface LeaderRow {
  name: string;
  country: string;
  position: string;
  value: number;
  /** Present only for drafted players — links the row to their manager. */
  managerId?: string;
  managerName?: string;
}

export interface LeaderboardCategory {
  key: string;
  title: string;
  unit: string;
  /** Currently always "tournament" (all 48 nations, drafted players tagged).
   *  "fantasy" (drafted-only) is retained for flexibility but no longer used
   *  now that the points & MOTM boards count the whole field. */
  scope: "fantasy" | "tournament";
  rows: LeaderRow[];
}

/**
 * Every player at the World Cup ranked by fantasy points. Drafted players carry
 * their EXACT total from their manager page (overlay + MOTM aware); undrafted
 * players are scored from imported stats. Keyed dedupe stops a drafted player
 * from being recounted as undrafted. Sorted high→low, no limit.
 */
export function tournamentPointsRanking(): LeaderRow[] {
  const drafted = getManagerScores().flatMap((m) =>
    m.players.map((p) => ({ p, mgr: m.manager })),
  );
  const draftedKeys = new Set(
    drafted.map(({ p }) => playerKey(p.player.country, p.player.name)),
  );
  const rows: LeaderRow[] = drafted.map(({ p, mgr }) => ({
    name: p.player.name,
    country: p.player.country,
    position: p.player.position,
    value: p.total,
    managerId: mgr.id,
    managerName: mgr.name,
  }));
  for (const u of undraftedPlayerScores()) {
    if (draftedKeys.has(playerKey(u.country, u.name))) continue;
    rows.push({
      name: u.name,
      country: u.country,
      position: u.position,
      value: u.value,
    });
  }
  return rows
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/**
 * Category leaderboards, all tournament-wide across ALL 48 nations. Drafted
 * players are tagged with their manager so their row links back to the draft.
 */
export function getLeaderboards(limit = 10): LeaderboardCategory[] {
  const drafted = getManagerScores().flatMap((m) =>
    m.players.map((p) => ({ p, mgr: m.manager })),
  );

  // Drafted player key → owning manager(s) + drafted position, so the MOTM board
  // can tag and link winners back to the draft.
  const draftedManagers = new Map<string, { id: string; name: string }[]>();
  const draftedPosition = new Map<string, string>();
  for (const { p, mgr } of drafted) {
    const key = playerKey(p.player.country, p.player.name);
    const list = draftedManagers.get(key) ?? [];
    list.push({ id: mgr.id, name: mgr.name });
    draftedManagers.set(key, list);
    draftedPosition.set(key, p.player.position);
  }

  const points: LeaderboardCategory = {
    key: "points",
    title: "Most Points",
    unit: "pts",
    scope: "tournament",
    rows: tournamentPointsRanking().slice(0, limit),
  };

  // ── Man of the match: tournament-wide, tallied from data/motm.ts. ──
  const motm: LeaderboardCategory = {
    key: "motm",
    title: "Man of the Match",
    unit: "MOTM",
    scope: "tournament",
    rows: motmLeaders()
      .slice(0, limit)
      .map((e) => {
        const key = playerKey(e.country, e.name);
        const mgrs = draftedManagers.get(key) ?? [];
        return {
          name: e.name,
          country: e.country,
          position: draftedPosition.get(key) ?? tournamentPosition(e.country, e.name),
          value: e.count,
          managerId: mgrs.length === 1 ? mgrs[0].id : undefined,
          managerName: mgrs.length
            ? mgrs.map((m) => m.name).join(" / ")
            : undefined,
        };
      }),
  };

  const tournament = (
    key: string,
    title: string,
    unit: string,
    tlKey: "goals" | "assists" | "saves" | "cleanSheets",
  ): LeaderboardCategory => ({
    key,
    title,
    unit,
    scope: "tournament",
    rows: tournamentLeaders(tlKey)
      .slice(0, limit)
      .map((r) => ({
        name: r.name,
        country: r.country,
        position: r.position,
        value: r.value,
        // Only link when a single manager owns them — a shared pick shows both
        // names but linking to just one would mismatch the displayed text.
        managerId: r.managers.length === 1 ? r.managers[0].id : undefined,
        managerName: r.managers.length
          ? r.managers.map((m) => m.name).join(" / ")
          : undefined,
      })),
  });

  return [
    points,
    tournament("goals", "Top Scorers", "goals", "goals"),
    tournament("assists", "Most Assists", "assists", "assists"),
    motm,
    tournament("glove", "Golden Glove", "saves", "saves"),
    tournament("defender", "Best Defender", "CS", "cleanSheets"),
  ];
}

/** Totals for the hero stat ticker. */
export function getLeagueTotals() {
  const scores = getManagerScores();
  let goals = 0;
  let cleanSheets = 0;
  let matches = 0;
  let points = 0;
  for (const m of scores) {
    points += m.total;
    for (const p of m.players) {
      goals += p.totals.goals;
      cleanSheets += p.totals.cleanSheets;
    }
    for (const t of m.teams) matches += t.team.matches.length;
  }
  return { goals, cleanSheets, matches, points, managers: scores.length };
}
