// ─────────────────────────────────────────────────────────────────────────────
//  Builds data/motm.json — Man of the Match awards — from FIFA's OFFICIAL list.
//
//  The 2026 award is the "Michelob ULTRA Superior Player of the Match", a fan
//  vote announced after each game. No stats feed carries it (ESPN has nothing;
//  FotMob/Sofascore only give their own algorithmic rating leader, which is a
//  different thing and was wrong repeatedly). FIFA publishes the authoritative
//  list itself, which we read as JSON (see scripts/fifa.ts) and parse here.
//
//  Each played line reads "Team1 score Team2 - Winner (Country)". We map the
//  teams + winner back to ESPN's spelling — country/opponent from fixtures.json,
//  the player name from tournament-players.json — so the +2 keys to imported
//  stats exactly like a drafted player. FIFA can list a result before ESPN marks
//  the match finished; when ESPN hasn't imported the player yet we fall back to
//  FIFA's spelling and warn (a manualOverride in data/motm.ts covers the gap).
//
//  Genuine FotMob/algorithm-vs-official disagreements are handled by the
//  manualOverrides list in data/motm.ts, which wins over this file.
//
//  Run AFTER import:stats (reads data/tournament-players.json). Order in
//  import:all:  fixtures → groups → stats → motm.
//
//  Run:  npm run import:motm        (then commit data/motm.json)
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { countryCode } from "@/lib/flags";
import { normalizeName } from "@/lib/names";
import type { MotmEntry } from "@/data/motm";
import { fetchPotmLines } from "./fifa";

interface Fixture {
  home: string;
  away: string;
}
interface TPlayer {
  name: string;
  country: string;
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

// A played result: "Team1 <score> Team2 [-–] Winner (Country)". Upcoming
// fixtures use " v " + "– Group - Stadium" (no score, no trailing "(Country)")
// and simply don't match.
const RESULT =
  /^(.+?)\s+\d+\s*[-–]\s*\d+\s+(.+?)\s+[-–]\s+(.+?)\s*\(([^)]+)\)\s*$/;

/** Drop any parenthetical (e.g. a "(4-2)" penalty annotation) from a team name. */
const cleanTeam = (s: string) => s.replace(/\(.*?\)/g, "").trim();

/** Strip FIFA's knockout-stage "Match NN – " line prefix. Group-stage rows are
 *  bare ("Mexico 2-0 South Africa - …") but from the Round of 32 on FIFA prefixes
 *  each row with "Match 73 – …", which otherwise folds into team1 ("Match 73 –
 *  South Africa"), fails to map, and silently drops every knockout award. */
const stripMatchNo = (s: string) => s.replace(/^Match\s+\d+\s*[–-]\s*/i, "");

/** Unordered flag-code key for a fixture's two teams ("cz|kr"), or null. */
function pairKey(a: string, b: string): string | null {
  const ca = countryCode(a);
  const cb = countryCode(b);
  if (!ca || !cb) return null;
  return [ca, cb].sort().join("|");
}

/**
 * Index of the unique candidate matching `name` (-1 if none/ambiguous). Tiers,
 * loosest last: exact → squashed (spacing-insensitive, e.g. FIFA "Inbeom" ↔ ESPN
 * "In-Beom") → token-set (word-order/extra-token) → shared surname.
 */
function matchName(name: string, candidates: string[]): number {
  const dn = normalizeName(name);
  const dsq = dn.replace(/ /g, "");
  const dt = dn.split(" ");
  const norm = candidates.map(normalizeName);
  const uniq = (idxs: number[]) => (idxs.length === 1 ? idxs[0] : -1);
  const idx = (pred: (n: string) => boolean) =>
    norm.flatMap((n, i) => (pred(n) ? [i] : []));

  let hit = uniq(idx((n) => n === dn));
  if (hit >= 0) return hit;
  hit = uniq(idx((n) => n.replace(/ /g, "") === dsq));
  if (hit >= 0) return hit;
  hit = uniq(
    idx((n) => {
      const at = n.split(" ");
      return dt.every((t) => at.includes(t)) || at.every((t) => dt.includes(t));
    }),
  );
  if (hit >= 0) return hit;
  return uniq(idx((n) => n.split(" ").at(-1) === dt.at(-1)));
}

async function main() {
  console.log("📡 Building Man of the Match from FIFA's official list…");

  const fixtures: Fixture[] = readJson("data/fixtures.json");
  const tournamentPlayers: TPlayer[] = readJson("data/tournament-players.json");

  let lines: string[];
  try {
    lines = await fetchPotmLines();
  } catch (e) {
    console.log(`   ⚠️  FIFA fetch failed (${(e as Error).message}); leaving data/motm.json unchanged.`);
    return;
  }

  // Retain prior awards (keyed by the unordered nation pair) so a transient FIFA
  // hiccup or a parsing miss never drops an award we'd already captured.
  let existing: MotmEntry[] = [];
  try {
    existing = readJson("data/motm.json");
  } catch {
    /* first run — no file yet */
  }
  const byFixture = new Map<string, MotmEntry>();
  for (const e of existing) {
    const k = pairKey(e.country, e.opponent);
    if (k) byFixture.set(k, e);
  }

  const warnings: string[] = [];
  let resolved = 0;

  for (const rawLine of lines) {
    const line = stripMatchNo(rawLine);
    const mt = RESULT.exec(line);
    if (!mt) continue;
    const team1 = cleanTeam(mt[1]);
    const team2 = cleanTeam(mt[2]);
    const winner = mt[3].trim();
    const wc = countryCode(mt[4].trim());
    if (!wc) {
      warnings.push(`"${line}" — unmapped winner country (add an alias to lib/flags.ts)`);
      continue;
    }

    const fk = pairKey(team1, team2);
    if (!fk) {
      warnings.push(`"${line}" — unmapped team name (add an alias to lib/flags.ts)`);
      continue;
    }

    // Resolve ESPN spelling (and validate the match) via the imported fixture.
    const fx = fixtures.find((f) => pairKey(f.home, f.away) === fk);
    if (!fx) {
      warnings.push(`"${line}" — no ESPN fixture for this pairing`);
      continue;
    }
    const country =
      countryCode(fx.home) === wc ? fx.home : countryCode(fx.away) === wc ? fx.away : null;
    if (!country) {
      warnings.push(`"${line}" — winner team isn't in the fixture`);
      continue;
    }
    const opponent = country === fx.home ? fx.away : fx.home;

    // Reconcile the winner to ESPN's spelling (so the +2 ties to imported stats).
    const roster = tournamentPlayers.filter((p) => countryCode(p.country) === wc);
    const i = matchName(winner, roster.map((p) => p.name));
    const player = i >= 0 ? roster[i].name : winner;
    if (i < 0) {
      warnings.push(
        `${player} (${country} vs ${opponent}) — not yet matched to an ESPN player; using FIFA spelling (the +2 applies once ESPN imports the match)`,
      );
    }

    byFixture.set(fk, { player, country, opponent });
    resolved += 1;
  }

  const motm = [...byFixture.values()].sort(
    (a, b) => a.country.localeCompare(b.country) || a.player.localeCompare(b.player),
  );
  writeFileSync("data/motm.json", JSON.stringify(motm, null, 2) + "\n");
  console.log(`✅ motm: ${motm.length} award(s) (${resolved} read from FIFA this run).`);

  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} note(s):`);
    for (const w of warnings) console.log(`   - ${w}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
