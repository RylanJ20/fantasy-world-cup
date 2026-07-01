// ──────────────────────────────────────────────────────────────────────────
//  Joins the imported fixture list (data/fixtures.json) with the drafted
//  rosters so each match knows which managers have players/teams involved.
//  Powers the "Who's in action" page.
// ──────────────────────────────────────────────────────────────────────────

import fixturesData from "@/data/fixtures.json";
import { league } from "@/data/league";
import type { Player, Position, TeamMatch } from "./types";
import { countryCode } from "./flags";

export interface Fixture {
  n?: number;
  date: string;
  utcDate?: string | null;
  stage: string;
  home: string;
  away: string;
  status?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  /** Penalty-shootout score — present only on a knockout decided on spot-kicks. */
  homeShootout?: number | null;
  awayShootout?: number | null;
  /** API winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null (handles penalties). */
  winner?: string | null;
}

export interface InvolvedAsset {
  managerId: string;
  managerName: string;
  kind: "player" | "team";
  name: string;
  position?: string;
  country: string;
  side: "home" | "away";
}

export interface EnrichedFixture extends Fixture {
  assets: InvolvedAsset[];
}

export const fixtures = fixturesData as Fixture[];
export const hasFixtures = fixtures.length > 0;

const sameCountry = (a: string, b: string) => {
  const ca = countryCode(a);
  return ca !== null && ca === countryCode(b);
};

function sideOf(country: string, f: Fixture): "home" | "away" | null {
  if (sameCountry(country, f.home)) return "home";
  if (sameCountry(country, f.away)) return "away";
  return null;
}

/** Each occupant of a squad slot, windowed to the stint they held it. A normal
 *  slot yields one occupant spanning all time; a replaced slot yields the
 *  outgoing player (until the cutoff) then the incoming one (from the cutoff on),
 *  each under their OWN nation — so a fixture shows whoever held the slot then. */
interface SlotOccupant {
  name: string;
  position: Position;
  country: string;
  /** [fromMs, toMs) the occupant held the slot; ±Infinity at the open ends. */
  fromMs: number;
  toMs: number;
}
function slotOccupants(p: Player): SlotOccupant[] {
  const out: SlotOccupant[] = [];
  let cur: Player | undefined = p;
  let from = -Infinity;
  while (cur) {
    const cutoff =
      cur.replacedBy && cur.replacedOn ? Date.parse(cur.replacedOn) : Infinity;
    out.push({ name: cur.name, position: cur.position, country: cur.country, fromMs: from, toMs: cutoff });
    from = cutoff;
    cur = cur.replacedBy;
  }
  return out;
}

/**
 * Finished matches for a country, as TeamMatch[] for the scoring engine — so a
 * drafted team's points compute automatically from real results. The API's
 * `winner` field is used for the result (correct even on penalty shootouts);
 * shutout still keys off goals against in regulation/ET.
 */
export function resultsForCountry(country: string): TeamMatch[] {
  const out: TeamMatch[] = [];
  for (const f of fixtures) {
    if (f.status !== "FINISHED" || f.homeScore == null || f.awayScore == null) continue;
    const side = sideOf(country, f);
    if (!side) continue;
    const goalsFor = side === "home" ? f.homeScore : f.awayScore;
    const goalsAgainst = side === "home" ? f.awayScore : f.homeScore;
    let result: "W" | "D" | "L";
    if (f.winner === "DRAW") result = "D";
    else if (f.winner === "HOME_TEAM") result = side === "home" ? "W" : "L";
    else if (f.winner === "AWAY_TEAM") result = side === "away" ? "W" : "L";
    else result = goalsFor > goalsAgainst ? "W" : goalsFor < goalsAgainst ? "L" : "D";
    out.push({
      opponent: side === "home" ? f.away : f.home,
      goalsFor,
      goalsAgainst,
      result,
    });
  }
  return out;
}

/** Every fixture, annotated with the drafted players/teams playing in it. */
export function getEnrichedFixtures(): EnrichedFixture[] {
  return fixtures
    .map((f) => {
      const assets: InvolvedAsset[] = [];
      const fMs = Date.parse(f.utcDate ?? f.date);
      for (const m of league.managers) {
        for (const slot of m.players) {
          // Expand replaced slots into their occupants so the swapped-IN player
          // (a different nation) surfaces for their own matches, and each shows
          // only for fixtures inside their stint.
          for (const occ of slotOccupants(slot)) {
            const side = sideOf(occ.country, f);
            if (!side) continue;
            const windowed = occ.fromMs !== -Infinity || occ.toMs !== Infinity;
            if (
              windowed &&
              !(Number.isNaN(fMs)
                ? occ.fromMs === -Infinity
                : fMs >= occ.fromMs && fMs < occ.toMs)
            )
              continue;
            assets.push({
              managerId: m.id,
              managerName: m.name,
              kind: "player",
              name: occ.name,
              position: occ.position,
              country: occ.country,
              side,
            });
          }
        }
        for (const t of m.teams) {
          const side = sideOf(t.country, f);
          if (side)
            assets.push({
              managerId: m.id,
              managerName: m.name,
              kind: "team",
              name: t.country,
              country: t.country,
              side,
            });
        }
      }
      return { ...f, assets };
    })
    .sort(
      (a, b) =>
        (a.utcDate ?? a.date).localeCompare(b.utcDate ?? b.date) ||
        (a.n ?? 0) - (b.n ?? 0),
    );
}
