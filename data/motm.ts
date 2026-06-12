// ════════════════════════════════════════════════════════════════════════════
//  MAN OF THE MATCH  —  the one stat ESPN can't give us, so you log it by hand.
// ════════════════════════════════════════════════════════════════════════════
//
//  Add one line per match as the awards come in. It works for ANY player at the
//  World Cup — drafted or not:
//    • Tournament-wide: they show up on the "Man of the Match" leaderboard and
//      earn +2 toward their tournament points total.
//    • If the winner happens to be a drafted player, the +2 also lands on their
//      manager's page automatically (matched by name + opponent) — no need to
//      also edit data/league.ts.
//
//  Use the player's and opponent's names as ESPN spells them (accents included),
//  e.g. "Julián Quiñones", "Hwang In-Beom", "Czechia". The opponent disambiguates
//  which match the award was for.
//
//      m("Hwang In-Beom", "South Korea", "Czechia")
//        └ player          └ their nation  └ who they played
// ════════════════════════════════════════════════════════════════════════════

export interface MotmEntry {
  /** Player name, spelled as ESPN does (so it ties to imported stats). */
  player: string;
  /** The player's national team. */
  country: string;
  /** Who they played — disambiguates the match. */
  opponent: string;
}

const m = (player: string, country: string, opponent: string): MotmEntry => ({
  player,
  country,
  opponent,
});

export const motm: MotmEntry[] = [
  // ── Matchday 1 (Jun 11) ──────────────────────────────────────────────────
  m("Julián Quiñones", "Mexico", "South Africa"), // Mexico 2–0 South Africa
  m("Hwang In-Beom", "South Korea", "Czechia"), // South Korea 2–1 Czechia
];
