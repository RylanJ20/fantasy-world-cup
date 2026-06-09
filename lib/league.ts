// ──────────────────────────────────────────────────────────────────────────
//  Derived selectors over the league data. Everything the UI reads goes
//  through here so scoring is computed once, consistently.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import {
  scoreManager,
  type ManagerScore,
  type PlayerScore,
  type TeamScore,
} from "./scoring";

export const leagueMeta = { name: league.name, season: league.season };

/** All managers, scored and sorted by total points (highest first). */
export function getManagerScores(): ManagerScore[] {
  return league.managers
    .map(scoreManager)
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
