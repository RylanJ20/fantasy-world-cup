// ──────────────────────────────────────────────────────────────────────────
//  Team of the Tournament — the point leaders at each position across all 48
//  nations, rendered on the same pitch as a manager's squad (PitchField). Each
//  node links to the owning manager when the leader is a drafted player.
// ──────────────────────────────────────────────────────────────────────────

import Link from "next/link";
import type { LeaderRow, TotmLine } from "@/lib/league";
import { Flag } from "@/components/ui";
import { PitchField } from "@/components/PitchFormation";
import { shirtName } from "@/lib/shirtNames";

const LINE_TONE: Record<TotmLine["line"], string> = {
  GK: "border-amber/60 text-amber",
  DEF: "border-sky/55 text-sky",
  MID: "border-turf/60 text-turf-bright",
  FWD: "border-rose-300/55 text-rose-300",
};

function TotmNode({ row, line }: { row: LeaderRow; line: TotmLine["line"] }) {
  const title = `${row.name} — ${row.country} · ${row.value} pts${
    row.managerName ? ` · ${row.managerName}` : ""
  }`;
  const body = (
    <>
      <span
        className={`grid h-11 w-11 place-items-center rounded-full border-2 bg-bg/85 font-mono text-sm font-bold shadow-lg backdrop-blur transition-transform group-hover:-translate-y-1 group-hover:scale-105 sm:h-12 sm:w-12 ${LINE_TONE[line]}`}
      >
        {row.value}
      </span>
      {/* Reserve two lines so compound names wrap instead of truncating. */}
      <span className="flex min-h-[1.55rem] w-full items-center justify-center sm:min-h-[1.75rem]">
        <span className="line-clamp-2 text-center text-[0.62rem] font-bold leading-tight text-chalk sm:text-[0.7rem]">
          {shirtName(row.name)}
        </span>
      </span>
      {/* Flag + manager (drafted) or position line (undrafted). */}
      <span className="flex max-w-full items-center gap-1">
        <Flag country={row.country} size={10} />
        <span
          className={`min-w-0 truncate text-[0.55rem] font-bold uppercase tracking-wider ${
            row.managerName ? "text-turf-bright" : "text-faint"
          }`}
        >
          {row.managerName ?? line}
        </span>
      </span>
    </>
  );
  // Flexible width so any row (incl. the 4-defender back line) always fits.
  const cls = "group flex min-w-0 max-w-[4.5rem] flex-1 flex-col items-center gap-1";
  return row.managerId ? (
    <Link href={`/manager/${row.managerId}`} className={cls} title={title}>
      {body}
    </Link>
  ) : (
    <span className={cls} title={title}>
      {body}
    </span>
  );
}

function TotmRow({ players, line }: { players: LeaderRow[]; line: TotmLine["line"] }) {
  return (
    <div className="flex items-start justify-center gap-1.5 sm:gap-3">
      {players.map((row) => (
        <TotmNode key={`${row.country}-${row.name}`} row={row} line={line} />
      ))}
    </div>
  );
}

export function TeamOfTournament({ lines }: { lines: TotmLine[] }) {
  if (lines.every((l) => l.players.length === 0)) {
    return (
      <p className="px-4 py-10 text-center text-sm text-faint">
        No points on the board yet — the XI fills in as results arrive.
      </p>
    );
  }
  return (
    <PitchField>
      {lines.map((l) => (
        <TotmRow key={l.line} players={l.players} line={l.line} />
      ))}
    </PitchField>
  );
}
