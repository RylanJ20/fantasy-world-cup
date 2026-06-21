// ──────────────────────────────────────────────────────────────────────────
//  The interactive half of the Leaderboards page. The server pre-computes both
//  views (all 48 nations, and drafted-only) and hands them here; the toggle
//  swaps between them client-side with no round-trip. Holds the Team of the
//  Tournament column, the position-split Most Points card, and the stat boards.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type {
  LeaderboardCategory,
  LeaderboardsView,
  LeaderRow,
  PositionGroup,
} from "@/lib/league";
import { Flag, Pts } from "@/components/ui";
import { TeamOfTournament } from "@/components/TeamOfTournament";
import {
  BootIcon,
  GloveIcon,
  NetIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/icons";

const ICONS: Record<string, ReactNode> = {
  points: <TrophyIcon size={20} />,
  goals: <BootIcon size={20} />,
  assists: <NetIcon size={20} />,
  motm: <StarIcon size={20} />,
  glove: <GloveIcon size={20} />,
  defender: <ShieldIcon size={20} />,
};

function rankTone(rank: number) {
  return rank === 1
    ? "text-gold-bright"
    : rank === 2
      ? "text-muted"
      : rank === 3
        ? "text-amber"
        : "text-faint";
}

function Row({ row, rank }: { row: LeaderRow; rank: number }) {
  const inner = (
    <>
      <span className={`text-center font-mono text-sm font-bold ${rankTone(rank)}`}>
        {rank}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <Flag country={row.country} size={13} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-chalk">
            {row.name}
          </span>
          <span className="block truncate text-[0.7rem] text-faint">
            {row.position}
            {row.managerName && (
              <>
                {" · "}
                <span className="text-turf-bright">{row.managerName}</span>
              </>
            )}
          </span>
        </span>
      </span>
      <Pts
        value={row.value}
        className={`text-base font-bold ${rank === 1 ? "text-gold-bright" : "text-turf-bright"}`}
      />
    </>
  );
  const cls =
    "grid grid-cols-[1.4rem_1fr_auto] items-center gap-3 border-b border-line/50 px-4 py-2.5 last:border-0";
  return row.managerId ? (
    <Link href={`/manager/${row.managerId}`} className={`link-row ${cls}`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Most Points, split into the four pitch lines inside a single card. */
function PointsCard({
  groups,
  draftedOnly,
}: {
  groups: PositionGroup[];
  draftedOnly: boolean;
}) {
  const empty = groups.every((g) => g.rows.length === 0);
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-turf-bright">{ICONS.points}</span>
        <h3 className="font-display text-lg tracking-wide text-chalk">Most Points</h3>
        {!draftedOnly && (
          <span className="rounded-full border border-line bg-bg-2/60 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-faint">
            All nations
          </span>
        )}
        <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-widest text-faint">
          by position · pts
        </span>
      </div>
      {empty ? (
        <p className="px-4 py-6 text-center text-xs text-faint">No data yet</p>
      ) : (
        // Hairline 2×2 grid (1 column on mobile) — same gap-px/bg-line trick as
        // the homepage ticker, so the four groups read as one card.
        <div className="grid gap-px bg-line-strong sm:grid-cols-2">
          {groups.map((g) => (
            <div key={g.line} className="bg-surface">
              <div className="flex items-center justify-between gap-2 px-4 py-2">
                <span className="text-[0.62rem] font-bold uppercase tracking-widest text-faint">
                  {g.label}
                </span>
              </div>
              {g.rows.length === 0 ? (
                <p className="px-4 pb-3 text-xs text-faint">No data yet</p>
              ) : (
                <ul>
                  {g.rows.map((row, i) => (
                    <li key={`${g.line}-${row.country}-${row.name}`}>
                      <Row row={row} rank={i + 1} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryCard({ cat }: { cat: LeaderboardCategory }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-turf-bright">{ICONS[cat.key]}</span>
        <h3 className="font-display text-lg tracking-wide text-chalk">{cat.title}</h3>
        {cat.scope === "tournament" && (
          <span className="rounded-full border border-line bg-bg-2/60 px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-faint">
            All nations
          </span>
        )}
        <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-widest text-faint">
          {cat.unit}
        </span>
      </div>
      {cat.rows.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-faint">No data yet</p>
      ) : (
        <ul>
          {cat.rows.map((row, i) => (
            <li key={`${cat.key}-${row.country}-${row.name}`}>
              <Row row={row} rank={i + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LeaderboardsExplorer({
  all,
  drafted,
}: {
  all: LeaderboardsView;
  drafted: LeaderboardsView;
}) {
  const [draftedOnly, setDraftedOnly] = useState(false);
  const view = draftedOnly ? drafted : all;

  return (
    <>
      {/* ── Toggle bar ─────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted" aria-live="polite">
          {draftedOnly
            ? "Showing only players drafted in the league, ranked by their fantasy points."
            : "Ranking every player across all 48 nations — drafted players are tagged with their manager."}
        </p>
        <div
          role="group"
          aria-label="Filter leaders"
          className="inline-flex shrink-0 items-center gap-0.5 self-start rounded-full border border-line bg-bg-2/50 p-0.5 sm:self-auto"
        >
          {([
            ["All nations", false],
            ["Drafted only", true],
          ] as const).map(([label, val]) => (
            <button
              key={label}
              type="button"
              onClick={() => setDraftedOnly(val)}
              aria-pressed={draftedOnly === val}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                draftedOnly === val
                  ? "bg-turf/20 text-turf-bright"
                  : "text-faint hover:text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        {/* ── Team of the Tournament — left column, sticky like a squad ──── */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-3">
            <p className="eyebrow mb-1">
              Best XI · {draftedOnly ? "drafted squad" : "all nations"}
            </p>
            <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide text-chalk">
              <span className="text-turf-bright">
                <TrophyIcon size={22} />
              </span>
              Team of the Tournament
            </h2>
          </div>
          <TeamOfTournament lines={view.totm} />
          <p className="mt-2 px-1 text-center text-xs text-faint">
            {draftedOnly
              ? "Fantasy points — the top drafted player at each position. Empty slots fill as drafted players score."
              : "Numbers are fantasy points — the top scorer at each position across all 48 nations. Updates as results come in."}
          </p>
        </div>

        {/* ── Boards — Most Points (by position) then the stat categories ── */}
        <div className="grid gap-4">
          <PointsCard groups={view.pointGroups} draftedOnly={draftedOnly} />
          <div className="grid gap-4 sm:grid-cols-2">
            {view.categories.map((cat) => (
              <CategoryCard key={cat.key} cat={cat} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
