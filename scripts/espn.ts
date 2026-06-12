// ─────────────────────────────────────────────────────────────────────────────
//  Shared helpers for the ESPN World Cup importers. ESPN's public (undocumented)
//  site API needs no key and carries fixtures, live scores, group standings and
//  per-player match stats — so it powers fixtures.json, groups.json and
//  player-stats.json. If ESPN ever changes these endpoints, this is the one file
//  to adjust.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- ESPN API payloads are dynamic JSON */
import { countryCode, displayName } from "@/lib/flags";

const SITE = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world";
const CORE = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world";
// The "core" data API (different host) carries richer per-entity data — used to
// recover a player's listed position when a match only tags them "Substitute".
const CORE_DATA =
  "https://sports.core.api.espn.com/v2/sports/soccer/leagues/fifa.world";

// Generous window around the tournament (Jun 11 – Jul 19, 2026); the ranged
// scoreboard returns every match in one request.
export const DATE_RANGE = "20260601-20260801";

export async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (fantasy-world-cup importer)" },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} on ${url}`);
  }
  return res.json();
}

export const fetchScoreboard = () =>
  getJson(`${SITE}/scoreboard?dates=${DATE_RANGE}&limit=500`);
export const fetchStandings = () => getJson(`${CORE}/standings`);
export const fetchSummary = (eventId: string) =>
  getJson(`${SITE}/summary?event=${eventId}`);
/** Athlete profile — carries `position` even for players who only came on as subs. */
export const fetchAthlete = (athleteId: string) =>
  getJson(`${CORE_DATA}/athletes/${athleteId}`);

/** ESPN status `state` ("pre" | "in" | "post") → our fixtures.json status. */
export function mapStatus(ev: any): string {
  const type = ev?.status?.type ?? ev?.competitions?.[0]?.status?.type;
  const state = type?.state;
  if (state === "post") return "FINISHED";
  if (state === "in") return type?.name === "STATUS_HALFTIME" ? "PAUSED" : "IN_PLAY";
  return "TIMED";
}

/**
 * Maps each nation (flag code) to its group label ("Group A" … "Group L") from
 * the standings payload, so group-stage fixtures can be labelled by their teams.
 */
export function buildGroupMap(standings: any): Map<string, string> {
  const map = new Map<string, string>();
  for (const g of standings?.children ?? []) {
    const label: string = g.name ?? g.displayName ?? "";
    for (const e of g.standings?.entries ?? []) {
      const code = countryCode(e.team?.displayName ?? e.team?.name ?? "");
      if (code) map.set(code, label);
    }
  }
  return map;
}

const KO_LABELS: Record<string, string> = {
  "round-of-32": "Round of 32",
  "round-of-16": "Round of 16",
  quarterfinals: "Quarter-final",
  semifinals: "Semi-final",
  "3rd-place-match": "Third place",
  final: "Final",
};

/** Human stage label for an event: "Group A" or a knockout round. */
export function stageLabel(ev: any, groupMap: Map<string, string>): string {
  const slug: string = ev?.season?.slug ?? "";
  if (slug && slug !== "group-stage") return KO_LABELS[slug] ?? slug.replaceAll("-", " ");
  // Group stage: derive the group letter from either team.
  const comps = ev?.competitions?.[0]?.competitors ?? [];
  for (const c of comps) {
    const code = countryCode(c.team?.displayName ?? c.team?.name ?? "");
    const g = code && groupMap.get(code);
    if (g) return g;
  }
  return "Group stage";
}

/** Preferred display spelling for an ESPN team name (Türkiye, Cabo Verde, …). */
export const teamName = (espnName: string) => displayName(espnName);
