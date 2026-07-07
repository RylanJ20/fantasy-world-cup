import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Position } from "@/lib/types";
import {
  getAllManagerSlugs,
  getManagerScore,
  getManagerScores,
} from "@/lib/league";
import { PitchFormation } from "@/components/PitchFormation";
import { PlayerCard } from "@/components/PlayerCard";
import { TeamCard } from "@/components/TeamCard";
import { Avatar, Pts, SectionTitle } from "@/components/ui";
import {
  ArrowLeft,
  BootIcon,
  CrownIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/icons";

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

/** Squad cards are grouped by line, top of the pitch down — matching the formation. */
const POSITION_GROUPS: { badge: Position; label: string; positions: Position[] }[] = [
  { badge: "FWD", label: "Forwards", positions: ["FWD"] },
  { badge: "MID", label: "Midfielders", positions: ["MID"] },
  { badge: "DEF", label: "Defenders", positions: ["WB", "CB", "DEF"] },
  { badge: "GK", label: "Goalkeeper", positions: ["GK"] },
];

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

  // The bench = explicit bench picks PLUS the players swapped out mid-tournament
  // (their pre-swap points are already banked in the incoming player's slot;
  // they sit on the bench for the full picture). `swappedOut` are marked so the
  // squad's transfer cards and these bench cards can be told apart.
  const swappedOut = m.players
    .filter((ps) => ps.replaced)
    .map((ps) => ps.replaced!.previousScore);
  const benchAll = [...m.bench, ...swappedOut];

  // Group the squad by position line, carrying a running slot number (01–11).
  let slot = 0;
  const playerGroups = POSITION_GROUPS.map((g) => ({
    ...g,
    players: m.players.filter((ps) => g.positions.includes(ps.player.position)),
  }))
    .filter((g) => g.players.length > 0)
    .map((g) => {
      const start = slot;
      slot += g.players.length;
      return { ...g, start };
    });

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
              <Avatar
                name={m.manager.name}
                size={72}
                seed={seed < 0 ? 0 : seed}
                photo={m.topPhoto}
                photoTitle={m.topPlayer}
              />
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
            <PitchFormation players={m.players} bench={benchAll} />
            <p className="mt-2 px-1 text-center text-xs text-faint">
              Numbers show each player&apos;s points. Tap to jump to their card.
            </p>
          </div>

          <div className="space-y-8">
            {playerGroups.map((g) => (
              <div key={g.badge}>
                <div className="mb-3 flex items-center gap-3">
                  <span className={`badge pos-${g.badge}`}>{g.badge}</span>
                  <h3 className="font-display text-lg tracking-wide text-chalk">
                    {g.label}
                  </h3>
                  <span className="font-mono text-xs text-faint">
                    {g.players.length}
                  </span>
                  <span className="h-px flex-1 bg-line" aria-hidden />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {g.players.map((ps, j) => (
                    <div
                      key={ps.player.name}
                      className="reveal"
                      style={{ animationDelay: `${(g.start + j) * 35}ms` }}
                    >
                      <PlayerCard ps={ps} rank={g.start + j + 1} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bench ──────────────────────────────────────────────────────── */}
      {benchAll.length > 0 && (
        <section className="mt-12">
          <SectionTitle
            eyebrow="Subs"
            title="The Bench"
            icon={<StarIcon size={24} />}
            right={
              <span className="hidden text-xs text-faint sm:block">
                Bench picks don&apos;t score · swapped-out players&apos; points are
                banked in their replacement
              </span>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {m.bench.map((ps) => (
              <PlayerCard key={ps.player.name} ps={ps} rank={0} slotLabel="SUB" />
            ))}
            {swappedOut.map((ps) => (
              <PlayerCard key={ps.player.name} ps={ps} rank={0} slotLabel="OUT" />
            ))}
          </div>
        </section>
      )}

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
        {m.teams.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 px-6 py-10 text-center">
            <ShieldIcon size={28} className="text-faint" />
            <p className="font-display text-xl tracking-wide text-muted">
              Teams not added yet
            </p>
            <p className="max-w-sm text-sm text-faint">
              Once the 6 drafted nations are in, their results and points show up
              here automatically.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
