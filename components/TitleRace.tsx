// ──────────────────────────────────────────────────────────────────────────
//  The Title Race — an interactive replay of the standings, matchday by
//  matchday. Drag the scrubber (or hit play) to sweep a playhead across the
//  tournament; the lines fill in and the standings list re-sorts live, so you
//  can watch every lead change and comeback unfold. All client-side over the
//  pre-computed frames from getTitleRace() — no charting library, just SVG.
// ──────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { TitleRace } from "@/lib/titleRace";
import { Pts } from "@/components/ui";
import { CrownIcon, PauseIcon, PlayIcon, RewindIcon, TrendIcon } from "@/components/icons";

// viewBox geometry — the SVG scales to its container, these are just units.
const W = 1000;
const H = 380;
const PAD = { l: 18, r: 18, t: 22, b: 30 };
const INNER_W = W - PAD.l - PAD.r;
const INNER_H = H - PAD.t - PAD.b;

const ROW_H = 52; // px — one standings row, drives the slide-to-reorder maths.
const STEP_MS = 850; // auto-play tempo per matchday.

export function TitleRace({ race }: { race: TitleRace }) {
  const { managers, frames, maxTotal } = race;
  const n = frames.length;
  const [idx, setIdx] = useState(Math.max(0, n - 1));
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Per-manager cumulative series across every frame, plus colour/name.
  const series = useMemo(
    () =>
      managers.map((m) => ({
        ...m,
        totals: frames.map(
          (f) => f.entries.find((e) => e.id === m.id)?.total ?? 0,
        ),
      })),
    [managers, frames],
  );

  // Auto-play: step the playhead forward one matchday at a time, parking (and
  // releasing the play button) once it lands on the final frame.
  useEffect(() => {
    if (!playing || idx >= n - 1) return;
    const t = setTimeout(() => {
      setIdx((i) => Math.min(n - 1, i + 1));
      if (idx + 1 >= n - 1) setPlaying(false);
    }, STEP_MS);
    return () => clearTimeout(t);
  }, [playing, idx, n]);

  if (n === 0) {
    return (
      <div className="panel grid place-items-center gap-2 px-6 py-16 text-center">
        <span className="text-turf-bright">
          <TrendIcon size={30} />
        </span>
        <p className="font-display text-xl tracking-wide text-chalk">
          The race hasn&apos;t started
        </p>
        <p className="max-w-sm text-sm text-muted">
          As soon as the first results are in, this chart replays the title race
          matchday by matchday.
        </p>
      </div>
    );
  }

  const xStep = n > 1 ? INNER_W / (n - 1) : 0;
  const x = (i: number) => PAD.l + i * xStep;
  const y = (total: number) => PAD.t + (1 - total / maxTotal) * INNER_H;
  const path = (totals: number[], upto: number) =>
    totals
      .slice(0, upto + 1)
      .map((t, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(t).toFixed(1)}`)
      .join(" ");

  const frame = frames[idx];
  // Map manager id → its row position in the current standings (array order is
  // already best-first), so each row can slide to its slot without overlap.
  const posById = new Map(frame.entries.map((e, i) => [e.id, i]));
  const leaderId = frame.entries[0]?.id;

  // Click anywhere on the plot to seek to the nearest matchday.
  const seekFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg || n < 2) return;
    const rect = svg.getBoundingClientRect();
    const vbX = ((clientX - rect.left) / rect.width) * W;
    const i = Math.round((vbX - PAD.l) / xStep);
    setIdx(Math.max(0, Math.min(n - 1, i)));
  };

  const onPlay = () => {
    if (idx >= n - 1) setIdx(0); // replay from the top when parked at the end
    setPlaying((p) => !p);
  };

  // Horizontal gridlines at 0 / 50% / 100% of the max.
  const gridLines = [0, 0.5, 1].map((f) => ({
    v: Math.round(maxTotal * f),
    yy: y(maxTotal * f),
  }));
  // Thin out x labels so they never collide.
  const labelEvery = Math.max(1, Math.ceil(n / 9));

  return (
    <div className="panel overflow-hidden">
      {/* ── Header: where the playhead currently sits ──────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-2xl tracking-wide text-chalk tnum">
            {frame.label}
          </span>
          {frame.stage && (
            <span className="rounded-full border border-line bg-bg-2/60 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-faint">
              {frame.stage}
            </span>
          )}
        </div>
        <span className="text-xs text-faint">
          Matchday {idx + 1} of {n} · {frame.matchesPlayed} game
          {frame.matchesPlayed === 1 ? "" : "s"} played
        </span>
        <span className="ml-auto hidden text-[0.62rem] font-bold uppercase tracking-widest text-faint sm:block">
          Cumulative points
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_minmax(0,17rem)]">
        {/* ── Chart ──────────────────────────────────────────────────────── */}
        <div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="w-full cursor-crosshair select-none"
            style={{ height: "auto" }}
            onClick={(e) => seekFromClientX(e.clientX)}
            role="img"
            aria-label="Cumulative fantasy points for each manager over the tournament"
          >
            {/* gridlines */}
            {gridLines.map((g, i) => (
              <g key={i}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={g.yy}
                  y2={g.yy}
                  stroke="rgba(167,243,205,0.10)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.l}
                  y={g.yy - 4}
                  fill="#5d7a6a"
                  fontSize={13}
                  fontFamily="var(--font-mono)"
                >
                  {g.v}
                </text>
              </g>
            ))}

            {/* x tick labels (thinned) */}
            {frames.map((f, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                <text
                  key={f.date}
                  x={x(i)}
                  y={H - 8}
                  fill={i === idx ? "#ecfdf2" : "#5d7a6a"}
                  fontSize={13}
                  fontWeight={i === idx ? 700 : 400}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  {f.label}
                </text>
              ) : null,
            )}

            {/* playhead */}
            <line
              x1={x(idx)}
              x2={x(idx)}
              y1={PAD.t - 6}
              y2={H - PAD.b}
              stroke="rgba(236,253,242,0.45)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* full faint trajectories (the road not yet travelled) */}
            {series.map((s) => (
              <path
                key={`ghost-${s.id}`}
                d={path(s.totals, n - 1)}
                fill="none"
                stroke={s.color}
                strokeWidth={1.5}
                opacity={hover && hover !== s.id ? 0.05 : 0.18}
              />
            ))}

            {/* bright travelled line up to the playhead */}
            {series.map((s) => {
              const dim = hover && hover !== s.id;
              return (
                <path
                  key={`live-${s.id}`}
                  d={path(s.totals, idx)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hover === s.id ? 4 : 2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={dim ? 0.15 : 1}
                  style={{ transition: "opacity 0.2s ease, stroke-width 0.2s ease" }}
                />
              );
            })}

            {/* marker dots at the playhead */}
            {series.map((s) => {
              const dim = hover && hover !== s.id;
              return (
                <circle
                  key={`dot-${s.id}`}
                  cx={x(idx)}
                  cy={y(s.totals[idx])}
                  r={hover === s.id ? 6 : 4.5}
                  fill={s.color}
                  stroke="#06110c"
                  strokeWidth={1.5}
                  opacity={dim ? 0.2 : 1}
                  style={{ transition: "opacity 0.2s ease" }}
                />
              );
            })}
          </svg>

          {/* ── Transport controls ──────────────────────────────────────── */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={onPlay}
              aria-label={playing ? "Pause" : "Play the race"}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-turf/40 bg-turf/15 text-turf-bright transition-colors hover:bg-turf/25"
            >
              {playing ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setIdx(0);
              }}
              aria-label="Rewind to the first matchday"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-muted transition-colors hover:bg-surface-2 hover:text-chalk"
            >
              <RewindIcon size={16} />
            </button>
            <input
              type="range"
              min={0}
              max={n - 1}
              value={idx}
              step={1}
              onChange={(e) => {
                setPlaying(false);
                setIdx(Number(e.target.value));
              }}
              aria-label="Scrub through matchdays"
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-2 accent-turf"
            />
          </div>
        </div>

        {/* ── Live standings — rows slide to their slot as you scrub ─────── */}
        <div
          className="relative"
          style={{ height: managers.length * ROW_H }}
          aria-live="polite"
        >
          {managers.map((m) => {
            const e = frame.entries.find((x) => x.id === m.id)!;
            const pos = posById.get(m.id) ?? 0;
            const dim = hover && hover !== m.id;
            return (
              <Link
                key={m.id}
                href={`/manager/${m.id}`}
                onMouseEnter={() => setHover(m.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(m.id)}
                onBlur={() => setHover(null)}
                className="link-row absolute inset-x-0 flex items-center gap-2.5 rounded-lg border border-line/60 bg-surface px-2.5 py-2"
                style={{
                  transform: `translateY(${pos * ROW_H}px)`,
                  height: ROW_H - 8,
                  transition: "transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.2s ease",
                  opacity: dim ? 0.4 : 1,
                }}
              >
                <span className="w-5 text-center font-mono text-sm font-bold tabular-nums text-faint">
                  {e.rank}
                </span>
                <span
                  className="h-6 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: m.color }}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-1.5">
                  <span className="truncate font-display text-base leading-none tracking-wide text-chalk">
                    {m.name}
                  </span>
                  {m.id === leaderId && e.total > 0 && (
                    <CrownIcon size={14} className="shrink-0 text-gold-bright" />
                  )}
                </span>
                {e.gained > 0 && (
                  <span className="shrink-0 font-mono text-[0.7rem] font-bold text-turf-bright">
                    +{e.gained}
                  </span>
                )}
                <Pts
                  value={e.total}
                  className="w-9 shrink-0 text-right text-lg font-bold text-chalk"
                />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
