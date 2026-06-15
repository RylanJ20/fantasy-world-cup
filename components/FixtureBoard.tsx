"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, signed } from "./ui";
import { ChevronRight } from "./icons";
import type { InvolvedAsset } from "@/lib/fixtures";
import type {
  ManagerMatchScore,
  ScoredAsset,
  ScoredFixture,
} from "@/lib/fixtureScores";

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

// `local=false` formats in UTC (a stable SSR/pre-hydration placeholder);
// `local=true` (after mount) uses the viewer's own zone + its abbreviation,
// e.g. "3:00 PM PST".
function fmtTime(utc: string | null | undefined, local: boolean): string | null {
  if (!utc) return null;
  return new Date(utc).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    ...(local ? {} : { timeZone: "UTC" }),
  });
}

function fmtDay(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// The viewer's LOCAL calendar date (YYYY-MM-DD) for a kickoff. A 02:00 UTC match
// is the previous evening in the Americas, so the schedule must group by this —
// grouping by the UTC date shows late-UTC games a day late.
function localDateStr(utc: string): string {
  const d = new Date(utc);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const isLive = (s?: string) => s === "IN_PLAY" || s === "PAUSED";
const isDone = (s?: string) => s === "FINISHED";

// The upstream free-tier API reports IN_PLAY slowly and unreliably, so a genuinely
// live match can still read as "TIMED" for a long while. To surface the Live badge
// in real time we also infer it from the clock: a fixture counts as live from
// kickoff until a stage-dependent window later (groups ~130', knockouts ~180' to
// cover extra time + penalties) — unless the API has already said FINISHED/IN_PLAY,
// in which case we trust the API.
const liveWindowMin = (stage: string) => (stage.startsWith("Group") ? 130 : 180);

function isLiveNow(
  f: { status?: string; utcDate?: string | null; stage: string },
  now: number | null,
): boolean {
  if (isDone(f.status)) return false; // API says it's over — trust it
  if (isLive(f.status)) return true; // API says in-play — trust it
  if (now == null || !f.utcDate) return false; // pre-hydration / no kickoff time
  const kickoff = new Date(f.utcDate).getTime();
  return now >= kickoff && now < kickoff + liveWindowMin(f.stage) * 60_000;
}

function AssetChip({ a }: { a: InvolvedAsset }) {
  return (
    <Link
      href={`/manager/${a.managerId}`}
      className="link-row inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-2/60 px-2.5 py-1 text-xs"
    >
      <span className="font-bold text-chalk">{a.managerName}</span>
      <span className="text-faint">·</span>
      <span className="text-muted">{a.name}</span>
      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">
        {a.kind === "team" ? "team" : a.position}
      </span>
    </Link>
  );
}

const pointsTone = (p: number) =>
  p > 0 ? "text-turf-bright" : p < 0 ? "text-red" : "text-faint";

// One involved player/team in an expanded manager row: name + points, with its
// itemised breakdown (Goal +10, Assist +5…) shown inline beneath when present.
function ScoredAssetLine({ a }: { a: ScoredAsset }) {
  return (
    <div className="rounded-lg border border-line/50 bg-bg-2/40 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <Flag country={a.country} size={12} />
        <span className="min-w-0 flex-1 truncate text-sm text-chalk">{a.name}</span>
        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">
          {a.kind === "team" ? "team" : a.position}
        </span>
        <span
          className={`w-9 shrink-0 text-right font-mono text-sm font-bold tabular-nums ${pointsTone(
            a.points,
          )}`}
        >
          {signed(a.points)}
        </span>
      </div>
      {a.lines.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 pl-[1.25rem] text-[0.7rem] text-faint">
          {a.lines.map((l, j) => (
            <span key={j}>
              {l.label}{" "}
              <span
                className={`font-mono ${l.tone === "bad" ? "text-red" : "text-turf"}`}
              >
                {signed(l.points)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// One manager's row in the vertical totals list: name + match subtotal, always
// visible. Clicking the points expands their player-by-player detail beneath.
function ManagerRow({ m }: { m: ManagerMatchScore }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2 py-0.5">
        <Link
          href={`/manager/${m.managerId}`}
          className="link-row min-w-0 flex-1 truncate text-sm font-bold text-chalk"
        >
          {m.managerName}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex shrink-0 items-center gap-1.5 rounded px-1 py-0.5 hover:bg-bg-2/60"
        >
          <span
            className={`font-mono text-sm font-bold tabular-nums ${pointsTone(m.points)}`}
          >
            {signed(m.points)}
          </span>
          <ChevronRight
            size={13}
            className={`text-faint transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>
      </div>
      {open && (
        <div className="mb-1 mt-1 space-y-1">
          {m.assets.map((a, i) => (
            <ScoredAssetLine key={`${a.country}-${a.name}-${i}`} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

// A finished match's points: every manager's total stacked vertically so all
// are visible at a glance, each expandable to its player-by-player breakdown.
function FinishedBreakdown({ managers }: { managers: ManagerMatchScore[] }) {
  return (
    <div className="mt-3 divide-y divide-line/40 border-t border-line/60 pt-1">
      {managers.map((m) => (
        <ManagerRow key={m.managerId} m={m} />
      ))}
    </div>
  );
}

// An upcoming match's drafted players/teams, collapsed to a one-line summary
// that expands to the full chip list — keeps the card compact until you look.
function UpcomingAssets({ assets }: { assets: InvolvedAsset[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 border-t border-line/60 pt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint hover:text-chalk"
      >
        <ChevronRight
          size={13}
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        />
        {assets.length} to watch
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {assets.map((a, i) => (
            <AssetChip key={`${a.managerId}-${a.name}-${i}`} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

function Team({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Flag country={name} size={18} />
      <span className="truncate font-display text-base tracking-wide text-chalk sm:text-lg">
        {name}
      </span>
    </span>
  );
}

function StatusTag({
  f,
  mounted,
  live,
}: {
  f: ScoredFixture;
  mounted: boolean;
  live: boolean;
}) {
  if (live)
    return (
      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-red">
        <span className="h-2 w-2 animate-pulse rounded-full bg-red" />
        Live
      </span>
    );
  if (isDone(f.status))
    return <span className="font-mono text-xs font-bold text-faint">FT</span>;
  return (
    <span className="font-mono text-xs text-faint">
      {fmtTime(f.utcDate, mounted) ?? "TBD"}
    </span>
  );
}

function FixtureCard({
  f,
  isNext,
  mounted,
  live,
}: {
  f: ScoredFixture;
  isNext: boolean;
  mounted: boolean;
  live: boolean;
}) {
  const showScore =
    (live || isDone(f.status)) && f.homeScore != null && f.awayScore != null;

  return (
    <div
      id={f.n != null ? `fx-${f.n}` : undefined}
      className={`panel scroll-mt-24 p-4 ${isNext ? "border-turf/40 ring-1 ring-turf/30" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="badge pos-MID">{f.stage}</span>
          {isNext && !live && (
            <span className="badge border-turf/40 bg-turf/12 text-turf-bright">Next</span>
          )}
        </span>
        <StatusTag f={f} mounted={mounted} live={live} />
      </div>

      <div className="flex items-center gap-3">
        <Team name={f.home} align="left" />
        <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-chalk">
          {showScore ? `${f.homeScore}–${f.awayScore}` : <span className="text-faint">v</span>}
        </span>
        <Team name={f.away} align="right" />
      </div>

      {f.finished && f.managers.length > 0 ? (
        <FinishedBreakdown managers={f.managers} />
      ) : (
        f.assets.length > 0 && <UpcomingAssets assets={f.assets} />
      )}
    </div>
  );
}

export function FixtureBoard({ fixtures }: { fixtures: ScoredFixture[] }) {
  const [today, setToday] = useState<string | null>(null);
  // Wall-clock (ms), refreshed on a timer so Live badges flip on/off without a
  // reload. Null until mounted to keep SSR/first paint deterministic.
  const [now, setNow] = useState<number | null>(null);

  // The "next" match = first one not yet finished (deterministic, no clock).
  const nextFixture = fixtures.find((f) => !isDone(f.status));
  const nextN = nextFixture?.n ?? null;

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setToday(localToday());
    // Jump to the next match — only once some are already finished (mid-tournament).
    const idx = fixtures.findIndex((f) => f.n === nextN);
    if (nextN != null && idx > 0) {
      document.getElementById(`fx-${nextN}`)?.scrollIntoView({ block: "center" });
    }
  }, [fixtures, nextN]);

  // Group consecutive fixtures by day (already sorted chronologically). Use the
  // viewer's LOCAL date once mounted; fall back to the UTC date for SSR so the
  // first client render matches and hydration stays clean.
  const mounted = today !== null;
  const dayKey = (f: ScoredFixture) =>
    mounted && f.utcDate ? localDateStr(f.utcDate) : f.date;
  const groups: { date: string; items: ScoredFixture[] }[] = [];
  for (const f of fixtures) {
    const key = dayKey(f);
    const last = groups[groups.length - 1];
    if (last && last.date === key) last.items.push(f);
    else groups.push({ date: key, items: [f] });
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => {
        const isToday = today === g.date;
        const isPast = today !== null && g.date < today;
        return (
          <section key={g.date} className={isPast ? "opacity-60" : ""}>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-xl tracking-wide text-chalk">
                {fmtDay(g.date)}
              </h2>
              {isToday && (
                <span className="badge border-turf/40 bg-turf/12 text-turf-bright">
                  Today
                </span>
              )}
            </div>
            <div className="grid items-start gap-3 md:grid-cols-2">
              {g.items.map((f, i) => (
                <FixtureCard
                  key={f.n ?? i}
                  f={f}
                  isNext={f.n != null && f.n === nextN}
                  mounted={today !== null}
                  live={isLiveNow(f, now)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
