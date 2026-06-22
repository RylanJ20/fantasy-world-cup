// ──────────────────────────────────────────────────────────────────────────
//  Merges ESPN-imported player stats (data/player-stats.json) with the manual
//  entries in data/league.ts. ESPN supplies the bulk (goals, assists, shots on
//  goal, saves, goals conceded, result); penalty / shootout saves are derived
//  from ESPN match commentary by scripts/import-penalties.ts and written into the
//  same player-stats.json. The league.ts `matches` array is a thin OVERLAY for
//  MOTM and any manual correction (incl. a penalty save the parser missed).
//  Overlay fields win; a manual match with no imported counterpart (e.g. a game
//  not yet imported) is kept as-is.
// ──────────────────────────────────────────────────────────────────────────

import autoData from "@/data/player-stats.json";
import type { Player, PlayerMatch } from "./types";
import { countryCode } from "./flags";
import { normalizeName, playerKey } from "./names";
import { motmForPlayer } from "./motm";

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
export function opponentCode(s: string): string | null {
  return countryCode(cleanOpp(s)) ?? countryCode(s);
}
const oppCode = opponentCode;

/** Do two opponent labels refer to the same match? Flag code first, then text. */
export function sameOpponent(a: string, b: string): boolean {
  const ca = oppCode(a);
  const cb = oppCode(b);
  if (ca != null && ca === cb) return true;
  return normalizeName(cleanOpp(a)) === normalizeName(cleanOpp(b));
}

/** Stamp `motm: true` onto any match whose opponent the player won MOTM against. */
function applyMotm(player: Player, matches: PlayerMatch[]): PlayerMatch[] {
  const opps = motmForPlayer(player.country, player.name);
  if (opps.length === 0) return matches;
  return matches.map((m) =>
    m.motm || opps.some((o) => sameOpponent(o, m.opponent)) ? { ...m, motm: true } : m,
  );
}

/** A drafted player's matches: ESPN auto stats with the manual overlay applied. */
export function mergedPlayerMatches(player: Player): PlayerMatch[] {
  const auto = autoPlayerMatches(player.country, player.name);
  const manual = player.matches ?? [];
  if (auto.length === 0) return applyMotm(player, manual);

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
  // MOTM is logged centrally in data/motm.ts — fold it in last so a winner gets
  // their +2 even when they were never hand-listed in data/league.ts.
  return applyMotm(player, merged);
}
