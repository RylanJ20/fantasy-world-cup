import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllManagerSlugs,
  getManagerScore,
  getManagerScores,
} from "@/lib/league";
import { PitchFormation } from "@/components/PitchFormation";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamCard } from "@/components/TeamCard";
import { Avatar, Pts, SectionTitle } from "@/components/ui";
import { ArrowLeft, BootIcon, CrownIcon, ShieldIcon } from "@/components/icons";

export function generateStaticParams() {
  return getAllManagerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = getManagerScore(slug);
  if (!m) return { title: "Manager not found" };
  return {
    title: `${m.manager.name} — ${m.total} pts`,
    description: `${m.manager.name}'s fantasy squad and scoring breakdown.`,
  };
}

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default async function ManagerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const m = getManagerScore(slug);
  if (!m) notFound();

  const fieldSize = getManagerScores().length;
  const playerShare = m.total > 0 ? (m.playersTotal / m.total) * 100 : 50;
  const seed = getManagerScores().findIndex((s) => s.manager.id === slug);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition-colors hover:text-chalk"
      >
        <ArrowLeft size={16} /> Standings
      </Link>

      {/* ── Manager header ─────────────────────────────────────────────── */}
      <header className="reveal relative mt-4 overflow-hidden rounded-2xl border border-line-strong panel p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className={
                m.rank === 1
                  ? "rounded-full ring-2 ring-gold/70 shadow-[0_0_50px_-12px_rgba(255,197,61,0.5)]"
                  : ""
              }
            >
              <Avatar name={m.manager.name} size={72} seed={seed < 0 ? 0 : seed} />
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className={`badge ${
                    m.rank === 1
                      ? "border-gold/40 text-gold-bright"
                      : "text-muted"
                  }`}
                >
                  {m.rank === 1 && <CrownIcon size={14} />}
                  {ORDINAL[m.rank] ?? `${m.rank}th`} of {fieldSize}
                </span>
              </div>
              <h1 className="font-display text-4xl leading-none tracking-wide text-chalk sm:text-5xl">
                {m.manager.name}
              </h1>
              {m.manager.tagline && (
                <p className="mt-1.5 text-sm text-muted">{m.manager.tagline}</p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right">
            <Pts
              value={m.total}
              className="font-display text-6xl leading-none text-turf-bright sm:text-7xl"
            />
            <p className="text-xs font-bold uppercase tracking-widest text-faint">
              total points
            </p>
          </div>
        </div>

        {/* players vs teams split */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-turf-bright">
              <BootIcon size={14} /> Players {m.playersTotal}
            </span>
            <span className="flex items-center gap-1.5 text-sky">
              Teams {m.teamsTotal} <ShieldIcon size={14} />
            </span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-bg-2">
            <span
              className="h-full bg-gradient-to-r from-turf-deep to-turf-bright"
              style={{ width: `${playerShare}%` }}
            />
            <span className="h-full flex-1 bg-gradient-to-r from-sky/70 to-sky/40" />
          </div>
        </div>
      </header>

      {/* ── Squad ──────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="Starting XI"
          title="The Squad"
          icon={<BootIcon size={24} />}
          right={
            <span className="hidden text-xs text-faint sm:block">
              {m.playersTotal} pts from players
            </span>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <PitchFormation players={m.players} />
            <p className="mt-2 px-1 text-center text-xs text-faint">
              Numbers show each player&apos;s points. Tap to jump to their card.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {m.players.map((ps, i) => (
              <div
                key={ps.player.name}
                className="reveal"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                <PlayerCard ps={ps} rank={i + 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Teams ──────────────────────────────────────────────────────── */}
      <section className="mt-12">
        <SectionTitle
          eyebrow="Drafted nations"
          title="The Teams"
          icon={<ShieldIcon size={24} />}
          right={
            <span className="hidden text-xs text-faint sm:block">
              {m.teamsTotal} pts from teams
            </span>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {m.teams.map((ts, i) => (
            <div
              key={ts.team.country}
              className="reveal"
              style={{ animationDelay: `${i * 45}ms` }}
            >
              <TeamCard ts={ts} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
