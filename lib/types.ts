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
  /** ISO kickoff (UTC), stamped by the ESPN import. Drives mid-tournament
   *  replacement windowing — a swapped-in player only counts matches on/after
   *  the cutoff. Absent on hand-entered overlay rows that name no fixture. */
  date?: string;
  /** ESPN fixture id, stamped by the import alongside `date`. */
  fixtureId?: number;
  goals?: number;
  assists?: number;
  shotsOnGoal?: number;
  /** Goalkeeper saves (2 pts each). */
  saves?: number;
  /** Penalty saves in the run of play (5 pts each). */
  pkSaves?: number;
  /** Penalty saves in a penalty shootout (3 pts each). */
  shootoutSaves?: number;
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
  /** Optional flavour note shown under the player's name (e.g. an inside joke). */
  note?: string;

  // ── Mid-tournament replacement (authoring; set via the `swap()` builder) ──
  /** The player who takes over this slot from `replacedOn`. Replace like-for-
   *  like position so the squad shape (1 GK · 2 CB · 1 DEF · 1 WB · 3 MID · 3
   *  FWD) is preserved. */
  replacedBy?: Player;
  /** ISO cutoff. This player keeps points from matches BEFORE it; `replacedBy`
   *  scores matches ON/AFTER it. */
  replacedOn?: string;

  /** Resolved by the stat-merge layer (lib/league.ts) — never authored. The
   *  previous occupant of a replaced slot, carrying only their pre-cutoff
   *  matches (their "frozen" contribution). Drives the swap display. */
  replacedFrom?: { previous: Player; on: string };
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
  /** Optional bench / substitutes. Shown on the page but NOT counted in totals. */
  bench?: Player[];
}

export interface League {
  name: string;
  season: string;
  /** ISO date-time of the first match. Drives the kickoff countdown. */
  kickoff: string;
  managers: Manager[];
}
