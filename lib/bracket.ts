// ──────────────────────────────────────────────────────────────────────────
//  The knockout bracket. ESPN's fixtures encode the tree via placeholder labels
//  ("Round of 32 1 Winner", "Quarterfinal 2 Winner", …) — but those vanish once
//  a game is played and the real team is filled in. So the bracket TOPOLOGY (a
//  fixed property of the 48-team format) is captured statically below, verified
//  against the live placeholders, and live teams / scores / dates are bound onto
//  it from data/fixtures.json. This stays correct as results come in.
// ──────────────────────────────────────────────────────────────────────────

import { fixtures, type Fixture } from "./fixtures";
import { countryCode, displayName } from "./flags";

export type RoundKey = "r32" | "r16" | "qf" | "sf" | "final";

const ROUNDS: { key: RoundKey; stage: string; label: string; short: string }[] = [
  { key: "r32", stage: "Round of 32", label: "Round of 32", short: "R32" },
  { key: "r16", stage: "Round of 16", label: "Round of 16", short: "R16" },
  { key: "qf", stage: "Quarter-final", label: "Quarter-finals", short: "QF" },
  { key: "sf", stage: "Semi-final", label: "Semi-finals", short: "SF" },
  { key: "final", stage: "Final", label: "Final", short: "Final" },
];

// Winner-feeds-into topology: match id → its two feeder match ids [top, bottom],
// in home/away order. Verified to reconstruct the live ESPN bracket exactly.
const TOPOLOGY: Record<string, [string, string]> = {
  "r16-1": ["r32-1", "r32-3"],
  "r16-2": ["r32-2", "r32-5"],
  "r16-3": ["r32-4", "r32-6"],
  "r16-4": ["r32-7", "r32-8"],
  "r16-5": ["r32-11", "r32-12"],
  "r16-6": ["r32-9", "r32-10"],
  "r16-7": ["r32-13", "r32-15"],
  "r16-8": ["r32-14", "r32-16"],
  "qf-1": ["r16-1", "r16-2"],
  "qf-2": ["r16-5", "r16-6"],
  "qf-3": ["r16-3", "r16-4"],
  "qf-4": ["r16-7", "r16-8"],
  "sf-1": ["qf-1", "qf-2"],
  "sf-2": ["qf-3", "qf-4"],
  "final-1": ["sf-1", "sf-2"],
};
// The third-place match takes the two semi-final LOSERS.
const THIRD_FEEDERS: [string, string] = ["sf-1", "sf-2"];

export interface BracketTeam {
  name: string;
  code: string | null;
  score: number | null;
  winner: boolean;
}
export interface BracketSide {
  team: BracketTeam | null;
  /** Feeder match id when this side is still TBD (e.g. the R32 game it awaits). */
  feederId: string | null;
}
export interface BracketMatch {
  id: string;
  roundKey: RoundKey | "third";
  n: number;
  date: string | null;
  status: string;
  sides: [BracketSide, BracketSide];
  /** Feeder matches [top, bottom], or null for the Round of 32. */
  childIds: [string, string] | null;
  /** The match this winner advances to (null for the final). */
  nextId: string | null;
}
export interface BracketRound {
  key: RoundKey;
  label: string;
  short: string;
  /** Matches in top-to-bottom bracket order (so feeders sit beside their pair). */
  matches: BracketMatch[];
}
export interface Bracket {
  rounds: BracketRound[];
  thirdPlace: BracketMatch | null;
}

const matchId = (key: string, n: number) => `${key}-${n}`;

// Reverse of TOPOLOGY: feeder id → the match it advances into.
const NEXT: Record<string, string> = {};
for (const [parent, kids] of Object.entries(TOPOLOGY))
  for (const k of kids) NEXT[k] = parent;

function buildSides(
  f: Fixture | undefined,
  childIds: [string, string] | null,
): [BracketSide, BracketSide] {
  const make = (name: string | undefined, idx: 0 | 1): BracketSide => {
    const code = name ? countryCode(name) : null;
    if (f && name && code) {
      const finished = f.status === "FINISHED";
      const score = idx === 0 ? f.homeScore ?? null : f.awayScore ?? null;
      const winner =
        finished &&
        ((idx === 0 && f.winner === "HOME_TEAM") ||
          (idx === 1 && f.winner === "AWAY_TEAM"));
      return { team: { name: displayName(name), code, score, winner }, feederId: childIds?.[idx] ?? null };
    }
    return { team: null, feederId: childIds?.[idx] ?? null };
  };
  return [make(f?.home, 0), make(f?.away, 1)];
}

export function getBracket(): Bracket {
  // Knockout fixtures grouped by round, ordered by ESPN id → 1-based match number.
  const byRound = new Map<string, Fixture[]>();
  for (const f of fixtures) {
    const r = ROUNDS.find((x) => x.stage === f.stage);
    if (r) {
      const arr = byRound.get(r.key) ?? [];
      arr.push(f);
      byRound.set(r.key, arr);
    }
  }
  for (const arr of byRound.values()) arr.sort((a, b) => (a.n ?? 0) - (b.n ?? 0));

  // Every match, keyed by id.
  const matches = new Map<string, BracketMatch>();
  for (const r of ROUNDS) {
    (byRound.get(r.key) ?? []).forEach((f, i) => {
      const n = i + 1;
      const id = matchId(r.key, n);
      const childIds = (TOPOLOGY[id] as [string, string] | undefined) ?? null;
      matches.set(id, {
        id,
        roundKey: r.key,
        n,
        date: f.utcDate ?? f.date ?? null,
        status: f.status ?? "TIMED",
        sides: buildSides(f, childIds),
        childIds,
        nextId: NEXT[id] ?? null,
      });
    });
  }

  // Top-to-bottom layout order: in-order leaf traversal of the topology tree.
  const leaves = (id: string): string[] => {
    const kids = TOPOLOGY[id];
    return kids ? kids.flatMap(leaves) : [id];
  };
  const leafOrder = leaves("final-1");
  const leafPos = new Map(leafOrder.map((id, i) => [id, i]));
  const orderKey = (id: string) =>
    Math.min(...leaves(id).map((l) => leafPos.get(l) ?? 0));

  const rounds: BracketRound[] = ROUNDS.filter((r) => byRound.has(r.key)).map((r) => ({
    key: r.key,
    label: r.label,
    short: r.short,
    matches: [...matches.values()]
      .filter((m) => m.roundKey === r.key)
      .sort((a, b) => orderKey(a.id) - orderKey(b.id)),
  }));

  // Third-place play-off (separate from the championship path).
  const tpFix = (byRound.get("third") ?? []).length
    ? undefined
    : fixtures.find((f) => f.stage === "Third place");
  const thirdPlace: BracketMatch | null = tpFix
    ? {
        id: "third-1",
        roundKey: "third",
        n: 1,
        date: tpFix.utcDate ?? tpFix.date ?? null,
        status: tpFix.status ?? "TIMED",
        sides: buildSides(tpFix, THIRD_FEEDERS),
        childIds: THIRD_FEEDERS,
        nextId: null,
      }
    : null;

  return { rounds, thirdPlace };
}

/** The forward path of match ids from `startId` to the final (inclusive). */
export function pathToFinal(startId: string): string[] {
  const path: string[] = [];
  let cur: string | undefined = startId;
  while (cur) {
    path.push(cur);
    cur = NEXT[cur];
  }
  return path;
}
