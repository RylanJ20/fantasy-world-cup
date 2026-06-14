// ════════════════════════════════════════════════════════════════════════════
//  MAN OF THE MATCH  —  auto-imported from FIFA's official list (scripts/import-motm.ts).
// ════════════════════════════════════════════════════════════════════════════
//
//  data/motm.json is regenerated every import cycle from FIFA's official
//  "Superior Player of the Match" award (a fan vote — the authoritative source),
//  with each winner reconciled to their ESPN spelling so the +2 ties to imported
//  stats. It works for ANY player at the World Cup — drafted or not:
//    • Tournament-wide: they appear on the "Man of the Match" leaderboard and
//      earn +2 toward their tournament points total.
//    • If the winner is a drafted player, the +2 also lands on their manager's
//      page automatically (matched by name + opponent) — no need to edit
//      data/league.ts.
//
//  You normally never edit this file. Use `manualOverrides` only when FIFA's
//  spelling can't be reconciled to ESPN's (a short name like "Vinicius Jr") or
//  for a one-off FIFA error — an override replaces the auto entry for the SAME
//  fixture (matched by the two nations). Spell the player and opponent as ESPN
//  does (accents included), e.g.:
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
  // FIFA lists him as "Vinicius Jr"; ESPN spells him "Vinícius Júnior" — the two
  // don't auto-reconcile, so pin the ESPN spelling. Brazil 1–1 Morocco, Jun 13.
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
