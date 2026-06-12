// ──────────────────────────────────────────────────────────────────────────
//  Reads data/tournament-players.json — per-match stats for EVERY player who
//  has appeared at the World Cup (all 48 nations), written by
//  scripts/import-stats.ts. This is what lets the Points leaderboard rank the
//  whole tournament, not just drafted players. Drafted players are tagged with
//  their manager(s) here and scored on their manager's page instead, so the two
//  never disagree — this module only scores the UNDRAFTED field.
// ──────────────────────────────────────────────────────────────────────────

import data from "@/data/tournament-players.json";
import type { Player, PlayerMatch, Position } from "./types";
import { scorePlayer } from "./scoring";
import { motmForPlayer } from "./motm";
import { sameOpponent } from "./playerStats";

export interface TournamentPlayer {
  name: string;
  country: string;
  /** Best-effort group from ESPN: "GK" | "DEF" | "MID" | "FWD" | "". */
  position: string;
  managers: { id: string; name: string }[];
  matches: PlayerMatch[];
}
const TP = data as unknown as TournamentPlayer[];

/** ESPN's best-effort group → a Position the scoring engine understands. An
 *  unknown role scores as a plain outfielder (no GK or clean-sheet bonuses). */
function toPosition(group: string): Position {
  if (group === "GK") return "GK";
  if (group === "DEF") return "DEF";
  if (group === "FWD") return "FWD";
  return "MID";
}

export interface TournamentPlayerScore {
  name: string;
  country: string;
  position: string;
  value: number;
}

/** Fantasy points for every UNDRAFTED player (drafted ones are scored on their
 *  manager's page). MOTM from data/motm.ts is folded in before scoring. */
export function undraftedPlayerScores(): TournamentPlayerScore[] {
  return TP.filter((e) => e.managers.length === 0).map((e) => {
    const opps = motmForPlayer(e.country, e.name);
    const matches: PlayerMatch[] =
      opps.length === 0
        ? e.matches
        : e.matches.map((m) =>
            m.motm || opps.some((o) => sameOpponent(o, m.opponent))
              ? { ...m, motm: true }
              : m,
          );
    const player: Player = {
      name: e.name,
      position: toPosition(e.position),
      country: e.country,
      matches,
    };
    return {
      name: e.name,
      country: e.country,
      // Raw ESPN group for display (blank → shown as "—" rather than a guessed
      // role); scoring above already normalised it through toPosition().
      position: e.position,
      value: scorePlayer(player).total,
    };
  });
}

/** Best-effort position group for a player, "" if unknown / never appeared. */
export function tournamentPosition(country: string, name: string): string {
  const nc = name.toLowerCase();
  const found = TP.find(
    (e) => e.country === country && e.name.toLowerCase() === nc,
  );
  return found?.position ?? "";
}
