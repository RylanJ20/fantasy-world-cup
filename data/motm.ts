// ════════════════════════════════════════════════════════════════════════════
//  MAN OF THE MATCH  —  now auto-imported from FotMob (see scripts/import-motm.ts).
// ════════════════════════════════════════════════════════════════════════════
//
//  data/motm.json is regenerated every import cycle from FotMob's Player of the
//  Match, with each winner reconciled to their ESPN spelling so the +2 ties to
//  imported stats. It works for ANY player at the World Cup — drafted or not:
//    • Tournament-wide: they appear on the "Man of the Match" leaderboard and
//      earn +2 toward their tournament points total.
//    • If the winner is a drafted player, the +2 also lands on their manager's
//      page automatically (matched by name + opponent) — no need to edit
//      data/league.ts.
//
//  You normally never edit this file. Use `manualOverrides` only for a match
//  FotMob got wrong or hasn't posted — an override replaces the auto entry for
//  the SAME fixture (matched by the two nations). Spell the player and opponent
//  as ESPN does (accents included), e.g.:
//
//      m("Hwang In-Beom", "South Korea", "Czechia")
//        └ player          └ their nation  └ who they played
// ════════════════════════════════════════════════════════════════════════════

import auto from "./motm.json";
import { countryCode } from "@/lib/flags";

export interface MotmEntry {
  /** Player name, spelled as ESPN does (so it ties to imported stats). */
  player: string;
  /** The player's national team. */
  country: string;
  /** Who they played — disambiguates the match. */
  opponent: string;
}

/** Convenience constructor for `manualOverrides` entries. */
export const m = (player: string, country: string, opponent: string): MotmEntry => ({
  player,
  country,
  opponent,
});

// Manual overrides — normally empty. An entry here wins over the auto-imported
// award for the same fixture (its unordered nation pair).
const manualOverrides: MotmEntry[] = [
  // FotMob's rating algorithm picked Katić (Bosnia); the official award went to
  // Koné. Canada 1–1 Bosnia-Herzegovina, Jun 12.
  m("Ismaël Koné", "Canada", "Bosnia-Herzegovina"),
  // FotMob picked Douglas Santos; the official award went to Vinícius Júnior.
  // Brazil 1–1 Morocco, Jun 13.
  m("Vinícius Júnior", "Brazil", "Morocco"),
];

/** Unordered flag-code key for an entry's fixture ("cz|kr"). */
const fixtureKey = (e: MotmEntry) =>
  [countryCode(e.country) ?? e.country.toLowerCase(), countryCode(e.opponent) ?? e.opponent.toLowerCase()]
    .sort()
    .join("|");

const merged = new Map<string, MotmEntry>();
for (const e of auto as MotmEntry[]) merged.set(fixtureKey(e), e);
for (const e of manualOverrides) merged.set(fixtureKey(e), e); // override wins

export const motm: MotmEntry[] = [...merged.values()];
