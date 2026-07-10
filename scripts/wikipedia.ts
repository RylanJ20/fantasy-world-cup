// ─────────────────────────────────────────────────────────────────────────────
//  Resolves a football player's photo from Wikipedia / Wikimedia Commons — the
//  one source with reliable World Cup coverage (ESPN carries no headshots for
//  these players; FIFA's uniform photos aren't reachable without per-player IDs).
//  Powers data/player-photos.json via scripts/import-photos.ts. Key-free; needs a
//  descriptive User-Agent per Wikimedia's API etiquette. If Wikipedia changes its
//  REST/action API shapes, this is the one file to adjust.
//
//  Strategy — canonical first, disambiguation-safe fallback:
//    1. REST summary for the exact name resolves the canonical article (handles
//       redirects). Accept it only if it has a thumbnail AND reads as a footballer
//       — so a same-named non-player can't slip through.
//    2. Otherwise fall back to a footballer-scoped search, taking Wikipedia's own
//       relevance order (so "Gabriel" → the drafted Brazilian, not a namesake).
//    3. HEAD-verify the final URL so a dead link is never stored (the Avatar has
//       no client-side onError fallback — it trusts these URLs).
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- Wikipedia API payloads are dynamic JSON */

// Wikimedia asks API clients to identify themselves with contact info.
const UA =
  "fantasy-world-cup-photos/1.0 (personal hobby project; contact rylan.jaquess@edglrd.com)";

const HEADERS = { "User-Agent": UA };

// Hard per-request timeout. Wikipedia throttles shared CI IPs, and Node's fetch
// has no default timeout — without this a slow response can hang the request
// indefinitely, which once stalled the whole auto-import workflow. Every fetch
// below is bounded by this and can only ever resolve to null on trouble.
const TIMEOUT_MS = 6000;

/** A resolved footballer photo. `source` is always "wikipedia" for now. */
export interface PlayerPhoto {
  /** Direct Wikimedia Commons thumbnail URL (already sized for an avatar). */
  photo: string;
  /** The Wikipedia article title the photo came from — logged for eyeballing. */
  title: string;
  source: "wikipedia";
}

// Reads like a footballer? Guards against matching a same-named non-player.
const looksLikeFootballer = (text: string): boolean =>
  /footbal|midfielder|forward|defender|goalkeeper|winger|striker/i.test(text);

async function getJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    // Timeout, network error, or bad JSON — treat as "no photo", never throw.
    return null;
  }
}

/** Canonical article for the exact name (follows redirects). */
async function viaSummary(name: string): Promise<PlayerPhoto | null> {
  const url =
    `https://en.wikipedia.org/api/rest_v1/page/summary/` +
    `${encodeURIComponent(name.replace(/ /g, "_"))}?redirect=true`;
  const j = await getJson(url);
  if (!j || j.type === "disambiguation") return null;
  const photo: string | undefined = j.thumbnail?.source;
  const desc = `${j.description ?? ""} ${j.extract ?? ""}`;
  if (!photo || !looksLikeFootballer(desc)) return null;
  return { photo, title: j.title ?? name, source: "wikipedia" };
}

/** Footballer-scoped search, honouring Wikipedia's relevance ranking. */
async function viaSearch(name: string, country: string): Promise<PlayerPhoto | null> {
  const u = new URL("https://en.wikipedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query",
    format: "json",
    prop: "pageimages|description",
    piprop: "thumbnail",
    pithumbsize: "400",
    generator: "search",
    gsrsearch: `${name} ${country} footballer`,
    gsrlimit: "6",
    gsrnamespace: "0",
  }).toString();
  const j = await getJson(u.toString());
  const pages: any[] = Object.values(j?.query?.pages ?? {}).sort(
    (a: any, b: any) => (a.index ?? 99) - (b.index ?? 99),
  );
  const hit = pages.find(
    (p) => p.thumbnail?.source && looksLikeFootballer(p.description ?? ""),
  );
  return hit
    ? { photo: hit.thumbnail.source, title: hit.title, source: "wikipedia" }
    : null;
}

/** True if the URL is live (HEAD 200) — never store a dead photo link. */
async function isLive(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Best photo for a footballer, or null if none can be confidently resolved.
 * Tries the canonical article first, then a footballer-scoped search, and
 * HEAD-verifies whatever it lands on.
 */
export async function resolvePlayerPhoto(
  name: string,
  country: string,
): Promise<PlayerPhoto | null> {
  const hit = (await viaSummary(name)) ?? (await viaSearch(name, country));
  if (hit && (await isLive(hit.photo))) return hit;
  return null;
}
