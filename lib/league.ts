// ──────────────────────────────────────────────────────────────────────────
//  Derived selectors over the league data. Everything the UI reads goes
//  through here so scoring is computed once, consistently.
// ──────────────────────────────────────────────────────────────────────────

import { league } from "@/data/league";
import type { Manager, Player, PlayerMatch } from "./types";
import { fixtures, resultsForCountry } from "./fixtures";
import { isEliminated } from "./elimination";
import { mergedPlayerMatches } from "./playerStats";
import { tournamentLeader, tournamentLeaders } from "./tournamentLeaders";
import { undraftedPlayerScores, tournamentPosition } from "./tournamentPlayers";
import { motmLeaders } from "./motm";
import { playerKey } from "./names";
import { playerPhoto } from "./teamPhotos";
import {
  scoreManager,
  type ManagerScore,
  type PlayerTotals,
  type TeamScore,
} from "./scoring";

/**
 * Auto-fill each drafted team's results from the imported fixtures, unless the
 * team already has manually-entered matches (manual always wins). So managers
 * only need to list 6 country names — team points compute from real results.
 */
function withAutoResults(m: Manager): Manager {
  return {
    ...m,
    teams: m.teams.map((t) =>
      t.matches.length > 0 ? t : { ...t, matches: resultsForCountry(t.country) },
    ),
  };
}

/**
 * Resolve one squad slot to the matches that should score for it.
 *
 * Normal slot: ESPN auto stats + the league.ts manual overlay (MOTM / penalty
 * saves), via mergedPlayerMatches.
 *
 * Replaced slot (`replacedBy` set): the slot now belongs to the incoming
 * player, but keeps the points the outgoing player banked BEFORE the cutoff.
 * The returned Player carries the INCOMING identity (name / country / position)
 * and only the incoming player's ON/AFTER-cutoff matches; the outgoing player —
 * with only their pre-cutoff matches — is attached on `replacedFrom` and scored
 * separately by scorePlayer (so each occupant is scored under their own role and
 * nation, and the slot total is the sum). Recurses so a slot can be replaced
 * more than once.
 */
function resolveSlot(p: Player): Player {
  const filled: Player = { ...p, matches: mergedPlayerMatches(p) };
  if (!p.replacedBy || !p.replacedOn) return filled;

  const cutoff = Date.parse(p.replacedOn);
  // Undated rows (hand-entered overlays with no fixture) stay with the OUTGOING
  // player — overlays annotate games already played before any mid-event swap.
  const isBefore = (mm: PlayerMatch) => {
    const t = mm.date ? Date.parse(mm.date) : NaN;
    return Number.isNaN(t) || t < cutoff;
  };
  const isOnAfter = (mm: PlayerMatch) => {
    const t = mm.date ? Date.parse(mm.date) : NaN;
    return !Number.isNaN(t) && t >= cutoff;
  };

  const incoming = resolveSlot(p.replacedBy);

  // Outgoing player as a standalone entity (own name / position / country) with
  // only their frozen matches — scored separately for the slot total + display.
  const previous: Player = {
    name: p.name,
    position: p.position,
    country: p.country,
    matches: filled.matches.filter(isBefore),
    ...(p.note ? { note: p.note } : {}),
  };

  return {
    ...incoming,
    matches: incoming.matches.filter(isOnAfter),
    replacedFrom: { previous, on: p.replacedOn },
  };
}

/**
 * Fill each drafted player's matches from ESPN's imported stats, with their
 * league.ts entries layered on top as a manual overlay (MOTM / penalty saves),
 * resolving any mid-tournament replacement to the right scoring window.
 */
function withAutoPlayerStats(m: Manager): Manager {
  return {
    ...m,
    players: m.players.map(resolveSlot),
    ...(m.bench ? { bench: m.bench.map(resolveSlot) } : {}),
  };
}

/** Earliest imported fixture, or the data fallback if none are loaded. */
function earliestKickoff(): string {
  const times = fixtures
    .map((f) => f.utcDate)
    .filter((x): x is string => typeof x === "string" && x.length > 0)
    .sort();
  return times[0] ?? league.kickoff;
}

export const leagueMeta = {
  name: league.name,
  season: league.season,
  kickoff: earliestKickoff(),
};

/** All managers, scored and sorted by total points (highest first). */
export function getManagerScores(): ManagerScore[] {
  return league.managers
    .map((m) => scoreManager(withAutoPlayerStats(withAutoResults(m))))
    .sort((a, b) => b.total - a.total || a.manager.name.localeCompare(b.manager.name));
}

/** How many of a manager's players / teams are still alive in the tournament. */
export interface SurvivorCount {
  /** Squad slots whose nation is still in the World Cup. */
  players: number;
  /** Total squad slots (players still in + eliminated). */
  playersTotal: number;
  /** Drafted nations still in the World Cup. */
  teams: number;
  /** Total drafted nations. */
  teamsTotal: number;
}

export interface StandingRow extends ManagerScore {
  rank: number;
  /** True when this row shares its rank with the row above (tie). */
  tied: boolean;
  /** Best-performing player's photo, shown as the manager avatar (undefined
   *  until someone on the squad has scored and a photo has been resolved). */
  topPhoto?: string;
  /** Name of that best performer — used as the avatar's hover title / alt. */
  topPlayer?: string;
  /** Players / teams still alive vs. eliminated — drives the survivor counters. */
  alive: SurvivorCount;
}

/** Tally a manager's still-alive players and teams (current occupant's nation
 *  for a replaced slot). */
export function survivorCount(m: ManagerScore): SurvivorCount {
  return {
    players: m.players.filter((p) => !isEliminated(p.player.country)).length,
    playersTotal: m.players.length,
    teams: m.teams.filter((t) => !isEliminated(t.team.country)).length,
    teamsTotal: m.teams.length,
  };
}

/** Standings with competition ranking (ties share a rank: 1, 2, 2, 4…). */
export function getStandings(): StandingRow[] {
  const scores = getManagerScores();
  let lastTotal: number | null = null;
  let lastRank = 0;
  return scores.map((s, i) => {
    const tied = lastTotal === s.total;
    const rank = tied ? lastRank : i + 1;
    lastTotal = s.total;
    lastRank = rank;
    // The manager's avatar becomes their top scorer's face once they've banked
    // points and a photo exists — otherwise the initials avatar stands.
    const top = s.players[0];
    const topPhoto =
      top && top.total > 0
        ? playerPhoto(top.player.country, top.player.name)
        : undefined;
    return {
      ...s,
      rank,
      tied,
      topPhoto,
      topPlayer: topPhoto ? top.player.name : undefined,
      alive: survivorCount(s),
    };
  });
}

export function getManagerScore(slug: string): StandingRow | undefined {
  return getStandings().find((s) => s.manager.id === slug);
}

export function getAllManagerSlugs(): string[] {
  return league.managers.map((m) => m.id);
}

export interface StripCard {
  key: "points" | "boot" | "glove" | "team";
  label: string;
  name: string;
  meta: string;
  value: number;
  unit: string;
  href?: string;
}

/**
 * Homepage strip: best drafted player (fantasy points) and best team pick, plus
 * the REAL tournament Golden Boot / Golden Glove (top scorer / keeper across all
 * nations, drafted or not). Fantasy cards only appear once points are on the board.
 */
export function getLeagueLeaders(): StripCard[] {
  const scores = getManagerScores();
  let topTeam: { t: TeamScore; mgr: Manager } | null = null;
  for (const m of scores) {
    for (const t of m.teams)
      if (!topTeam || t.total > topTeam.t.total) topTeam = { t, mgr: m.manager };
  }

  const cards: StripCard[] = [];
  // Top points — the real leader across ALL nations (drafted or not), mirroring
  // the Golden Boot / Glove cards below: links to a manager only when owned.
  const topPoints = tournamentPointsRanking()[0];
  if (topPoints && topPoints.value > 0)
    cards.push({
      key: "points",
      label: "Top points",
      name: topPoints.name,
      meta: topPoints.managerName
        ? `${topPoints.country} · ${topPoints.managerName}`
        : topPoints.country,
      value: topPoints.value,
      unit: "pts",
      href: topPoints.managerId ? `/manager/${topPoints.managerId}` : "/leaderboards",
    });

  const pushTournament = (
    key: "boot" | "glove",
    label: string,
    unit: string,
    leader: ReturnType<typeof tournamentLeader>,
  ) => {
    if (!leader) return;
    const owner = leader.managers[0];
    cards.push({
      key,
      label,
      name: leader.name,
      meta: owner ? `${leader.country} · ${owner.name}` : leader.country,
      value: leader.value,
      unit,
      href: owner ? `/manager/${owner.id}` : "/leaderboards",
    });
  };
  pushTournament("boot", "Golden boot", "goals", tournamentLeader("goals"));
  pushTournament("glove", "Golden glove", "saves", tournamentLeader("saves"));

  if (topTeam && topTeam.t.total > 0)
    cards.push({
      key: "team",
      label: "Best team pick",
      name: topTeam.t.team.country,
      meta: `${topTeam.t.record.w}W-${topTeam.t.record.d}D-${topTeam.t.record.l}L · ${topTeam.mgr.name}`,
      value: topTeam.t.total,
      unit: "pts",
      href: `/manager/${topTeam.mgr.id}`,
    });

  return cards;
}

// ── Leaderboards ─────────────────────────────────────────────────────────────

export interface LeaderRow {
  name: string;
  country: string;
  position: string;
  value: number;
  /** Present only for drafted players — links the row to their manager. */
  managerId?: string;
  managerName?: string;
}

export interface LeaderboardCategory {
  key: string;
  title: string;
  unit: string;
  /** "tournament" = all 48 nations (drafted players tagged); "fantasy" =
   *  drafted-only, set when the board is filtered by the leaders-page toggle. */
  scope: "fantasy" | "tournament";
  rows: LeaderRow[];
}

/** One pitch line's worth of the Most-Points board, split out by position. */
export interface PositionGroup {
  line: "GK" | "DEF" | "MID" | "FWD";
  label: string;
  rows: LeaderRow[];
}

/** Everything the leaderboards page needs for a single drafted/all view. */
export interface LeaderboardsView {
  /** Most Points, split into the four pitch lines (top scorers per line). */
  pointGroups: PositionGroup[];
  /** The remaining stat boards (goals, assists, MOTM, saves, clean sheets). */
  categories: LeaderboardCategory[];
  /** Team of the Tournament for this view. */
  totm: TotmLine[];
}

/**
 * Every player at the World Cup ranked by fantasy points. Drafted players carry
 * their EXACT total from their manager page (overlay + MOTM aware); undrafted
 * players are scored from imported stats. Keyed dedupe stops a drafted player
 * from being recounted as undrafted. Sorted high→low, no limit.
 */
export function tournamentPointsRanking(): LeaderRow[] {
  const drafted = getManagerScores().flatMap((m) =>
    m.players.map((p) => ({ p, mgr: m.manager })),
  );
  const draftedKeys = new Set(
    drafted.map(({ p }) => playerKey(p.player.country, p.player.name)),
  );
  const rows: LeaderRow[] = drafted.map(({ p, mgr }) => ({
    name: p.player.name,
    country: p.player.country,
    position: p.player.position,
    value: p.total,
    managerId: mgr.id,
    managerName: mgr.name,
  }));
  for (const u of undraftedPlayerScores()) {
    if (draftedKeys.has(playerKey(u.country, u.name))) continue;
    rows.push({
      name: u.name,
      country: u.country,
      position: u.position,
      value: u.value,
    });
  }
  return rows
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

// Forwards first so the Most Points groups read top-of-pitch down, matching the
// Team of the Tournament ordering.
const POINTS_GROUP_SHAPE: { line: PositionGroup["line"]; label: string }[] = [
  { line: "FWD", label: "Forwards" },
  { line: "MID", label: "Midfield" },
  { line: "DEF", label: "Defence" },
  { line: "GK", label: "Goalkeepers" },
];

/**
 * The Most Points board split into the four pitch lines, each holding the top
 * `perGroup` point scorers in that line. `draftedOnly` restricts to drafted
 * players (those carrying a managerId). Players with an unknown position group
 * are omitted (they can't be placed on a line), but still appear on the overall
 * points ranking elsewhere.
 */
export function pointsByPosition(
  opts: { draftedOnly?: boolean; perGroup?: number } = {},
): PositionGroup[] {
  const { draftedOnly = false, perGroup = 5 } = opts;
  const byLine: Record<PositionGroup["line"], LeaderRow[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };
  for (const r of tournamentPointsRanking()) {
    if (draftedOnly && !r.managerId) continue;
    const line = totmLine(r.position);
    if (line) byLine[line].push(r);
  }
  return POINTS_GROUP_SHAPE.map(({ line, label }) => ({
    line,
    label,
    rows: draftedFirst(
      byLine[line],
      (r) => r.value,
      (r) => Boolean(r.managerId),
      (r) => r.name,
    ).slice(0, perGroup),
  }));
}

/**
 * Re-rank a leaderboard so that, within a tie on `value`, DRAFTED players come
 * first — they get priority for the limited display slots — then fall back to
 * the existing alphabetical tiebreak. Returns a sorted copy (never mutates the
 * input, which may be a shared/cached array).
 */
function draftedFirst<T>(
  rows: T[],
  value: (r: T) => number,
  isDrafted: (r: T) => boolean,
  name: (r: T) => string,
): T[] {
  return [...rows].sort(
    (a, b) =>
      value(b) - value(a) ||
      Number(isDrafted(b)) - Number(isDrafted(a)) ||
      name(a).localeCompare(name(b)),
  );
}

/**
 * The stat boards (goals, assists, MOTM, saves, clean sheets) — the Most Points
 * board lives in pointsByPosition() now that it's split by position. By default
 * every board ranks all 48 nations with drafted players tagged; `draftedOnly`
 * restricts each board to drafted players before taking the top `limit`, so the
 * boards always show a full slate of owned players rather than the drafted few
 * who happened to crack the all-nations top five.
 */
export function getLeaderboards(
  opts: { limit?: number; draftedOnly?: boolean } = {},
): LeaderboardCategory[] {
  const { limit = 5, draftedOnly = false } = opts;
  const scope: LeaderboardCategory["scope"] = draftedOnly ? "fantasy" : "tournament";
  const drafted = getManagerScores().flatMap((m) =>
    m.players.map((p) => ({ p, mgr: m.manager })),
  );

  // The COMPLETE drafted field, deduped across shared picks and keyed by player:
  // season totals plus every owning manager. This — not the all-nations leaders
  // file — is the source for the drafted-only stat boards, because
  // data/tournament-leaders.json only keeps the top ~12 per category and would
  // otherwise hide any drafted player ranked outside that all-nations cut.
  const draftedByKey = new Map<
    string,
    {
      name: string;
      country: string;
      position: string;
      totals: PlayerTotals;
      managers: { id: string; name: string }[];
    }
  >();
  for (const { p, mgr } of drafted) {
    const key = playerKey(p.player.country, p.player.name);
    const e = draftedByKey.get(key);
    if (e) e.managers.push({ id: mgr.id, name: mgr.name });
    else
      draftedByKey.set(key, {
        name: p.player.name,
        country: p.player.country,
        position: p.player.position,
        totals: p.totals,
        managers: [{ id: mgr.id, name: mgr.name }],
      });
  }

  // ── Man of the match: tournament-wide, tallied from data/motm.ts. ──
  const motm: LeaderboardCategory = {
    key: "motm",
    title: "Man of the Match",
    unit: "MOTM",
    scope,
    rows: draftedFirst(
      motmLeaders().filter(
        (e) => !draftedOnly || draftedByKey.has(playerKey(e.country, e.name)),
      ),
      (e) => e.count,
      (e) => draftedByKey.has(playerKey(e.country, e.name)),
      (e) => e.name,
    )
      .slice(0, limit)
      .map((e) => {
        const key = playerKey(e.country, e.name);
        const d = draftedByKey.get(key);
        const mgrs = d?.managers ?? [];
        return {
          name: e.name,
          country: e.country,
          position: d?.position ?? tournamentPosition(e.country, e.name),
          value: e.count,
          managerId: mgrs.length === 1 ? mgrs[0].id : undefined,
          managerName: mgrs.length
            ? mgrs.map((m) => m.name).join(" / ")
            : undefined,
        };
      }),
  };

  // Drafted-only: rank the whole drafted field by one of their season totals, so
  // every owned player with the stat is in contention (not just those who also
  // cracked the all-nations leaders list).
  const draftedStatRows = (stat: (t: PlayerTotals) => number): LeaderRow[] =>
    [...draftedByKey.values()]
      .map((d) => ({ d, value: stat(d.totals) }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value || a.d.name.localeCompare(b.d.name))
      .slice(0, limit)
      .map(({ d, value }) => ({
        name: d.name,
        country: d.country,
        position: d.position,
        value,
        managerId: d.managers.length === 1 ? d.managers[0].id : undefined,
        managerName: d.managers.map((m) => m.name).join(" / "),
      }));

  // All-nations: the pre-aggregated top-N leaders across all 48 nations, drafted
  // players tagged and given the tiebreak for the limited slots.
  const tournamentStatRows = (
    tlKey: "goals" | "assists" | "saves" | "cleanSheets",
  ): LeaderRow[] =>
    draftedFirst(
      tournamentLeaders(tlKey),
      (r) => r.value,
      (r) => r.managers.length > 0,
      (r) => r.name,
    )
      .slice(0, limit)
      .map((r) => ({
        name: r.name,
        country: r.country,
        position: r.position,
        value: r.value,
        // Only link when a single manager owns them — a shared pick shows both
        // names but linking to just one would mismatch the displayed text.
        managerId: r.managers.length === 1 ? r.managers[0].id : undefined,
        managerName: r.managers.length
          ? r.managers.map((m) => m.name).join(" / ")
          : undefined,
      }));

  const statBoard = (
    key: string,
    title: string,
    unit: string,
    tlKey: "goals" | "assists" | "saves" | "cleanSheets",
    stat: (t: PlayerTotals) => number,
  ): LeaderboardCategory => ({
    key,
    title,
    unit,
    scope,
    rows: draftedOnly ? draftedStatRows(stat) : tournamentStatRows(tlKey),
  });

  return [
    statBoard("goals", "Top Scorers", "goals", "goals", (t) => t.goals),
    statBoard("assists", "Most Assists", "assists", "assists", (t) => t.assists),
    motm,
    statBoard("glove", "Golden Glove", "saves", "saves", (t) => t.saves),
    statBoard("defender", "Best Defender", "CS", "cleanSheets", (t) => t.cleanSheets),
  ];
}

// ── Team of the Tournament ───────────────────────────────────────────────────

export interface TotmLine {
  /** Pitch line this slot fills (coarse position group). */
  line: "GK" | "DEF" | "MID" | "FWD";
  label: string;
  /** Point leaders filling the line, best first. */
  players: LeaderRow[];
}

/** Map any roster position (granular for drafted, coarse from ESPN for the
 *  undrafted field) onto the pitch line it occupies; null for an unknown role. */
function totmLine(position: string): TotmLine["line"] | null {
  if (position === "GK") return "GK";
  if (position === "CB" || position === "DEF" || position === "WB") return "DEF";
  if (position === "MID") return "MID";
  if (position === "FWD") return "FWD";
  return null;
}

// A 4-3-3 — the same line counts as a manager's squad (1 GK · 4 def · 3 MID ·
// 3 FWD), ordered top-of-pitch first so it drops straight into the formation.
const TOTM_SHAPE: { line: TotmLine["line"]; label: string; take: number }[] = [
  { line: "FWD", label: "Forwards", take: 3 },
  { line: "MID", label: "Midfield", take: 3 },
  { line: "DEF", label: "Defence", take: 4 },
  { line: "GK", label: "Goalkeeper", take: 1 },
];

/**
 * The Team of the Tournament: the highest fantasy-point player at each position
 * across ALL 48 nations, laid out as a 4-3-3 mirroring a manager's squad pitch.
 * Built from tournamentPointsRanking(), so it recomputes on every import and
 * always reflects the current leaders. Within a points tie, drafted players win
 * the slot (matching the category boards). Lines are returned top-of-pitch first.
 *
 * `draftedOnly` builds the best XI from drafted players alone — a line with
 * fewer drafted scorers than its shape simply renders fewer nodes (empty slots).
 */
export function teamOfTournament(opts: { draftedOnly?: boolean } = {}): TotmLine[] {
  const { draftedOnly = false } = opts;
  const byLine: Record<TotmLine["line"], LeaderRow[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const r of tournamentPointsRanking()) {
    if (draftedOnly && !r.managerId) continue;
    const line = totmLine(r.position);
    if (line) byLine[line].push(r);
  }
  return TOTM_SHAPE.map(({ line, label, take }) => ({
    line,
    label,
    players: draftedFirst(
      byLine[line],
      (r) => r.value,
      (r) => Boolean(r.managerId),
      (r) => r.name,
    ).slice(0, take),
  }));
}

/**
 * Bundle the three leaderboard pieces for one view (all nations or drafted
 * only). The leaders page computes both up front and the client toggle swaps
 * between them with no server round-trip.
 */
export function getLeaderboardsView(
  opts: { draftedOnly?: boolean; limit?: number; perGroup?: number } = {},
): LeaderboardsView {
  const { draftedOnly = false, limit = 5, perGroup = 5 } = opts;
  return {
    pointGroups: pointsByPosition({ draftedOnly, perGroup }),
    categories: getLeaderboards({ limit, draftedOnly }),
    totm: teamOfTournament({ draftedOnly }),
  };
}

/** Totals for the hero stat ticker. */
export function getLeagueTotals() {
  const scores = getManagerScores();
  let goals = 0;
  let cleanSheets = 0;
  let matches = 0;
  let points = 0;
  for (const m of scores) {
    points += m.total;
    for (const p of m.players) {
      goals += p.totals.goals;
      cleanSheets += p.totals.cleanSheets;
    }
    for (const t of m.teams) matches += t.team.matches.length;
  }
  return { goals, cleanSheets, matches, points, managers: scores.length };
}
