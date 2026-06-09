// ──────────────────────────────────────────────────────────────────────────
//  Derived selectors over the league data. Everything the UI reads goes
//  through here so scoring is computed once, consistently.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import type { Manager } from "./types";
import { fixtures, resultsForCountry } from "./fixtures";
import {
  isDefender,
  scoreManager,
  type ManagerScore,
  type PlayerScore,
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
    .map((m) => scoreManager(withAutoResults(m)))
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

export interface LeaderEntry<T> {
  managerId: string;
  managerName: string;
  value: number;
  subject: T;
}

/** League-wide superlatives for the homepage strip. */
export function getLeagueLeaders() {
  const scores = getManagerScores();

  let topScorer: LeaderEntry<PlayerScore> | null = null;
  let topKeeper: LeaderEntry<PlayerScore> | null = null;
  let topTeam: LeaderEntry<TeamScore> | null = null;
  let mostGoals: LeaderEntry<PlayerScore> | null = null;

  for (const m of scores) {
    for (const p of m.players) {
      const entry = {
        managerId: m.manager.id,
        managerName: m.manager.name,
        subject: p,
      };
      if (!topScorer || p.total > topScorer.value)
        topScorer = { ...entry, value: p.total };
      if (!mostGoals || p.totals.goals > mostGoals.value)
        mostGoals = { ...entry, value: p.totals.goals };
      if (p.player.position === "GK" && (!topKeeper || p.total > topKeeper.value))
        topKeeper = { ...entry, value: p.total };
    }
    for (const t of m.teams) {
      if (!topTeam || t.total > topTeam.value)
        topTeam = {
          managerId: m.manager.id,
          managerName: m.manager.name,
          subject: t,
          value: t.total,
        };
    }
  }

  return { topScorer, topKeeper, topTeam, mostGoals };
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

export interface LeaderboardRow {
  player: PlayerScore;
  managerId: string;
  managerName: string;
  value: number;
}

export interface LeaderboardCategory {
  key: string;
  title: string;
  unit: string;
  rows: LeaderboardRow[];
}

/** Cross-league player leaderboards by category (each ranked, top `limit`). */
export function getLeaderboards(limit = 8): LeaderboardCategory[] {
  const all = getManagerScores().flatMap((m) =>
    m.players.map((player) => ({
      player,
      managerId: m.manager.id,
      managerName: m.manager.name,
    })),
  );

  const make = (
    key: string,
    title: string,
    unit: string,
    valueFn: (ps: PlayerScore) => number,
    filter: (ps: PlayerScore) => boolean = () => true,
  ): LeaderboardCategory => ({
    key,
    title,
    unit,
    rows: all
      .filter((x) => filter(x.player))
      .map((x) => ({ ...x, value: valueFn(x.player) }))
      .sort(
        (a, b) =>
          b.value - a.value ||
          b.player.total - a.player.total ||
          a.player.player.name.localeCompare(b.player.player.name),
      )
      .slice(0, limit),
  });

  return [
    make("points", "Most Points", "pts", (p) => p.total),
    make("goals", "Top Scorers", "goals", (p) => p.totals.goals),
    make("assists", "Most Assists", "assists", (p) => p.totals.assists),
    make("motm", "Man of the Match", "MOTM", (p) => p.totals.motm),
    make(
      "glove",
      "Golden Glove",
      "pts",
      (p) => p.total,
      (p) => p.player.position === "GK",
    ),
    make(
      "defender",
      "Best Defender",
      "CS",
      (p) => p.totals.cleanSheets,
      (p) => isDefender(p.player.position) && p.player.position !== "GK",
    ),
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
