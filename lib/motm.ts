// ──────────────────────────────────────────────────────────────────────────
//  Read-time helpers over the hand-logged Man of the Match awards in
//  data/motm.ts. Used in three places, all keyed the same way (flag code +
//  normalised name) so a winner is recognised whether or not they were drafted:
//    • lib/playerStats.ts  — stamps motm onto a drafted player's merged match.
//    • lib/tournamentPlayers.ts — adds the +2 when scoring undrafted players.
//    • lib/league.ts       — builds the tournament-wide MOTM leaderboard.
// ──────────────────────────────────────────────────────────────────────────

import { motm, type MotmEntry } from "@/data/motm";
import { playerKey } from "./names";

export type { MotmEntry };
export const motmEntries = motm;

/** Opponent labels for matches where this player was named Man of the Match. */
export function motmForPlayer(country: string, name: string): string[] {
  const key = playerKey(country, name);
  return motm
    .filter((e) => playerKey(e.country, e.player) === key)
    .map((e) => e.opponent);
}

export interface MotmCount {
  name: string;
  country: string;
  count: number;
}

/** MOTM awards tallied per player across the whole tournament (most first). */
export function motmLeaders(): MotmCount[] {
  const by = new Map<string, MotmCount>();
  for (const e of motm) {
    const key = playerKey(e.country, e.player);
    const cur = by.get(key) ?? { name: e.player, country: e.country, count: 0 };
    cur.count += 1;
    by.set(key, cur);
  }
  return [...by.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}
