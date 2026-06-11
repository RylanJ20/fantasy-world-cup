import Link from "next/link";
import type { ReactNode } from "react";
import { getLeagueLeaders } from "@/lib/league";
import { BootIcon, GloveIcon, ShieldIcon, TargetIcon } from "./icons";

const ICONS: Record<string, ReactNode> = {
  points: <BootIcon size={22} />,
  boot: <TargetIcon size={22} />,
  glove: <GloveIcon size={22} />,
  team: <ShieldIcon size={22} />,
};

function LeaderCard({
  icon,
  label,
  name,
  meta,
  value,
  unit,
  href,
  delay,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  meta: string;
  value: number;
  unit: string;
  href?: string;
  delay: number;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="eyebrow">{label}</span>
        <span className="text-turf-bright">{icon}</span>
      </div>
      <div>
        <p className="font-display text-xl leading-tight tracking-wide text-chalk">
          {name}
        </p>
        <p className="text-xs text-faint">{meta}</p>
      </div>
      <div className="mt-auto flex items-baseline gap-1.5">
        <span className="font-mono tnum text-2xl font-bold text-turf-bright">
          {value}
        </span>
        <span className="text-[0.66rem] font-bold uppercase tracking-widest text-faint">
          {unit}
        </span>
      </div>
    </>
  );
  const className = "lift panel reveal flex flex-col gap-3 p-4";
  const style = { animationDelay: `${delay}ms` };
  return href ? (
    <Link href={href} className={className} style={style}>
      {body}
    </Link>
  ) : (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

export function LeaderStrip() {
  const cards = getLeagueLeaders();
  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c, i) => (
        <LeaderCard
          key={c.key}
          icon={ICONS[c.key]}
          label={c.label}
          name={c.name}
          meta={c.meta}
          value={c.value}
          unit={c.unit}
          href={c.href}
          delay={i * 70}
        />
      ))}
    </div>
  );
}
