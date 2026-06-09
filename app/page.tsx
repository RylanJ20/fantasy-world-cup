import Link from "next/link";
import { getStandings, getLeagueTotals, leagueMeta } from "@/lib/league";
import { Podium } from "@/components/Podium";
import { StandingsTable } from "@/components/StandingsTable";
import { LeaderStrip } from "@/components/LeaderStrip";
import { SectionTitle } from "@/components/ui";
import { KickoffBanner } from "@/components/Countdown";
import {
  BallIcon,
  BootIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/icons";

function Ticker() {
  const totals = getLeagueTotals();
  const items = [
    { icon: <StarIcon size={18} />, value: totals.managers, label: "Managers" },
    { icon: <BallIcon size={18} />, value: totals.goals, label: "Goals scored" },
    { icon: <ShieldIcon size={18} />, value: totals.cleanSheets, label: "Clean sheets" },
    { icon: <BootIcon size={18} />, value: totals.points, label: "Points logged" },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1 bg-surface px-4 py-4">
          <dt className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-widest text-faint">
            <span className="text-turf-bright">{it.icon}</span>
            {it.label}
          </dt>
          <dd className="font-mono tnum text-2xl font-bold text-chalk">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function Home() {
  const standings = getStandings();
  const champ = standings[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-line-strong panel p-6 sm:p-10">
        {/* chalk pitch decoration */}
        <svg
          className="pointer-events-none absolute right-0 top-1/2 hidden h-[140%] -translate-y-1/2 opacity-40 md:block"
          viewBox="0 0 400 400"
          aria-hidden
        >
          <circle className="chalk" cx="400" cy="200" r="120" />
          <circle className="chalk" cx="400" cy="200" r="3" fill="rgba(236,253,242,0.2)" />
          <path className="chalk" d="M400 40 V360 M280 110 H400 M280 110 V290 M280 290 H400" />
        </svg>

        <div className="relative max-w-2xl">
          <p className="eyebrow">8 managers · one trophy</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.92] text-chalk sm:text-7xl">
            {leagueMeta.name}
          </h1>
          <p className="mt-4 max-w-md text-balance text-muted">
            Every goal, save and clean sheet — tallied into one table. Tap any
            manager to see their full squad and scoring breakdown.
          </p>

          {champ && champ.total > 0 ? (
            <Link
              href={`/manager/${champ.manager.id}`}
              className="lift mt-6 inline-flex items-center gap-3 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 to-transparent px-4 py-2.5"
            >
              <TrophyIcon size={22} className="text-gold-bright" />
              <span className="text-sm">
                <span className="font-bold text-gold-bright">{champ.manager.name}</span>
                <span className="text-muted"> leads with </span>
                <span className="font-mono font-bold text-chalk">{champ.total}</span>
                <span className="text-muted"> pts</span>
              </span>
            </Link>
          ) : (
            <KickoffBanner kickoff={leagueMeta.kickoff} />
          )}

          <div className="mt-8">
            <Ticker />
          </div>
        </div>
      </section>

      {/* ── Podium ─────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="On the rostrum"
          title="The Podium"
          icon={<TrophyIcon size={24} />}
        />
        <div className="panel px-4 py-8 sm:px-10">
          <Podium rows={standings} />
        </div>
      </section>

      {/* ── Standings ──────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="Full table"
          title="Standings"
          icon={<BallIcon size={24} />}
          right={
            <span className="hidden text-xs text-faint sm:block">
              Sorted by total points
            </span>
          }
        />
        <StandingsTable rows={standings} />
      </section>

      {/* ── Leaders ────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="Standout picks"
          title="League Leaders"
          icon={<StarIcon size={24} />}
        />
        <LeaderStrip />
      </section>
    </div>
  );
}
