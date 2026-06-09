import Link from "next/link";
import type { ReactNode } from "react";
import { getLeagueLeaders } from "@/lib/league";
import { BootIcon, GloveIcon, ShieldIcon, TargetIcon } from "./icons";

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
  href: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="lift panel reveal flex flex-col gap-3 p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
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
    </Link>
  );
}

export function LeaderStrip() {
  const { topScorer, topKeeper, topTeam, mostGoals } = getLeagueLeaders();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {topScorer && (
        <LeaderCard
          icon={<BootIcon size={22} />}
          label="Top points"
          name={topScorer.subject.player.name}
          meta={`${topScorer.subject.player.country} · ${topScorer.managerName}`}
          value={topScorer.value}
          unit="pts"
          href={`/manager/${topScorer.managerId}`}
          delay={0}
        />
      )}
      {mostGoals && mostGoals.value > 0 && (
        <LeaderCard
          icon={<TargetIcon size={22} />}
          label="Golden boot"
          name={mostGoals.subject.player.name}
          meta={`${mostGoals.subject.player.country} · ${mostGoals.managerName}`}
          value={mostGoals.value}
          unit="goals"
          href={`/manager/${mostGoals.managerId}`}
          delay={70}
        />
      )}
      {topKeeper && (
        <LeaderCard
          icon={<GloveIcon size={22} />}
          label="Golden glove"
          name={topKeeper.subject.player.name}
          meta={`${topKeeper.subject.player.country} · ${topKeeper.managerName}`}
          value={topKeeper.value}
          unit="pts"
          href={`/manager/${topKeeper.managerId}`}
          delay={140}
        />
      )}
      {topTeam && (
        <LeaderCard
          icon={<ShieldIcon size={22} />}
          label="Best team pick"
          name={topTeam.subject.team.country}
          meta={`${topTeam.subject.record.w}W-${topTeam.subject.record.d}D-${topTeam.subject.record.l}L · ${topTeam.managerName}`}
          value={topTeam.value}
          unit="pts"
          href={`/manager/${topTeam.managerId}`}
          delay={210}
        />
      )}
    </div>
  );
}
