// ─────────────────────────────────────────────────────────────────────────────
//  Shared helpers for the FIFA Player-of-the-Match importer. FIFA's official
//  award (the "Michelob ULTRA Superior Player of the Match", a fan vote) is the
//  one stat no stats feed carries — ESPN doesn't have it, and FotMob/Sofascore
//  only expose their own algorithmic rating leader, which is a different thing.
//  FIFA publishes the authoritative list itself, served as JSON by the FIFA+ web
//  CMS (cxm-api.fifa.com). Key-free; needs a browser-like User-Agent. If FIFA
//  changes the article slug or CMS shape, this is the one file to adjust.
// ─────────────────────────────────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any -- FIFA CMS payloads are dynamic JSON */

const BASE = "https://cxm-api.fifa.com/fifaplusweb/api";
// The published article that lists every official Player of the Match winner,
// updated by FIFA after every game.
const POTM_SLUG = "michelob-ultra-superior-player-of-match-winner";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.fifa.com/",
  Accept: "application/json",
};

export async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${url}`);
  return res.json();
}

/** Flattens a CMS rich-text node tree to plain text, preserving line breaks. */
function flatten(node: any): string {
  if (Array.isArray(node)) return node.map(flatten).join("");
  if (node && typeof node === "object") {
    if (node.nodeType === "text") return node.value ?? "";
    if (node.nodeType === "hr") return "\n";
    return (node.content ?? []).map(flatten).join("");
  }
  return "";
}

/**
 * Fetches the Player-of-the-Match article and returns its body as trimmed text
 * lines (one per match/heading). Resolves page → article-section endpoint →
 * section, so a changing entry id is followed dynamically.
 */
export async function fetchPotmLines(): Promise<string[]> {
  const page = await getJson(`${BASE}/pages/articles/${POTM_SLUG}`);
  const section = (page.sections ?? []).find((s: any) => s.entryType === "article");
  if (!section?.entryEndpoint) throw new Error("FIFA POTM article: no article section");
  const body = await getJson(
    `${BASE}/${String(section.entryEndpoint).replace(/^\/+/, "")}`,
  );
  const richtext = body?.richtext;
  if (!richtext) throw new Error("FIFA POTM article: no richtext in section");

  // Each top-level block is flattened independently (its own lines are already
  // "\n"-separated in the CMS) so a winner ending one block can't merge into the
  // next block's first line.
  const lines: string[] = [];
  for (const block of richtext.content ?? []) {
    for (const ln of flatten(block).split("\n")) {
      const s = ln.trim();
      if (s) lines.push(s);
    }
  }
  return lines;
}
