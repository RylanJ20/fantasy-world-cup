import type { PlayerScore } from "@/lib/scoring";
import type { Position } from "@/lib/types";

export function playerAnchor(name: string): string {
  return "p-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const NODE_TONE: Record<Position, string> = {
  GK: "border-amber/60 text-amber",
  CB: "border-sky/55 text-sky",
  DEF: "border-sky/55 text-sky",
  WB: "border-cyan-300/55 text-cyan-300",
  MID: "border-turf/60 text-turf-bright",
  FWD: "border-rose-300/55 text-rose-300",
};

function lastName(name: string): string {
  const parts = name.split(/\s+/);
  return parts[parts.length - 1];
}

function PlayerNode({ ps }: { ps: PlayerScore }) {
  const { player } = ps;
  return (
    <a
      href={`#${playerAnchor(player.name)}`}
      // Flexible width so any row (incl. a 4-defender back line) always fits.
      className="group flex min-w-0 max-w-[4.5rem] flex-1 flex-col items-center gap-1"
      title={`${player.name} — ${ps.total} pts`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-full border-2 bg-bg/85 font-mono text-sm font-bold shadow-lg backdrop-blur transition-transform group-hover:-translate-y-1 group-hover:scale-105 sm:h-12 sm:w-12 ${NODE_TONE[player.position]}`}
      >
        {ps.total}
      </span>
      <span className="w-full truncate text-center text-[0.62rem] font-bold text-chalk sm:text-[0.7rem]">
        {lastName(player.name)}
      </span>
      <span className="-mt-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-faint">
        {player.position}
      </span>
    </a>
  );
}

/** A substitute standing in the technical area beside the pitch. */
function BenchNode({ ps }: { ps: PlayerScore }) {
  const { player } = ps;
  return (
    <a
      href={`#${playerAnchor(player.name)}`}
      className="group flex w-full min-w-0 flex-col items-center gap-1"
      title={`${player.name} — substitute`}
    >
      <span
        className={`grid h-10 w-10 place-items-center rounded-full border-2 border-dashed bg-bg/85 font-mono text-xs font-bold shadow-lg backdrop-blur transition-transform group-hover:-translate-y-1 sm:h-11 sm:w-11 sm:text-sm ${NODE_TONE[player.position]}`}
      >
        {ps.total}
      </span>
      <span className="w-full truncate text-center text-[0.6rem] font-bold text-chalk">
        {lastName(player.name)}
      </span>
      <span className="-mt-0.5 text-[0.5rem] font-bold uppercase tracking-wider text-amber">
        Sub
      </span>
    </a>
  );
}

function Row({ players }: { players: PlayerScore[] }) {
  return (
    <div className="flex items-start justify-center gap-1.5 sm:gap-3">
      {players.map((ps) => (
        <PlayerNode key={ps.player.name} ps={ps} />
      ))}
    </div>
  );
}

export function PitchFormation({
  players,
  bench = [],
}: {
  players: PlayerScore[];
  bench?: PlayerScore[];
}) {
  const byPos = (...pos: Position[]) =>
    players.filter((p) => pos.includes(p.player.position));

  // Order the back line CB · CB · DEF · WB for a natural shape.
  const back = [...byPos("CB"), ...byPos("DEF"), ...byPos("WB")];
  const fwd = byPos("FWD");
  const mid = byPos("MID");
  const gk = byPos("GK");

  return (
    <div className="flex overflow-hidden rounded-2xl border border-line-strong">
      {/* field */}
      <div className="relative min-w-0 flex-1">
        {/* turf */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0d2c1a] to-[#08200f]" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 36px, transparent 36px 72px)",
          }}
        />
        {/* chalk markings */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 150"
          preserveAspectRatio="none"
          aria-hidden
        >
          <rect className="chalk" x="3" y="3" width="94" height="144" rx="1" />
          <line className="chalk" x1="3" y1="75" x2="97" y2="75" />
          <circle className="chalk" cx="50" cy="75" r="13" />
          <circle cx="50" cy="75" r="1" fill="rgba(236,253,242,0.25)" />
          {/* top box */}
          <rect className="chalk" x="28" y="3" width="44" height="20" />
          <rect className="chalk" x="40" y="3" width="20" height="8" />
          {/* bottom box */}
          <rect className="chalk" x="28" y="127" width="44" height="20" />
          <rect className="chalk" x="40" y="139" width="20" height="8" />
        </svg>

        {/* players */}
        <div className="relative flex flex-col justify-between gap-5 px-2.5 py-6 sm:gap-6 sm:px-4 sm:py-8">
          <Row players={fwd} />
          <Row players={mid} />
          <Row players={back} />
          <Row players={gk} />
        </div>
      </div>

      {/* technical area / subs bench, beside the touchline */}
      {bench.length > 0 && (
        <div className="relative flex w-16 shrink-0 flex-col items-center gap-3 border-l border-dashed border-line-strong bg-[#04130b] px-1.5 py-5 sm:w-[4.75rem]">
          <span className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-faint">
            Subs
          </span>
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            {bench.map((ps) => (
              <BenchNode key={ps.player.name} ps={ps} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
