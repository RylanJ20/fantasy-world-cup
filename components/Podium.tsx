import Link from "next/link";
import type { StandingRow } from "@/lib/league";
import { Avatar, Pts } from "./ui";
import { CrownIcon } from "./icons";

const STYLES: Record<
  number,
  { ring: string; pedestal: string; height: string; glow: string; medal: string }
> = {
  1: {
    ring: "ring-2 ring-gold/70",
    pedestal: "from-gold/25 to-gold/5 border-gold/40",
    height: "h-28 sm:h-36",
    glow: "shadow-[0_0_60px_-12px_rgba(255,197,61,0.45)]",
    medal: "text-gold-bright",
  },
  2: {
    ring: "ring-1 ring-line-strong",
    pedestal: "from-white/10 to-white/0 border-line-strong",
    height: "h-20 sm:h-28",
    glow: "",
    medal: "text-muted",
  },
  3: {
    ring: "ring-1 ring-amber/30",
    pedestal: "from-amber/15 to-amber/0 border-amber/25",
    height: "h-16 sm:h-24",
    glow: "",
    medal: "text-amber",
  },
};

function PodiumColumn({ row, seed }: { row: StandingRow; seed: number }) {
  const s = STYLES[row.rank] ?? STYLES[3];
  const isChamp = row.rank === 1;
  return (
    <Link
      href={`/manager/${row.manager.id}`}
      className="group flex flex-1 flex-col items-center justify-end gap-3"
    >
      <div className="flex flex-col items-center gap-2">
        {isChamp && <CrownIcon size={26} className={`${s.medal} drop-shadow`} />}
        <div className={`rounded-full ${s.ring} ${s.glow} transition-transform group-hover:-translate-y-1`}>
          <Avatar name={row.manager.name} size={isChamp ? 64 : 52} seed={seed} />
        </div>
        <div className="text-center">
          <p className="font-display text-base tracking-wide text-chalk sm:text-lg">
            {row.manager.name}
          </p>
          <p className="font-mono text-xs text-faint">
            {row.players.length}+{row.teams.length} squad
          </p>
        </div>
      </div>

      <div
        className={`flex ${s.height} w-full flex-col items-center justify-start rounded-t-xl border border-b-0 bg-gradient-to-b px-2 pt-3 ${s.pedestal}`}
      >
        <span className={`font-display text-3xl sm:text-4xl ${s.medal}`}>
          {row.rank}
        </span>
        <Pts value={row.total} className="mt-1 text-lg font-bold text-chalk" />
        <span className="text-[0.6rem] font-bold uppercase tracking-widest text-faint">
          pts
        </span>
      </div>
    </Link>
  );
}

export function Podium({ rows }: { rows: StandingRow[] }) {
  // rows are rank-sorted; arrange as 2 · 1 · 3 for a classic podium.
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const seedOf = (id: string) =>
    rows.findIndex((r) => r.manager.id === id);

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {order.map((row) => (
        <PodiumColumn key={row.manager.id} row={row} seed={seedOf(row.manager.id)} />
      ))}
    </div>
  );
}
