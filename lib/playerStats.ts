// ──────────────────────────────────────────────────────────────────────────
//  Merges ESPN-imported player stats (data/player-stats.json) with the manual
//  entries in data/league.ts. ESPN supplies the bulk (goals, assists, shots on
//  goal, saves, goals conceded, result); the league.ts `matches` array is a thin
//  OVERLAY for what ESPN can't give — MOTM and penalty / shootout saves — plus
//  any manual correction. Overlay fields win; a manual match with no imported
//  counterpart (e.g. a game not yet imported) is kept as-is.
// ──────────────────────────────────────────────────────────────────────────

import autoData from "@/data/player-stats.json";
import type { Player, PlayerMatch } from "./types";
import { countryCode } from "./flags";
import { normalizeName, playerKey } from "./names";

interface AutoEntry {
  country: string;
  name: string;
  matches: PlayerMatch[];
}
const STATS = autoData as unknown as Record<string, AutoEntry>;

/** ESPN-imported matches for a drafted player (empty until their team plays). */
export function autoPlayerMatches(country: string, name: string): PlayerMatch[] {
  return STATS[playerKey(country, name)]?.matches ?? [];
}

/** Strip "vs " / "R16 · " style prefixes from an opponent label. */
const cleanOpp = (s: string) => s.replace(/^.*·\s*/, "").replace(/^vs\s+/i, "").trim();

/** Opponent label → flag code, tolerating "vs Brazil", "R16 · Mexico" or "Brazil". */
function oppCode(s: string): string | null {
  return countryCode(cleanOpp(s)) ?? countryCode(s);
}

/** Do two opponent labels refer to the same match? Flag code first, then text. */
function sameOpponent(a: string, b: string): boolean {
  const ca = oppCode(a);
  const cb = oppCode(b);
  if (ca != null && ca === cb) return true;
  return normalizeName(cleanOpp(a)) === normalizeName(cleanOpp(b));
}

/** A drafted player's matches: ESPN auto stats with the manual overlay applied. */
export function mergedPlayerMatches(player: Player): PlayerMatch[] {
  const auto = autoPlayerMatches(player.country, player.name);
  const manual = player.matches ?? [];
  if (auto.length === 0) return manual;

  const used = new Set<PlayerMatch>();
  const merged = auto.map((a) => {
    const m = manual.find((x) => !used.has(x) && sameOpponent(x.opponent, a.opponent));
    if (!m) return a;
    used.add(m);
    // Manual fields win, but keep ESPN's opponent label for the match.
    return { ...a, ...m, opponent: a.opponent };
  });
  // Append manual-only matches that name a real opponent (a game ESPN lacks). An
  // unmatched overlay whose label resolves to no nation is almost certainly a
  // typo'd annotation — drop it rather than score a phantom duplicate match.
  for (const m of manual) {
    if (!used.has(m) && oppCode(m.opponent) != null) merged.push(m);
  }
  return merged;
}
