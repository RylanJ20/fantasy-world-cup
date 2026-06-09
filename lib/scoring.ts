// ──────────────────────────────────────────────────────────────────────────
//  Scoring engine. Pure functions — given raw match stats, produce points and
//  itemised breakdowns. All scoring rules live here in one place.
//
//  RULES
//  ─────
//  All players      Goal +10 · Assist +5 · Shot on goal +1 · MOTM +2
//  GK only          Save +2 · PK save +5 · Goal allowed -2 (each) · Win +3
//  GK + defenders   Clean sheet +3 · Only one goal allowed +1
//                   (defenders = GK, CB, DEF, WB)
//  Teams            Win +3 · Tie +1 · Shutout +5   (shutout STACKS with result)
// ──────────────────────────────────────────────────────────────────────────

import type {
  DraftedTeam,
  Manager,
  Player,
  PlayerMatch,
  Position,
  TeamMatch,
} from "./types";

export const POINTS = {
  GOAL: 10,
  ASSIST: 5,
  SHOT_ON_GOAL: 1,
  MOTM: 2,
  SAVE: 2,
  PK_SAVE: 5,
  GOAL_ALLOWED: -2,
  GK_WIN: 3,
  CLEAN_SHEET: 3,
  ONE_GOAL_ALLOWED: 1,
  TEAM_WIN: 3,
  TEAM_TIE: 1,
  TEAM_SHUTOUT: 5,
} as const;

/** Positions that earn clean-sheet / one-goal bonuses (GK + all defenders). */
const DEFENSIVE_POSITIONS: Position[] = ["GK", "CB", "DEF", "WB"];
export const isDefender = (p: Position) => DEFENSIVE_POSITIONS.includes(p);

export interface ScoreLine {
  label: string;
  /** Human-readable math, e.g. "2 × 10". */
  detail: string;
  count: number;
  points: number;
  /** "good" | "bad" — drives colour in the UI. */
  tone: "good" | "bad";
}

export interface PlayerMatchScore {
  match: PlayerMatch;
  points: number;
  lines: ScoreLine[];
}

export interface PlayerTotals {
  matchesPlayed: number;
  goals: number;
  assists: number;
  shotsOnGoal: number;
  saves: number;
  pkSaves: number;
  goalsConceded: number;
  cleanSheets: number;
  oneGoalGames: number;
  wins: number;
  motm: number;
}

export interface PlayerScore {
  player: Player;
  total: number;
  lines: ScoreLine[];
  perMatch: PlayerMatchScore[];
  totals: PlayerTotals;
}

export interface TeamMatchScore {
  match: TeamMatch;
  points: number;
  lines: ScoreLine[];
}

export interface TeamScore {
  team: DraftedTeam;
  total: number;
  record: { w: number; d: number; l: number; shutouts: number; gf: number; ga: number };
  perMatch: TeamMatchScore[];
  lines: ScoreLine[];
}

export interface ManagerScore {
  manager: Manager;
  total: number;
  playersTotal: number;
  teamsTotal: number;
  players: PlayerScore[];
  teams: TeamScore[];
  /** Bench picks — scored for display only; never added to totals. */
  bench: PlayerScore[];
}

const line = (
  label: string,
  count: number,
  per: number,
  tone: "good" | "bad" = "good",
): ScoreLine => ({
  label,
  count,
  points: count * per,
  detail: `${count} × ${per > 0 ? "+" : ""}${per}`,
  tone,
});

// ── Player scoring ─────────────────────────────────────────────────────────

function scorePlayerMatch(player: Player, m: PlayerMatch): PlayerMatchScore {
  const lines: ScoreLine[] = [];
  const gk = player.position === "GK";
  const def = isDefender(player.position);

  const goals = m.goals ?? 0;
  const assists = m.assists ?? 0;
  const sog = m.shotsOnGoal ?? 0;
  const saves = m.saves ?? 0;
  const pkSaves = m.pkSaves ?? 0;
  const gc = m.goalsConceded;

  if (goals) lines.push(line("Goal", goals, POINTS.GOAL));
  if (assists) lines.push(line("Assist", assists, POINTS.ASSIST));
  if (sog) lines.push(line("Shot on goal", sog, POINTS.SHOT_ON_GOAL));
  if (m.motm) lines.push(line("Man of the match", 1, POINTS.MOTM));

  if (gk) {
    if (saves) lines.push(line("Save", saves, POINTS.SAVE));
    if (pkSaves) lines.push(line("Penalty save", pkSaves, POINTS.PK_SAVE));
    if (typeof gc === "number" && gc > 0)
      lines.push(line("Goal allowed", gc, POINTS.GOAL_ALLOWED, "bad"));
    if (m.result === "W") lines.push(line("Win", 1, POINTS.GK_WIN));
  }

  if (def && typeof gc === "number") {
    if (gc === 0) lines.push(line("Clean sheet", 1, POINTS.CLEAN_SHEET));
    else if (gc === 1) lines.push(line("One goal allowed", 1, POINTS.ONE_GOAL_ALLOWED));
  }

  const points = lines.reduce((s, l) => s + l.points, 0);
  return { match: m, points, lines };
}

export function scorePlayer(player: Player): PlayerScore {
  const perMatch = player.matches.map((m) => scorePlayerMatch(player, m));
  const total = perMatch.reduce((s, pm) => s + pm.points, 0);

  const gk = player.position === "GK";
  const def = isDefender(player.position);

  const totals: PlayerTotals = {
    matchesPlayed: player.matches.length,
    goals: 0,
    assists: 0,
    shotsOnGoal: 0,
    saves: 0,
    pkSaves: 0,
    goalsConceded: 0,
    cleanSheets: 0,
    oneGoalGames: 0,
    wins: 0,
    motm: 0,
  };

  for (const m of player.matches) {
    totals.goals += m.goals ?? 0;
    totals.assists += m.assists ?? 0;
    totals.shotsOnGoal += m.shotsOnGoal ?? 0;
    totals.saves += m.saves ?? 0;
    totals.pkSaves += m.pkSaves ?? 0;
    totals.goalsConceded += m.goalsConceded ?? 0;
    if (m.motm) totals.motm += 1;
    if (gk && m.result === "W") totals.wins += 1;
    if (def && typeof m.goalsConceded === "number") {
      if (m.goalsConceded === 0) totals.cleanSheets += 1;
      else if (m.goalsConceded === 1) totals.oneGoalGames += 1;
    }
  }

  // Aggregate category lines for the breakdown panel.
  const lines: ScoreLine[] = [];
  if (totals.goals) lines.push(line("Goals", totals.goals, POINTS.GOAL));
  if (totals.assists) lines.push(line("Assists", totals.assists, POINTS.ASSIST));
  if (totals.shotsOnGoal)
    lines.push(line("Shots on goal", totals.shotsOnGoal, POINTS.SHOT_ON_GOAL));
  if (totals.motm) lines.push(line("Man of the match", totals.motm, POINTS.MOTM));
  if (gk) {
    if (totals.saves) lines.push(line("Saves", totals.saves, POINTS.SAVE));
    if (totals.pkSaves) lines.push(line("Penalty saves", totals.pkSaves, POINTS.PK_SAVE));
    if (totals.goalsConceded)
      lines.push(line("Goals allowed", totals.goalsConceded, POINTS.GOAL_ALLOWED, "bad"));
    if (totals.wins) lines.push(line("Wins", totals.wins, POINTS.GK_WIN));
  }
  if (def) {
    if (totals.cleanSheets)
      lines.push(line("Clean sheets", totals.cleanSheets, POINTS.CLEAN_SHEET));
    if (totals.oneGoalGames)
      lines.push(line("One goal allowed", totals.oneGoalGames, POINTS.ONE_GOAL_ALLOWED));
  }

  return { player, total, lines, perMatch, totals };
}

// ── Team scoring ───────────────────────────────────────────────────────────

function scoreTeamMatch(m: TeamMatch): TeamMatchScore {
  const lines: ScoreLine[] = [];
  const ga = m.goalsAgainst ?? 0;
  if (m.result === "W") lines.push(line("Win", 1, POINTS.TEAM_WIN));
  else if (m.result === "D") lines.push(line("Tie", 1, POINTS.TEAM_TIE));
  if (ga === 0) lines.push(line("Shutout", 1, POINTS.TEAM_SHUTOUT));
  const points = lines.reduce((s, l) => s + l.points, 0);
  return { match: m, points, lines };
}

export function scoreTeam(team: DraftedTeam): TeamScore {
  const perMatch = team.matches.map(scoreTeamMatch);
  const total = perMatch.reduce((s, tm) => s + tm.points, 0);

  const record = { w: 0, d: 0, l: 0, shutouts: 0, gf: 0, ga: 0 };
  for (const m of team.matches) {
    if (m.result === "W") record.w += 1;
    else if (m.result === "D") record.d += 1;
    else record.l += 1;
    if ((m.goalsAgainst ?? 0) === 0) record.shutouts += 1;
    record.gf += m.goalsFor ?? 0;
    record.ga += m.goalsAgainst ?? 0;
  }

  const lines: ScoreLine[] = [];
  if (record.w) lines.push(line("Wins", record.w, POINTS.TEAM_WIN));
  if (record.d) lines.push(line("Ties", record.d, POINTS.TEAM_TIE));
  if (record.shutouts) lines.push(line("Shutouts", record.shutouts, POINTS.TEAM_SHUTOUT));

  return { team, total, record, perMatch, lines };
}

// ── Manager + standings ────────────────────────────────────────────────────

export function scoreManager(manager: Manager): ManagerScore {
  const players = manager.players
    .map(scorePlayer)
    .sort((a, b) => b.total - a.total);
  const teams = manager.teams.map(scoreTeam).sort((a, b) => b.total - a.total);
  const bench = (manager.bench ?? [])
    .map(scorePlayer)
    .sort((a, b) => b.total - a.total);
  const playersTotal = players.reduce((s, p) => s + p.total, 0);
  const teamsTotal = teams.reduce((s, t) => s + t.total, 0);
  return {
    manager,
    players,
    teams,
    bench,
    playersTotal,
    teamsTotal,
    // Bench is intentionally excluded from the total.
    total: playersTotal + teamsTotal,
  };
}
