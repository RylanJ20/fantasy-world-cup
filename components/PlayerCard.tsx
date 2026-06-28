import type { PlayerScore } from "@/lib/scoring";
import { Flag, Pts, PositionBadge, ScoreLines, StatPill } from "./ui";
import { statPills } from "./playerPills";
import { MatchLog } from "./MatchLog";
import { ReplacementCard } from "./ReplacementCard";
import { playerAnchor } from "./PitchFormation";

export function PlayerCard({
  ps,
  rank,
  slotLabel,
}: {
  ps: PlayerScore;
  rank: number;
  /** Overrides the rank number, e.g. "SUB" for bench players. */
  slotLabel?: string;
}) {
  // A replaced slot renders as the interactive transfer switcher.
  if (ps.replaced) {
    return <ReplacementCard ps={ps} rank={rank} slotLabel={slotLabel} />;
  }

  const { player } = ps;
  const pills = statPills(ps);

  return (
    <article
      id={playerAnchor(player.name)}
      className="player-card panel scroll-mt-24 p-4 transition-colors"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-faint">
            {slotLabel ?? String(rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <PositionBadge position={player.position} />
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Flag country={player.country} size={13} />
                {player.country}
              </span>
            </div>
            <h3 className="truncate font-display text-xl leading-tight tracking-wide text-chalk">
              {player.name}
            </h3>
            {player.note && (
              <p className="mt-1 text-xs italic text-faint">{player.note}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <Pts value={ps.total} className="text-3xl font-bold text-turf-bright" />
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-faint">
            pts
          </p>
        </div>
      </header>

      {pills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((p, i) => (
            <StatPill key={i} icon={p.icon} value={p.value} label={p.label} />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-line/60 pt-3">
        <ScoreLines lines={ps.lines} />
      </div>

      <MatchLog perMatch={ps.perMatch} />
    </article>
  );
}
