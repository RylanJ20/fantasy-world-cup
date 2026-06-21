import Link from "next/link";
import type { StandingRow } from "@/lib/league";
import { Avatar, Pts } from "./ui";
import { ChevronRight, CrownIcon } from "./icons";

function RankMark({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "text-gold-bright"
      : rank === 2
        ? "text-muted"
        : rank === 3
          ? "text-amber"
          : "text-faint";
  return (
    <span className={`font-display text-2xl tabular-nums ${tone}`}>{rank}</span>
  );
}

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  const leader = rows[0]?.total || 1;

  return (
    <div className="panel overflow-hidden">
      {/* header */}
      <div className="hidden grid-cols-[3rem_1fr_5rem_5rem_6rem_1.5rem] items-center gap-3 border-b border-line px-4 py-3 text-[0.66rem] font-bold uppercase tracking-widest text-faint sm:grid">
        <span className="text-center">#</span>
        <span>Manager</span>
        <span className="text-right">Player Points</span>
        <span className="text-right">Team Points</span>
        <span className="text-right">Total</span>
        <span />
      </div>

      <ul>
        {rows.map((row, i) => (
          <li
            key={row.manager.id}
            className="reveal border-b border-line/60 last:border-0"
            style={{ animationDelay: `${i * 55}ms` }}
          >
            <Link
              href={`/manager/${row.manager.id}`}
              className="link-row grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[3rem_1fr_5rem_5rem_6rem_1.5rem] sm:px-4"
            >
              <span className="flex justify-center">
                <RankMark rank={row.rank} />
              </span>

              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={row.manager.name} size={40} seed={i} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 font-display text-lg leading-tight tracking-wide text-chalk">
                    <span className="truncate">{row.manager.name}</span>
                    {row.rank === 1 && (
                      <CrownIcon size={16} className="shrink-0 text-gold-bright" />
                    )}
                  </span>
                  {/* mobile breakdown + leader bar */}
                  <span className="mt-1 block sm:hidden">
                    <span className="font-mono text-xs text-faint">
                      {row.playersTotal} players · {row.teamsTotal} teams
                    </span>
                  </span>
                  <span className="mt-1.5 hidden h-1 w-32 overflow-hidden rounded-full bg-bg-2 sm:block">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-turf-deep to-turf-bright"
                      style={{ width: `${Math.max(6, (row.total / leader) * 100)}%` }}
                    />
                  </span>
                </span>
              </span>

              <span className="hidden text-right sm:block">
                <Pts value={row.playersTotal} className="text-sm font-semibold text-muted" />
              </span>
              <span className="hidden text-right sm:block">
                <Pts value={row.teamsTotal} className="text-sm font-semibold text-muted" />
              </span>

              <span className="flex items-center justify-end gap-2 sm:gap-3">
                <Pts
                  value={row.total}
                  className={`text-2xl font-bold ${
                    row.rank === 1 ? "text-gold-bright" : "text-chalk"
                  }`}
                />
                <ChevronRight className="hidden text-faint sm:block" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
