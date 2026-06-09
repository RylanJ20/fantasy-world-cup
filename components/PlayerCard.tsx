import type { ReactNode } from "react";
import type { PlayerScore } from "@/lib/scoring";
import { Flag, Pts, PositionBadge, ScoreLines, StatPill, signed } from "./ui";
import { playerAnchor } from "./PitchFormation";
import {
  BootIcon,
  ChevronRight,
  GloveIcon,
  NetIcon,
  ShieldIcon,
  StarIcon,
  TargetIcon,
} from "./icons";

function pills(ps: PlayerScore): { icon: ReactNode; value: number; label: string }[] {
  const t = ps.totals;
  const out: { icon: ReactNode; value: number; label: string }[] = [];
  const push = (icon: ReactNode, value: number, label: string) => {
    if (value) out.push({ icon, value, label });
  };
  push(<BootIcon size={15} />, t.goals, "G");
  push(<NetIcon size={15} />, t.assists, "A");
  if (ps.player.position === "GK") {
    push(<GloveIcon size={15} />, t.saves, "SV");
    push(<ShieldIcon size={15} />, t.cleanSheets, "CS");
  } else if (["CB", "DEF", "WB"].includes(ps.player.position)) {
    push(<ShieldIcon size={15} />, t.cleanSheets, "CS");
    push(<TargetIcon size={15} />, t.shotsOnGoal, "SoG");
  } else {
    push(<TargetIcon size={15} />, t.shotsOnGoal, "SoG");
    push(<StarIcon size={15} />, t.motm, "MOTM");
  }
  return out.slice(0, 4);
}

export function PlayerCard({ ps, rank }: { ps: PlayerScore; rank: number }) {
  const { player } = ps;
  const statPills = pills(ps);

  return (
    <article
      id={playerAnchor(player.name)}
      className="player-card panel scroll-mt-24 p-4 transition-colors"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 font-mono text-xs font-bold text-faint">
            {String(rank).padStart(2, "0")}
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
          </div>
        </div>
        <div className="text-right">
          <Pts value={ps.total} className="text-3xl font-bold text-turf-bright" />
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-faint">
            pts
          </p>
        </div>
      </header>

      {statPills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {statPills.map((p, i) => (
            <StatPill key={i} icon={p.icon} value={p.value} label={p.label} />
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-line/60 pt-3">
        <ScoreLines lines={ps.lines} />
      </div>

      {ps.perMatch.length > 0 && (
        <details className="group mt-2">
          <summary className="flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-wider text-muted hover:text-chalk">
            <ChevronRight size={14} className="chev" />
            Match log · {ps.perMatch.length}
          </summary>
          <ul className="mt-2 space-y-2">
            {ps.perMatch.map((m, i) => (
              <li
                key={i}
                className="rounded-lg border border-line/60 bg-bg-2/50 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-chalk">
                    {m.match.opponent}
                  </span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      m.points < 0 ? "text-red" : "text-turf-bright"
                    }`}
                  >
                    {signed(m.points)}
                  </span>
                </div>
                {m.lines.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-faint">
                    {m.lines.map((l, j) => (
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
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
