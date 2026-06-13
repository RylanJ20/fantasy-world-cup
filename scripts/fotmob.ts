// ─────────────────────────────────────────────────────────────────────────────
//  Shared helpers for the FotMob importer. FotMob's public (undocumented) web API
//  lives under /api/data/* on www.fotmob.com and needs no key — just a
//  browser-like User-Agent. (The separate apigw.fotmob.com host requires a signed
//  "x-mas" header; this one does not.) It carries the one stat ESPN never exposes:
//  Player of the Match. If FotMob ever changes these endpoints, this is the one
//  file to adjust.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- FotMob API payloads are dynamic JSON */

const BASE = "https://www.fotmob.com/api/data";

// FotMob's competition id for the FIFA World Cup. Group and knockout matches all
// share this `primaryId` (the per-group `leagueId` differs), so it's how we pick
// World Cup matches out of a day's full fixture list.
export const WORLD_CUP_PRIMARY_ID = 77;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.fotmob.com/",
  Accept: "application/json",
};

export async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${url}`);
  return res.json();
}

/** All matches FotMob lists for a UTC day; `date` is "YYYYMMDD". */
export const fetchMatchesByDate = (date: string) =>
  getJson(`${BASE}/matches?date=${date}`);

/** Full match detail incl. `content.matchFacts.playerOfTheMatch`. */
export const fetchMatchDetails = (matchId: string | number) =>
  getJson(`${BASE}/matchDetails?matchId=${matchId}`);
