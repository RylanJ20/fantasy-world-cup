"use client";

import { useState } from "react";
import type { PlayerScore } from "@/lib/scoring";
import { shirtName } from "@/lib/shirtNames";
import { isEliminated } from "@/lib/elimination";
import { EliminatedBadge, Flag, Pts, PositionBadge, ScoreLines, StatPill } from "./ui";
import { statPills } from "./playerPills";
import { MatchLog } from "./MatchLog";
import { playerAnchor } from "./PitchFormation";

const PHASE_BEFORE = "group stage";
const PHASE_AFTER = "knockouts";

type View = "both" | "prev" | "curr";

/**
 * A replaced slot rendered as a transfer (outgoing → incoming) with a switcher
 * to view either player's contribution or the combined total. The headline
 * number and the body (pills / breakdown / match log) follow the selected tab,
 * so you can see the points from BOTH players, plus the combined slot total.
 */
export function ReplacementCard({
  ps,
  rank,
  slotLabel,
}: {
  ps: PlayerScore;
  rank: number;
  slotLabel?: string;
}) {
  const rep = ps.replaced!;
  const prev = rep.previousScore;
  const curr = rep.currentScore;
  const [view, setView] = useState<View>("both");
  // The slot now belongs to the incoming player — grey it out on THEIR nation.
  const out = isEliminated(ps.player.country);

  const views: Record<
    View,
    {
      total: number;
      lines: PlayerScore["lines"];
      perMatch: PlayerScore["perMatch"];
      pills: ReturnType<typeof statPills>;
      caption: string;
    }
  > = {
    both: {
      total: ps.total,
      lines: ps.lines,
      perMatch: [...prev.perMatch, ...curr.perMatch],
      pills: statPills({ player: ps.player, totals: ps.totals }),
      caption: "Combined slot total",
    },
    prev: {
      total: prev.total,
      lines: prev.lines,
      perMatch: prev.perMatch,
      pills: statPills(prev),
      caption: `${rep.previous.name} · ${PHASE_BEFORE}`,
    },
    curr: {
      total: curr.total,
      lines: curr.lines,
      perMatch: curr.perMatch,
      pills: statPills(curr),
      caption: `${ps.player.name} · ${PHASE_AFTER}`,
    },
  };
  const v = views[view];

  const tabs: { key: View; label: string; pts: number }[] = [
    { key: "both", label: "Both", pts: ps.total },
    { key: "prev", label: shirtName(rep.previous.name), pts: prev.total },
    { key: "curr", label: shirtName(ps.player.name), pts: curr.total },
  ];

  return (
    <article
      id={playerAnchor(ps.player.name)}
      className={`player-card panel scroll-mt-24 p-4 transition-colors ${out ? "is-out" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-faint">
            {slotLabel ?? String(rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <PositionBadge position={ps.player.position} />
              <span className="badge border-amber/40 text-amber">Replacement</span>
              {out && <EliminatedBadge />}
            </div>
            {/* transfer: outgoing → incoming, each with their own nation's flag */}
            <h3 className="flex flex-wrap items-center gap-1.5 font-display text-xl leading-tight tracking-wide text-chalk">
              <span className="inline-flex items-center gap-1.5">
                <Flag country={rep.previous.country} size={13} />
                <span className="text-base text-faint line-through decoration-red/50">
                  {rep.previous.name}
                </span>
              </span>
              <span className="text-faint" aria-hidden>
                →
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Flag country={ps.player.country} size={13} />
                {ps.player.name}
              </span>
            </h3>
          </div>
        </div>
        <div className="text-right">
          <Pts
            value={v.total}
            className={`text-3xl font-bold ${
              view === "prev" ? "text-muted" : "text-turf-bright"
            }`}
          />
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-faint">
            pts
          </p>
        </div>
      </header>

      {/* switcher */}
      <div
        className="mt-3 flex gap-1 rounded-xl border border-line/60 bg-bg-2/40 p-1"
        role="tablist"
        aria-label="View points by player"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={view === t.key}
            onClick={() => setView(t.key)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
              view === t.key
                ? "bg-turf/15 text-turf-bright"
                : "text-muted hover:text-chalk"
            }`}
          >
            <span className="truncate">{t.label}</span>
            <span className="shrink-0 font-mono tnum text-[0.7rem] opacity-80">
              {t.pts}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-1.5 px-1 text-[0.65rem] uppercase tracking-wider text-faint">
        {v.caption}
      </p>

      {v.pills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {v.pills.map((p, i) => (
            <StatPill key={i} icon={p.icon} value={p.value} label={p.label} />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-line/60 pt-3">
        <ScoreLines lines={v.lines} />
      </div>

      <MatchLog perMatch={v.perMatch} />
    </article>
  );
}
