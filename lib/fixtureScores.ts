// ──────────────────────────────────────────────────────────────────────────
//  Joins the enriched fixtures with the scoring engine so each FINISHED match
//  knows how many fantasy points every involved player/team generated — both
//  per asset and as a per-manager subtotal for that match. Powers the points
//  breakdown on the "Who's in action" fixtures page.
//
//  Lives apart from lib/fixtures.ts to avoid a circular import: lib/league.ts
//  imports lib/fixtures.ts, and this module imports lib/league.ts.
// ──────────────────────────────────────────────────────────────────────────

import {
  getEnrichedFixtures,
  type EnrichedFixture,
  type InvolvedAsset,
} from "./fixtures";
import { getManagerScores } from "./league";
import { sameOpponent } from "./playerStats";
import type { ManagerScore, ScoreLine } from "./scoring";

export interface ScoredAsset extends InvolvedAsset {
  /** Points this asset generated IN THIS MATCH (0 if it didn't feature / no stats). */
  points: number;
  /** Itemised scoring lines for this match (empty when nothing was recorded). */
  lines: ScoreLine[];
  /** True when a matching match was found in the scoring data. */
  played: boolean;
}

export interface ManagerMatchScore {
  managerId: string;
  managerName: string;
  /** Sum of this manager's asset points in the match. */
  points: number;
  /** This manager's involved assets, sorted points-high-first. */
  assets: ScoredAsset[];
}

export interface ScoredFixture extends EnrichedFixture {
  finished: boolean;
  /** Per-manager subtotals + their assets (populated only for finished games). */
  managers: ManagerMatchScore[];
}

const isFinished = (status?: string) => status === "FINISHED";

/**
 * Every fixture, plus — for finished games — a per-manager points breakdown.
 * Each involved player/team is matched to its scored match by the opposing
 * country; the index is consumed so two meetings with the same opponent (e.g.
 * group stage then a knockout) attribute to different fixtures.
 */
export function getScoredFixtures(): ScoredFixture[] {
  const enriched = getEnrichedFixtures(); // chronological — drives consumption order
  const byManager = new Map<string, ManagerScore>(
    getManagerScores().map((m) => [m.manager.id, m]),
  );

  const usedPlayer = new Map<string, Set<number>>();
  const usedTeam = new Map<string, Set<number>>();
  const consumed = (map: Map<string, Set<number>>, key: string) => {
    const set = map.get(key) ?? new Set<number>();
    map.set(key, set);
    return set;
  };

  return enriched.map((f) => {
    if (!isFinished(f.status)) return { ...f, finished: false, managers: [] };

    const scored: ScoredAsset[] = f.assets.map((a) => {
      const opp = a.side === "home" ? f.away : f.home;
      const ms = byManager.get(a.managerId);

      // Player and team scores share a shape: a `perMatch` list whose entries
      // carry an opponent label, the match points, and the itemised lines. For a
      // replaced slot, the current occupant matches the top-level player; the
      // swapped-OUT occupant is scored under `replaced.previousScore`.
      const playerPerMatch = () => {
        const players = ms?.players ?? [];
        const cur = players.find(
          (p) => p.player.name === a.name && p.player.country === a.country,
        );
        if (cur) return cur.perMatch;
        const prev = players.find(
          (p) =>
            p.replaced?.previous.name === a.name &&
            p.replaced.previous.country === a.country,
        );
        return prev?.replaced?.previousScore.perMatch;
      };
      const perMatch =
        a.kind === "player"
          ? playerPerMatch()
          : ms?.teams.find((t) => t.team.country === a.country)?.perMatch;

      const key =
        a.kind === "player"
          ? `${a.managerId}|${a.country}|${a.name}`
          : `${a.managerId}|${a.country}`;
      const used = consumed(a.kind === "player" ? usedPlayer : usedTeam, key);

      const idx =
        perMatch?.findIndex(
          (m, i) => !used.has(i) && sameOpponent(m.match.opponent, opp),
        ) ?? -1;

      if (perMatch && idx >= 0) {
        used.add(idx);
        const m = perMatch[idx];
        return { ...a, points: m.points, lines: m.lines, played: true };
      }
      return { ...a, points: 0, lines: [], played: false };
    });

    const map = new Map<string, ManagerMatchScore>();
    for (const sa of scored) {
      let entry = map.get(sa.managerId);
      if (!entry) {
        entry = {
          managerId: sa.managerId,
          managerName: sa.managerName,
          points: 0,
          assets: [],
        };
        map.set(sa.managerId, entry);
      }
      entry.points += sa.points;
      entry.assets.push(sa);
    }

    const managers = [...map.values()]
      .map((m) => ({
        ...m,
        assets: [...m.assets].sort((a, b) => b.points - a.points),
      }))
      .sort(
        (a, b) => b.points - a.points || a.managerName.localeCompare(b.managerName),
      );

    return { ...f, finished: true, managers };
  });
}
