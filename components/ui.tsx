import type { ReactNode } from "react";
import type { Position } from "@/lib/types";
import type { ScoreLine } from "@/lib/scoring";

export const POSITION_LABEL: Record<Position, string> = {
  GK: "Goalkeeper",
  CB: "Centre-back",
  DEF: "Defender",
  WB: "Wing-back",
  MID: "Midfield",
  FWD: "Forward",
};

export function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/** Big tabular points number. */
export function Pts({
  value,
  className = "",
  showSign = false,
}: {
  value: number;
  className?: string;
  showSign?: boolean;
}) {
  return (
    <span className={`font-mono tnum tabular-nums ${className}`}>
      {showSign ? signed(value) : value}
    </span>
  );
}

export function PositionBadge({ position }: { position: Position }) {
  return (
    <span className={`badge pos-${position}`} title={POSITION_LABEL[position]}>
      {position}
    </span>
  );
}

export function CountryTag({ country }: { country: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-turf/70" aria-hidden />
      {country}
    </span>
  );
}

/** A small stat with an icon, used on cards. */
export function StatPill({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-bg-2/60 px-2.5 py-1.5">
      <span className="text-turf-bright">{icon}</span>
      <span className="font-mono tnum text-sm font-bold text-chalk">{value}</span>
      <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-faint">
        {label}
      </span>
    </div>
  );
}

/** Itemised scoring breakdown (one row per scoring category). */
export function ScoreLines({ lines }: { lines: ScoreLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="px-1 py-2 text-sm text-faint">No points recorded yet.</p>
    );
  }
  return (
    <ul className="divide-y divide-line/60">
      {lines.map((l, i) => (
        <li
          key={i}
          className="flex items-center justify-between gap-3 py-1.5 text-sm"
        >
          <span className="text-muted">{l.label}</span>
          <span className="flex items-center gap-3">
            <span className="font-mono text-xs text-faint">{l.detail}</span>
            <span
              className={`w-10 text-right font-mono tnum font-bold ${
                l.tone === "bad" ? "text-red" : "text-turf-bright"
              }`}
            >
              {signed(l.points)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Win / Draw / Loss record badges for a drafted team. */
export function RecordBadges({
  w,
  d,
  l,
}: {
  w: number;
  d: number;
  l: number;
}) {
  return (
    <span className="flex items-center gap-1 font-mono text-xs font-bold">
      <span className="rounded bg-turf/15 px-1.5 py-0.5 text-turf-bright">{w}W</span>
      <span className="rounded bg-white/8 px-1.5 py-0.5 text-muted">{d}D</span>
      <span className="rounded bg-red/12 px-1.5 py-0.5 text-red">{l}L</span>
    </span>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_TONES = [
  "from-turf/30 to-turf-deep/20 text-turf-bright",
  "from-gold/30 to-amber/10 text-gold-bright",
  "from-sky/30 to-sky/5 text-sky",
  "from-red/25 to-red/5 text-red",
];

export function Avatar({
  name,
  size = 40,
  seed = 0,
}: {
  name: string;
  size?: number;
  seed?: number;
}) {
  const tone = AVATAR_TONES[seed % AVATAR_TONES.length];
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full border border-line-strong bg-gradient-to-br font-display tracking-wide ${tone}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  icon,
  right,
}: {
  eyebrow?: string;
  title: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h2 className="flex items-center gap-2 font-display text-2xl text-chalk sm:text-3xl">
          {icon && <span className="text-turf-bright">{icon}</span>}
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}
