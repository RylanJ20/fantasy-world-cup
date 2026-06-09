"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag } from "./ui";
import type { EnrichedFixture, InvolvedAsset } from "@/lib/fixtures";

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

function fmtTime(utc?: string | null): string | null {
  if (!utc) return null;
  return new Date(utc).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDay(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function AssetChip({ a }: { a: InvolvedAsset }) {
  return (
    <Link
      href={`/manager/${a.managerId}`}
      className="link-row inline-flex items-center gap-1.5 rounded-full border border-line bg-bg-2/60 px-2.5 py-1 text-xs"
    >
      <span className="font-bold text-chalk">{a.managerName}</span>
      <span className="text-faint">·</span>
      <span className="text-muted">{a.name}</span>
      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-faint">
        {a.kind === "team" ? "team" : a.position}
      </span>
    </Link>
  );
}

function Team({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <span
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <Flag country={name} size={18} />
      <span className="truncate font-display text-base tracking-wide text-chalk sm:text-lg">
        {name}
      </span>
    </span>
  );
}

function FixtureCard({ f }: { f: EnrichedFixture }) {
  const finished = f.status === "FINISHED";
  const time = fmtTime(f.utcDate);

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="badge pos-MID">{f.stage}</span>
        <span className="font-mono text-xs text-faint">
          {finished ? "Full time" : (time ?? "TBD")}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Team name={f.home} align="left" />
        <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-chalk">
          {finished && f.homeScore != null && f.awayScore != null ? (
            `${f.homeScore}–${f.awayScore}`
          ) : (
            <span className="text-faint">v</span>
          )}
        </span>
        <Team name={f.away} align="right" />
      </div>

      {f.assets.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line/60 pt-3">
          {f.assets.map((a, i) => (
            <AssetChip key={`${a.managerId}-${a.name}-${i}`} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FixtureBoard({ fixtures }: { fixtures: EnrichedFixture[] }) {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(localToday()), []);

  // Group consecutive fixtures by date (already sorted chronologically).
  const groups: { date: string; items: EnrichedFixture[] }[] = [];
  for (const f of fixtures) {
    const last = groups[groups.length - 1];
    if (last && last.date === f.date) last.items.push(f);
    else groups.push({ date: f.date, items: [f] });
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => {
        const isToday = today === g.date;
        const isPast = today !== null && g.date < today;
        return (
          <section
            key={g.date}
            className={`scroll-mt-20 ${isPast ? "opacity-60" : ""}`}
            id={isToday ? "today" : undefined}
          >
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-xl tracking-wide text-chalk">
                {fmtDay(g.date)}
              </h2>
              {isToday && (
                <span className="badge border-turf/40 bg-turf/12 text-turf-bright">
                  Today
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((f, i) => (
                <FixtureCard key={f.n ?? i} f={f} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
