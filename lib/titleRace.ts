// ──────────────────────────────────────────────────────────────────────────
//  The Title Race — the standings replayed matchday by matchday.
//
//  Every point a manager has now was earned on some real match date. This file
//  takes the SAME per-match scores that feed the live standings (via
//  getManagerScores) and pins each one to the day its fixture was played, then
//  rolls them up into a cumulative running total per manager. The result is a
//  frame-per-matchday timeline the /race scrubber animates through.
//
//  Because the deltas are the exact per-match points used in the real totals,
//  the final frame reconciles perfectly with the Standings table. Any point
//  that can't be dated (a hand-entered match with no matching fixture) is folded
//  into the last frame so the running total never drifts from the truth.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import { getManagerScores } from "./league";
import { fixtures, type Fixture } from "./fixtures";
import { opponentCode } from "./playerStats";
import { countryCode } from "./flags";

/** Stable per-manager colour, keyed in league (draft) order so it never shifts
 *  with the standings. Eight managers, eight hues that read on the dark pitch. */
const PALETTE = [
  "#5dffa0", // turf green
  "#ffd96b", // gold
  "#38bdf8", // sky
  "#ff5a5f", // red
  "#ffb020", // amber
  "#c084fc", // violet
  "#f472b6", // pink
  "#2dd4bf", // teal
] as const;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export interface RaceManager {
  id: string;
  name: string;
  color: string;
}

export interface RaceEntry {
  id: string;
  /** Cumulative fantasy points through this matchday. */
  total: number;
  /** Points gained on this matchday alone. */
  gained: number;
  /** Competition rank at this matchday (ties share a rank: 1, 2, 2, 4…). */
  rank: number;
}

export interface RaceFrame {
  /** Calendar day, YYYY-MM-DD. */
  date: string;
  /** Short display label, e.g. "Jun 14". */
  label: string;
  /** Coarse stage in play, e.g. "Group Stage" or "Round of 16". */
  stage: string;
  /** Finished fixtures on this day. */
  matchesPlayed: number;
  /** Every manager, sorted best-first by cumulative total. */
  entries: RaceEntry[];
}

export interface TitleRace {
  managers: RaceManager[];
  frames: RaceFrame[];
  /** Highest cumulative total reached by anyone, for y-axis scaling (min 1). */
  maxTotal: number;
}

// World Cup 2026 is played across North America, and the imported `date` field
// is just the UTC calendar day — so a 00:30-UTC kickoff (a US evening game) lands
// on the *next* day. Bucket matches by their local host-side date instead, using
// the westmost host zone (Pacific) so every evening game stays on its true
// matchday rather than rolling forward.
const MATCHDAY_TZ = "America/Los_Angeles";
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MATCHDAY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The local matchday a fixture belongs to (YYYY-MM-DD), not the UTC instant. */
function dayOf(f: Fixture): string {
  if (f.utcDate) {
    const d = new Date(f.utcDate);
    if (!Number.isNaN(d.getTime())) {
      const part = (t: string) =>
        dayFormatter.formatToParts(d).find((p) => p.type === t)?.value ?? "";
      return `${part("year")}-${part("month")}-${part("day")}`;
    }
  }
  return (f.date || "").slice(0, 10);
}

/** Unordered key for the pair of countries in a fixture, by flag code. */
function pairKey(a: string, b: string): string | null {
  const ca = countryCode(a);
  const cb = countryCode(b);
  if (!ca || !cb) return null;
  return ca < cb ? `${ca}|${cb}` : `${cb}|${ca}`;
}

/** "Group C" → "Group Stage"; knockout stages pass through unchanged. */
function coarseStage(stage: string): string {
  return /^group/i.test(stage) ? "Group Stage" : stage;
}

function fmtLabel(day: string): string {
  const [, mo, d] = day.split("-").map(Number);
  if (!mo || !d) return day;
  return `${MONTHS[mo - 1]} ${d}`;
}

export function getTitleRace(): TitleRace {
  const scores = getManagerScores();
  const managers: RaceManager[] = league.managers.map((m, i) => ({
    id: m.id,
    name: m.name,
    color: PALETTE[i % PALETTE.length],
  }));
  const nameById = new Map(managers.map((m) => [m.id, m.name]));

  // ── Index finished fixtures: pair → match days, and day → stage / count. ──
  const datesByPair = new Map<string, string[]>();
  const stageByDay = new Map<string, string>();
  const matchesByDay = new Map<string, number>();
  const finished = fixtures
    .filter((f) => f.status === "FINISHED")
    .sort((a, b) => (a.utcDate ?? a.date).localeCompare(b.utcDate ?? b.date));

  for (const f of finished) {
    const day = dayOf(f);
    if (!day) continue;
    matchesByDay.set(day, (matchesByDay.get(day) ?? 0) + 1);
    stageByDay.set(day, coarseStage(f.stage)); // later fixture wins → most-advanced
    const key = pairKey(f.home, f.away);
    if (!key) continue;
    const arr = datesByPair.get(key) ?? [];
    arr.push(day);
    datesByPair.set(key, arr);
  }
  for (const arr of datesByPair.values()) arr.sort();

  const days = [...matchesByDay.keys()].sort();
  if (days.length === 0) return { managers, frames: [], maxTotal: 1 };
  const lastDay = days[days.length - 1];

  // ── Attribute each scored match to its matchday. ──
  // deltas[managerId][day] = points earned that day.
  const deltas = new Map<string, Map<string, number>>();
  for (const m of managers) deltas.set(m.id, new Map());
  const add = (id: string, day: string, pts: number) => {
    if (pts === 0) return;
    const d = deltas.get(id)!;
    d.set(day, (d.get(day) ?? 0) + pts);
  };

  // Find the matchday for one asset's match. `consumed` tracks repeat meetings of
  // the same pair (e.g. a group rematch in the knockouts) so they map to distinct
  // days in chronological order rather than both landing on the first meeting.
  const dayForMatch = (
    country: string,
    opponentLabel: string,
    consumed: Map<string, number>,
  ): string | null => {
    const ca = countryCode(country);
    const cb = opponentCode(opponentLabel);
    if (!ca || !cb) return null;
    const key = ca < cb ? `${ca}|${cb}` : `${cb}|${ca}`;
    const arr = datesByPair.get(key);
    if (!arr || arr.length === 0) return null;
    const used = consumed.get(key) ?? 0;
    consumed.set(key, used + 1);
    return arr[Math.min(used, arr.length - 1)];
  };

  for (const m of scores) {
    const id = m.manager.id;

    for (const p of m.players) {
      const consumed = new Map<string, number>();
      let dated = 0;
      const dateMatches = (country: string, perMatch: typeof p.perMatch) => {
        for (const pm of perMatch) {
          if (pm.points === 0) continue;
          const day = dayForMatch(country, pm.match.opponent, consumed);
          if (day) {
            add(id, day, pm.points);
            dated += pm.points;
          }
        }
      };
      dateMatches(p.player.country, p.perMatch);
      // A replaced slot: date the OUTGOING player's frozen games under THEIR own
      // nation (it may differ from the incoming player's), so their pre-cutoff
      // points land on the right matchday rather than the remainder fold.
      if (p.replaced) {
        dateMatches(p.replaced.previous.country, p.replaced.previousScore.perMatch);
      }
      // Fold any undated remainder onto the final day so the running total can
      // never drift away from this slot's true season total.
      add(id, lastDay, p.total - dated);
    }

    for (const t of m.teams) {
      const consumed = new Map<string, number>();
      let dated = 0;
      for (const tmatch of t.perMatch) {
        if (tmatch.points === 0) continue;
        const day = dayForMatch(t.team.country, tmatch.match.opponent, consumed);
        if (day) {
          add(id, day, tmatch.points);
          dated += tmatch.points;
        }
      }
      add(id, lastDay, t.total - dated);
    }
  }

  // ── Roll deltas into a cumulative frame per matchday. ──
  const running = new Map<string, number>(managers.map((m) => [m.id, 0]));
  let maxTotal = 1;
  const frames: RaceFrame[] = days.map((day) => {
    const entries: RaceEntry[] = managers.map((m) => {
      const gained = deltas.get(m.id)!.get(day) ?? 0;
      const total = (running.get(m.id) ?? 0) + gained;
      running.set(m.id, total);
      if (total > maxTotal) maxTotal = total;
      return { id: m.id, total, gained, rank: 0 };
    });

    // Sort best-first, then assign competition ranks (ties share a rank).
    entries.sort(
      (a, b) =>
        b.total - a.total ||
        (nameById.get(a.id) ?? "").localeCompare(nameById.get(b.id) ?? ""),
    );
    let lastTotal: number | null = null;
    let lastRank = 0;
    entries.forEach((e, i) => {
      const tied = e.total === lastTotal;
      e.rank = tied ? lastRank : i + 1;
      lastTotal = e.total;
      lastRank = e.rank;
    });

    return {
      date: day,
      label: fmtLabel(day),
      stage: stageByDay.get(day) ?? "",
      matchesPlayed: matchesByDay.get(day) ?? 0,
      entries,
    };
  });

  return { managers, frames, maxTotal };
}
