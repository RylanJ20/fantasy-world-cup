import Link from "next/link";
import Image from "next/image";
import { getStandings, getLeagueTotals, getLeagueLeaders, leagueMeta } from "@/lib/league";
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
  TrendIcon,
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
        {/* faint chalk pitch arc for texture, behind the trophy */}
        <svg
          className="pointer-events-none absolute right-0 top-1/2 hidden h-[140%] -translate-y-1/2 opacity-20 lg:block"
          viewBox="0 0 400 400"
          aria-hidden
        >
          <circle className="chalk" cx="400" cy="200" r="120" />
          <path className="chalk" d="M400 40 V360 M280 110 H400 M280 110 V290 M280 290 H400" />
        </svg>

        {/* The World Cup trophy, raised under a spotlight */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-0 flex items-center justify-end opacity-25 sm:opacity-40 lg:opacity-100">
          <div className="reveal relative" style={{ animationDelay: "0.18s" }}>
            {/* warm spotlight glow */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-[120%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,201,77,0.28), rgba(255,201,77,0.07) 55%, transparent 78%)",
              }}
            />
            <Image
              src="/world-cup-trophy.png"
              alt="The FIFA World Cup trophy"
              width={415}
              height={877}
              priority
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 240px, 200px"
              className="-mr-6 h-auto w-[200px] select-none drop-shadow-[0_28px_60px_rgba(0,0,0,0.65)] sm:-mr-4 sm:w-[240px] lg:mr-1 lg:w-[320px]"
            />
          </div>
        </div>

        <div className="relative z-10 max-w-2xl">
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
            <Link
              href="/race"
              className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-bold text-turf-bright transition-colors hover:text-turf"
            >
              <TrendIcon size={15} />
              Watch the title race
            </Link>
          }
        />
        <StandingsTable rows={standings} />
      </section>

      {/* ── Leaders ────────────────────────────────────────────────────── */}
      {getLeagueLeaders().length > 0 && (
        <section className="mt-12">
          <SectionTitle
            eyebrow="Standout picks"
            title="League Leaders"
            icon={<StarIcon size={24} />}
          />
          <LeaderStrip />
        </section>
      )}
    </div>
  );
}
