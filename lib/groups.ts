// ──────────────────────────────────────────────────────────────────────────
//  Real World Cup group tables (data/groups.json), with a lookup for which
//  managers drafted each nation so the /groups page can highlight them.
// ──────────────────────────────────────────────────────────────────────────

import groupsData from "@/data/groups.json";
import { league } from "@/data/league";
import { countryCode } from "./flags";

export interface GroupRow {
  position: number;
  team: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface GroupTable {
  group: string;
  table: GroupRow[];
}

export const groups = groupsData as GroupTable[];
export const hasGroups = groups.length > 0;

// country code → managers who drafted that nation as a team
const draftedBy = new Map<string, string[]>();
for (const m of league.managers) {
  for (const t of m.teams) {
    const c = countryCode(t.country);
    if (!c) continue;
    draftedBy.set(c, [...(draftedBy.get(c) ?? []), m.name]);
  }
}

/** Managers who drafted this nation (empty if none). */
export function draftedManagers(team: string): string[] {
  const c = countryCode(team);
  return c ? (draftedBy.get(c) ?? []) : [];
}
