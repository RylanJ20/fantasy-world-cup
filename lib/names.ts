// ──────────────────────────────────────────────────────────────────────────
//  Name normalisation + the lookup key that ties a drafted player to their
//  auto-imported ESPN stats. Used by both the importer (scripts/) and the
//  read-time merge (lib/playerStats.ts), so the key is computed identically on
//  both sides. No data imports here, so the importer can use it freely.
// ──────────────────────────────────────────────────────────────────────────

import { countryCode } from "./flags";

/** Lowercase, strip accents/punctuation, collapse spaces — for fuzzy matching. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[._'’-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Stable key for a drafted player: "<flagCode>|<normalised name>". */
export function playerKey(country: string, name: string): string {
  return `${countryCode(country) ?? country.trim().toLowerCase()}|${normalizeName(name)}`;
}
