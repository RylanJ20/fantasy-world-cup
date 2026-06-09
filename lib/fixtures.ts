// ──────────────────────────────────────────────────────────────────────────
//  Joins the imported fixture list (data/fixtures.json) with the drafted
//  rosters so each match knows which managers have players/teams involved.
//  Powers the "Who's in action" page.
// ──────────────────────────────────────────────────────────────────────────

import fixturesData from "@/data/fixtures.json";
import { league } from "@/data/league";
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

/** Every fixture, annotated with the drafted players/teams playing in it. */
export function getEnrichedFixtures(): EnrichedFixture[] {
  return fixtures
    .map((f) => {
      const assets: InvolvedAsset[] = [];
      for (const m of league.managers) {
        for (const p of m.players) {
          const side = sideOf(p.country, f);
          if (side)
            assets.push({
              managerId: m.id,
              managerName: m.name,
              kind: "player",
              name: p.name,
              position: p.position,
              country: p.country,
              side,
            });
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
