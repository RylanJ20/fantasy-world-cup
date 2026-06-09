// ──────────────────────────────────────────────────────────────────────────
//  Core data types for the Fantasy World Cup tracker.
//  The actual data lives in /data/league.ts — this file only describes shapes.
// ──────────────────────────────────────────────────────────────────────────

/** Roster positions. A valid squad is 1 GK, 2 CB, 1 DEF, 1 WB, 3 MID, 3 FWD. */
export type Position = "GK" | "CB" | "DEF" | "WB" | "MID" | "FWD";

/** Match result from the player's / team's perspective. */
export type Result = "W" | "D" | "L";

/**
 * One match's worth of raw stats for a drafted player.
 * Only fill in what actually happened — every numeric field defaults to 0
 * and `motm` defaults to false. `goalsConceded` should be set for the GK and
 * for any defender (CB / DEF / WB) so clean-sheet bonuses can be computed.
 */
export interface PlayerMatch {
  /** Short opponent / matchday label, e.g. "vs Brazil" or "R16 · Mexico". */
  opponent: string;
  goals?: number;
  assists?: number;
  shotsOnGoal?: number;
  /** Goalkeeper saves (2 pts each). */
  saves?: number;
  /** Penalty saves (5 pts each). */
  pkSaves?: number;
  /** Goals the player's team conceded this match (drives clean-sheet logic). */
  goalsConceded?: number;
  /** Team result — used for the GK win bonus (+3). */
  result?: Result;
  /** Man of the match (+2). */
  motm?: boolean;
}

export interface Player {
  name: string;
  position: Position;
  /** Real national team this player plays for. */
  country: string;
  matches: PlayerMatch[];
}

/** One match for a drafted national team. */
export interface TeamMatch {
  opponent: string;
  goalsFor?: number;
  goalsAgainst?: number;
  /** Final result. For knockout games decided on penalties, set this directly. */
  result: Result;
}

export interface DraftedTeam {
  country: string;
  matches: TeamMatch[];
}

export interface Manager {
  /** URL slug, e.g. "rylan". Must be unique. */
  id: string;
  name: string;
  /** Optional flavour text shown on the manager page. */
  tagline?: string;
  players: Player[];
  teams: DraftedTeam[];
}

export interface League {
  name: string;
  season: string;
  managers: Manager[];
}
