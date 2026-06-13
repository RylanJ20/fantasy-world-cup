// ─────────────────────────────────────────────────────────────────────────────
//  Builds data/motm.json — Man of the Match awards — fully automatically from
//  FotMob's free feed (the one stat ESPN never exposes). For each FINISHED World
//  Cup fixture we already imported from ESPN, we find the same match on FotMob,
//  read its Player of the Match, and reconcile the winner back to the player's
//  ESPN spelling — so the +2 ties to imported stats exactly like the old
//  hand-logged entries did (the app keys MOTM on flag-code + normalised name).
//
//  Must run AFTER import:stats — it reads data/tournament-players.json (every
//  player who appeared, in ESPN spelling) to resolve the winner's ESPN name.
//  Order in import:all:  fixtures → groups → stats → motm.
//
//  Resilience: prior awards are retained, so a transient FotMob hiccup (or a
//  match FotMob hasn't posted a MOTM for yet) never wipes the board.
//
//  Run:  npm run import:motm        (then commit data/motm.json)
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- API payloads are dynamic JSON */
import { readFileSync, writeFileSync } from "node:fs";
import { countryCode } from "@/lib/flags";
import { normalizeName } from "@/lib/names";
import type { MotmEntry } from "@/data/motm";
import {
  WORLD_CUP_PRIMARY_ID,
  fetchMatchDetails,
  fetchMatchesByDate,
} from "./fotmob";

interface Fixture {
  n: number;
  date: string;
  home: string;
  away: string;
  status: string;
}
interface TPlayer {
  name: string;
  country: string;
  matches: { opponent: string }[];
}

const readJson = (path: string) => JSON.parse(readFileSync(path, "utf8"));

/** Unordered flag-code key for a fixture's two teams ("cz|kr"), or null if either is unmapped. */
function pairKey(a: string, b: string): string | null {
  const ca = countryCode(a);
  const cb = countryCode(b);
  if (!ca || !cb) return null;
  return [ca, cb].sort().join("|");
}

/** UTC date string shifted by `days` (e.g. "2026-06-12" → "2026-06-11"). */
function dayShift(date: string, days: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Index of the unique candidate whose name matches `name` (-1 if none/ambiguous).
 * Handles FotMob's different word order (e.g. "In-Beom Hwang" ↔ ESPN's
 * "Hwang In-Beom") via a token-set match before falling back to surname.
 */
function matchName(name: string, candidates: string[]): number {
  const dn = normalizeName(name);
  const dt = dn.split(" ");
  const norm = candidates.map(normalizeName);
  const uniq = (idxs: number[]) => (idxs.length === 1 ? idxs[0] : -1);
  const idx = (pred: (n: string) => boolean) =>
    norm.flatMap((n, i) => (pred(n) ? [i] : []));

  let hit = uniq(idx((n) => n === dn));
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
  console.log("📡 Building Man of the Match from FotMob…");

  const fixtures: Fixture[] = readJson("data/fixtures.json");
  const tournamentPlayers: TPlayer[] = readJson("data/tournament-players.json");
  const finished = fixtures.filter((f) => f.status === "FINISHED");
  console.log(`   ${finished.length} finished fixture(s) to resolve.`);

  // Retain prior awards (keyed by the unordered nation pair) so a transient
  // FotMob miss never drops an award we'd already captured.
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

  // FotMob's matches-by-date, fetched once per UTC day (cached) and filtered to
  // World Cup matches only.
  const dayCache = new Map<string, any[]>();
  async function wcMatchesOn(date: string): Promise<any[]> {
    const cached = dayCache.get(date);
    if (cached) return cached;
    let leagues: any[] = [];
    try {
      leagues = (await fetchMatchesByDate(date.replaceAll("-", "")))?.leagues ?? [];
    } catch (e) {
      console.log(`   ⚠️  FotMob matches ${date}: ${(e as Error).message}`);
    }
    const matches = leagues
      .filter((l) => l.primaryId === WORLD_CUP_PRIMARY_ID)
      .flatMap((l) => l.matches ?? []);
    dayCache.set(date, matches);
    return matches;
  }

  const warnings: string[] = [];
  let resolved = 0;

  for (const f of finished) {
    const fk = pairKey(f.home, f.away);
    if (!fk) {
      warnings.push(`${f.home} vs ${f.away} — unmapped country name (add an alias to lib/flags.ts)`);
      continue;
    }

    // Locate the FotMob match (try the fixture's UTC day, then its neighbours —
    // kick-off can straddle midnight UTC).
    let fm: any | undefined;
    for (const d of [f.date, dayShift(f.date, -1), dayShift(f.date, 1)]) {
      const matches = await wcMatchesOn(d);
      fm = matches.find((m) => pairKey(m.home?.name ?? "", m.away?.name ?? "") === fk);
      if (fm) break;
    }
    if (!fm) {
      if (!byFixture.has(fk)) warnings.push(`${f.home} vs ${f.away} — no FotMob World Cup match found`);
      continue;
    }

    let details: any;
    try {
      details = await fetchMatchDetails(fm.id);
    } catch (e) {
      warnings.push(`${f.home} vs ${f.away} — matchDetails failed: ${(e as Error).message}`);
      continue;
    }

    const potm = details?.content?.matchFacts?.playerOfTheMatch;
    const fullName: string | undefined = potm?.name?.fullName;
    if (!potm || !fullName) {
      if (!byFixture.has(fk)) warnings.push(`${f.home} vs ${f.away} — no Player of the Match on FotMob yet`);
      continue;
    }

    // Which side won it? Prefer the FotMob team id, fall back to its team name.
    const winnerSideName =
      fm.home?.id === potm.teamId
        ? fm.home?.name
        : fm.away?.id === potm.teamId
          ? fm.away?.name
          : potm.teamName;
    const wc = countryCode(winnerSideName ?? "");
    const country =
      countryCode(f.home) === wc ? f.home : countryCode(f.away) === wc ? f.away : null;
    if (!country) {
      warnings.push(`${f.home} vs ${f.away} — couldn't place MOTM team "${winnerSideName}"`);
      continue;
    }
    const opponent = country === f.home ? f.away : f.home;

    // Reconcile FotMob's spelling to ESPN's (the winner appeared, so they're in
    // tournament-players.json). If we can't, keep FotMob's name and warn — the
    // award still shows on the board, but the +2 may not tie to imported stats.
    const roster = tournamentPlayers.filter((p) => countryCode(p.country) === wc);
    const i = matchName(fullName, roster.map((p) => p.name));
    const player = i >= 0 ? roster[i].name : fullName;
    if (i < 0) {
      warnings.push(
        `${player} (${country}) — FotMob MOTM not matched to an ESPN player; using FotMob spelling (the +2 may not apply)`,
      );
    }

    byFixture.set(fk, { player, country, opponent });
    resolved += 1;
  }

  const motm = [...byFixture.values()].sort(
    (a, b) => a.country.localeCompare(b.country) || a.player.localeCompare(b.player),
  );
  writeFileSync("data/motm.json", JSON.stringify(motm, null, 2) + "\n");
  console.log(`✅ motm: ${motm.length} award(s) (${resolved} resolved from FotMob this run).`);

  if (warnings.length) {
    console.log(`\n⚠️  ${warnings.length} note(s):`);
    for (const w of warnings) console.log(`   - ${w}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
