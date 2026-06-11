// ──────────────────────────────────────────────────────────────────────────
//  Reads data/tournament-leaders.json — real World Cup stat leaders across all
//  48 nations (not just drafted players), aggregated from ESPN match summaries
//  by scripts/import-stats.ts. Drafted players carry their manager(s) so the UI
//  can link them; undrafted players appear with no manager.
// ──────────────────────────────────────────────────────────────────────────

import data from "@/data/tournament-leaders.json";

export interface TournamentLeader {
  name: string;
  country: string;
  /** GK | DEF | MID | FWD (best-effort from ESPN's position). */
  position: string;
  value: number;
  managers: { id: string; name: string }[];
}

type Key = "goals" | "assists" | "saves" | "cleanSheets";
const TL = data as unknown as Record<Key, TournamentLeader[]>;

/** Ranked leaders for a category (already top-N, value > 0, manager-tagged). */
export const tournamentLeaders = (key: Key): TournamentLeader[] => TL[key] ?? [];

/** The single leader of a category, or null if no one has registered the stat. */
export const tournamentLeader = (key: Key): TournamentLeader | null =>
  tournamentLeaders(key)[0] ?? null;
