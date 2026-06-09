import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { getLeaderboards, type LeaderboardCategory } from "@/lib/league";
import { Flag, Pts } from "@/components/ui";
import {
  BootIcon,
  GloveIcon,
  NetIcon,
  ShieldIcon,
  StarIcon,
  TrophyIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "Cross-league player leaderboards by category.",
};

const ICONS: Record<string, ReactNode> = {
  points: <TrophyIcon size={20} />,
  goals: <BootIcon size={20} />,
  assists: <NetIcon size={20} />,
  motm: <StarIcon size={20} />,
  glove: <GloveIcon size={20} />,
  defender: <ShieldIcon size={20} />,
};

function rankTone(rank: number) {
  return rank === 1
    ? "text-gold-bright"
    : rank === 2
      ? "text-muted"
      : rank === 3
        ? "text-amber"
        : "text-faint";
}

function CategoryCard({ cat }: { cat: LeaderboardCategory }) {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <span className="text-turf-bright">{ICONS[cat.key]}</span>
        <h3 className="font-display text-lg tracking-wide text-chalk">{cat.title}</h3>
        <span className="ml-auto text-[0.62rem] font-bold uppercase tracking-widest text-faint">
          {cat.unit}
        </span>
      </div>
      <ul>
        {cat.rows.map((row, i) => (
          <li key={`${row.managerId}-${row.player.player.name}`}>
            <Link
              href={`/manager/${row.managerId}`}
              className="link-row grid grid-cols-[1.4rem_1fr_auto] items-center gap-3 border-b border-line/50 px-4 py-2.5 last:border-0"
            >
              <span className={`text-center font-mono text-sm font-bold ${rankTone(i + 1)}`}>
                {i + 1}
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <Flag country={row.player.player.country} size={13} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-chalk">
                    {row.player.player.name}
                  </span>
                  <span className="block truncate text-[0.7rem] text-faint">
                    {row.player.player.position} · {row.managerName}
                  </span>
                </span>
              </span>
              <Pts
                value={row.value}
                className={`text-base font-bold ${i === 0 ? "text-gold-bright" : "text-turf-bright"}`}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LeaderboardsPage() {
  const categories = getLeaderboards();
  const hasPoints = categories.some((c) => c.rows.some((r) => r.value > 0));

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Across all 8 squads</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          Leaderboards
        </h1>
        <p className="mt-4 text-muted">
          The best individual performers in the draft, regardless of who picked
          them.
        </p>
      </div>

      {!hasPoints && (
        <div className="mt-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-faint">
          No points on the board yet — these tables fill in as matches are
          played.
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <CategoryCard key={cat.key} cat={cat} />
        ))}
      </div>
    </div>
  );
}
