// ──────────────────────────────────────────────────────────────────────────
//  Derived selectors over the league data. Everything the UI reads goes
//  through here so scoring is computed once, consistently.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import type { Manager, Player } from "./types";
import { fixtures, resultsForCountry } from "./fixtures";
import { mergedPlayerMatches } from "./playerStats";
import { tournamentLeader, tournamentLeaders } from "./tournamentLeaders";
import {
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
  let topPlayer: { p: PlayerScore; mgr: Manager } | null = null;
  let topTeam: { t: TeamScore; mgr: Manager } | null = null;
  for (const m of scores) {
    for (const p of m.players)
      if (!topPlayer || p.total > topPlayer.p.total) topPlayer = { p, mgr: m.manager };
    for (const t of m.teams)
      if (!topTeam || t.total > topTeam.t.total) topTeam = { t, mgr: m.manager };
  }

  const cards: StripCard[] = [];
  if (topPlayer && topPlayer.p.total > 0)
    cards.push({
      key: "points",
      label: "Top points",
      name: topPlayer.p.player.name,
      meta: `${topPlayer.p.player.country} · ${topPlayer.mgr.name}`,
      value: topPlayer.p.total,
      unit: "pts",
      href: `/manager/${topPlayer.mgr.id}`,
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
  /** "fantasy" = drafted players by fantasy scoring; "tournament" = real WC stat. */
  scope: "fantasy" | "tournament";
  rows: LeaderRow[];
}

/**
 * Category leaderboards. Stat boards (goals, assists, saves, clean sheets) are
 * tournament-wide across ALL nations, with drafted players tagged by their
 * manager; fantasy boards (points, MOTM) stay limited to drafted players.
 */
export function getLeaderboards(limit = 10): LeaderboardCategory[] {
  const drafted = getManagerScores().flatMap((m) =>
    m.players.map((p) => ({ p, mgr: m.manager })),
  );

  const fantasy = (
    key: string,
    title: string,
    unit: string,
    valueFn: (p: PlayerScore) => number,
  ): LeaderboardCategory => ({
    key,
    title,
    unit,
    scope: "fantasy",
    rows: drafted
      .map((x) => ({
        name: x.p.player.name,
        country: x.p.player.country,
        position: x.p.player.position,
        value: valueFn(x.p),
        managerId: x.mgr.id,
        managerName: x.mgr.name,
      }))
      .filter((r) => r.value > 0) // empty board shows "No data yet" until points land
      .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
      .slice(0, limit),
  });

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
    fantasy("points", "Most Points", "pts", (p) => p.total),
    tournament("goals", "Top Scorers", "goals", "goals"),
    tournament("assists", "Most Assists", "assists", "assists"),
    fantasy("motm", "Man of the Match", "MOTM", (p) => p.totals.motm),
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
