// ──────────────────────────────────────────────────────────────────────────
//  Read-time lookup for the best-performer avatar photos in data/player-photos.
//  json (written by scripts/import-photos.ts from Wikipedia). Keyed identically
//  to player-stats.json via playerKey, so a drafted player resolves the same way
//  on both sides. No scoring here — callers pass the current top performer.
// ──────────────────────────────────────────────────────────────────────────

import photoData from "@/data/player-photos.json";
import { playerKey } from "./names";

interface PhotoEntry {
  name: string;
  country: string;
  title: string;
  photo: string;
  source: string;
  updatedAt: string;
}
const PHOTOS = photoData as unknown as Record<string, PhotoEntry>;

/** Wikimedia photo URL for a player, or undefined if none has been resolved. */
export function playerPhoto(country: string, name: string): string | undefined {
  return PHOTOS[playerKey(country, name)]?.photo;
}
