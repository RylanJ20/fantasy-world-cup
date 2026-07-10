// ─────────────────────────────────────────────────────────────────────────────
//  Builds data/player-photos.json — a Wikipedia photo for each manager's CURRENT
//  best-performing player (their top fantasy scorer). The manager avatars across
//  the site (standings, podium, manager page) show that player's face instead of
//  the manager's initials, refreshing hands-free as leaders change.
//
//  The cache is keyed by player (flagCode|name) and grows monotonically: a photo
//  once resolved is kept even if that player later drops out of top spot, so a
//  leader who reclaims first place needs no re-fetch and a transient Wikipedia
//  hiccup never blanks an avatar. Only the current top performers are (re)fetched
//  each run — a handful of prominent players, so matches are reliable and cheap.
//
//  Run:  npm run import:photos        (then commit data/player-photos.json)
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { getManagerScores } from "@/lib/league";
import { playerKey } from "@/lib/names";
import { resolvePlayerPhoto } from "./wikipedia";

const FILE = "data/player-photos.json";

// A cached photo younger than this is reused without re-fetching. Long, because
// a player's photo rarely changes — and a new top performer is a cache miss, so
// leader changes are picked up regardless of this window.
const FRESH_MS = 24 * 60 * 60 * 1000;

interface PhotoEntry {
  name: string;
  country: string;
  /** Wikipedia article the photo came from. */
  title: string;
  photo: string;
  source: "wikipedia";
  /** ISO timestamp of the run that last resolved this entry. */
  updatedAt: string;
}

function loadCache(): Record<string, PhotoEntry> {
  try {
    return JSON.parse(readFileSync(FILE, "utf8")) as Record<string, PhotoEntry>;
  } catch {
    return {};
  }
}

async function main() {
  const cache = loadCache();
  const now = new Date().toISOString();

  const rows: {
    manager: string;
    player: string;
    country: string;
    outcome: "resolved" | "fresh" | "kept" | "failed" | "skipped";
  }[] = [];

  for (const m of getManagerScores()) {
    const top = m.players[0]; // players are pre-sorted by total, highest first
    // No one has scored yet → leave the manager on their initials avatar.
    if (!top || top.total <= 0) {
      rows.push({ manager: m.manager.name, player: "—", country: "", outcome: "skipped" });
      continue;
    }

    const { name, country } = top.player;
    const key = playerKey(country, name);

    // Steady-state fast path: this top performer already has a recent photo, so
    // skip the network entirely. Photos change far more slowly than scores, and
    // a NEW top performer is always a cache miss (fetched below), so leaders are
    // still picked up promptly. This keeps the every-run cost near zero and off
    // Wikipedia — the whole reason the photo step can ride along hands-free.
    const existing = cache[key];
    if (existing && Date.parse(existing.updatedAt) > Date.now() - FRESH_MS) {
      rows.push({ manager: m.manager.name, player: name, country, outcome: "fresh" });
      continue;
    }

    const photo = await resolvePlayerPhoto(name, country);

    if (photo) {
      cache[key] = {
        name,
        country,
        title: photo.title,
        photo: photo.photo,
        source: photo.source,
        updatedAt: now,
      };
      rows.push({ manager: m.manager.name, player: name, country, outcome: "resolved" });
    } else if (cache[key]) {
      // Keep the previously-resolved photo rather than blanking the avatar.
      rows.push({ manager: m.manager.name, player: name, country, outcome: "kept" });
    } else {
      rows.push({ manager: m.manager.name, player: name, country, outcome: "failed" });
    }
  }

  // Stable key order → clean diffs when the workflow commits.
  const sorted = Object.fromEntries(
    Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(FILE, JSON.stringify(sorted, null, 2) + "\n");

  const resolved = rows.filter((r) => r.outcome === "resolved").length;
  const fresh = rows.filter((r) => r.outcome === "fresh").length;
  const kept = rows.filter((r) => r.outcome === "kept").length;
  const failed = rows.filter((r) => r.outcome === "failed").length;
  console.log(
    `✅ photos: ${resolved} resolved · ${fresh} already fresh · ${kept} kept from cache · ${failed} unresolved · ${Object.keys(sorted).length} total in cache.`,
  );
  for (const r of rows) {
    const mark =
      r.outcome === "resolved"
        ? "✓"
        : r.outcome === "fresh"
          ? "="
          : r.outcome === "kept"
            ? "•"
            : r.outcome === "failed"
              ? "✗"
              : "–";
    console.log(
      `   ${mark} ${r.manager.padEnd(12)} ${r.player}${r.country ? ` (${r.country})` : ""}`,
    );
  }
  if (failed > 0) {
    console.log(
      `\n⚠️  ${failed} top performer(s) had no photo — those managers keep their initials avatar until a photo resolves.`,
    );
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
