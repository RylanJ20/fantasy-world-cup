"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Bracket, BracketMatch, BracketSide } from "@/lib/bracket";
import { isDone, isLiveNow } from "@/lib/liveStatus";
import { Flag } from "./ui";

/** Flatten every match (incl. third place) into an id → match lookup. */
function indexMatches(b: Bracket): Map<string, BracketMatch> {
  const map = new Map<string, BracketMatch>();
  for (const r of b.rounds) for (const m of r.matches) map.set(m.id, m);
  if (b.thirdPlace) map.set(b.thirdPlace.id, b.thirdPlace);
  return map;
}

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return y && m && d ? `${MON[m - 1]} ${d}` : "";
};

export function Bracket({ bracket }: { bracket: Bracket }) {
  const byId = useMemo(() => indexMatches(bracket), [bracket]);
  const [active, setActive] = useState<{ code: string; ids: Set<string> } | null>(null);
  // Wall-clock, refreshed on a timer so Live badges flip on/off without a
  // reload. Null until mounted to keep SSR / first paint deterministic.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Forward path (this match → final) as a list of ids.
  const pathFrom = (id: string): string[] => {
    const out: string[] = [];
    let cur: string | undefined = id;
    while (cur) {
      out.push(cur);
      cur = byId.get(cur)?.nextId ?? undefined;
    }
    return out;
  };

  // Highlight a team's whole run: every match it appears in, plus the forward
  // path from each, so its route to the final lights up end-to-end.
  const highlight = (code: string) => {
    const ids = new Set<string>();
    for (const m of byId.values())
      if (m.sides.some((s) => s.team?.code === code))
        for (const pid of pathFrom(m.id)) ids.add(pid);
    setActive({ code, ids });
  };
  const dim = (id: string) => active != null && !active.ids.has(id);

  function Side({ side }: { side: BracketSide }) {
    if (side.team) {
      const isActive = active?.code === side.team.code;
      return (
        <div
          onMouseEnter={() => highlight(side.team!.code!)}
          className={`flex w-full items-center gap-1.5 px-2 py-1 transition-colors ${
            side.team.winner ? "font-bold text-chalk" : "text-muted"
          } ${isActive ? "bg-turf/15" : ""}`}
        >
          <Flag country={side.team.name} size={12} />
          <span className="min-w-0 flex-1 truncate text-xs">{side.team.name}</span>
          {side.team.score != null && (
            <span
              className={`font-mono text-xs tabular-nums ${
                side.team.winner ? "text-turf-bright" : "text-faint"
              }`}
            >
              {side.team.score}
            </span>
          )}
        </div>
      );
    }
    // Unresolved — show the feeder game it's waiting on.
    const feeder = side.feederId ? byId.get(side.feederId) : undefined;
    return (
      <div className="flex w-full items-center gap-1 px-2 py-1 text-[0.65rem] text-faint">
        <span className="shrink-0 uppercase tracking-wider opacity-70">Winner</span>
        {feeder ? (
          <span className="flex min-w-0 items-center gap-1 truncate">
            {feeder.sides.map((fs, i) => (
              <span key={i} className="flex items-center gap-0.5">
                {i > 0 && <span className="opacity-40">/</span>}
                {fs.team ? (
                  <Flag country={fs.team.name} size={10} />
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full bg-line-strong" />
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className="opacity-60">TBD</span>
        )}
      </div>
    );
  }

  function Footer({ m }: { m: BracketMatch }) {
    const live = isLiveNow({ status: m.status, utcDate: m.date, stage: "Knockout" }, now);
    if (live)
      return (
        <span className="flex items-center justify-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-wider text-red">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red" />
          Live
        </span>
      );
    if (isDone(m.status))
      return <span className="font-mono text-[0.55rem] font-bold uppercase tracking-wider text-faint">FT</span>;
    return (
      <span className="text-[0.55rem] uppercase tracking-wider text-faint">{fmtDate(m.date)}</span>
    );
  }

  function MatchCard({ m }: { m: BracketMatch }) {
    const onPath = active?.ids.has(m.id);
    const href = m.fixtureN != null ? `/fixtures#fx-${m.fixtureN}` : "/fixtures";
    return (
      <Link
        href={href}
        title="View this match on the fixtures page"
        className={`block overflow-hidden rounded-lg border bg-bg-2/60 backdrop-blur transition-all hover:border-turf/50 ${
          onPath
            ? "border-turf/70 shadow-[0_0_0_1px_rgba(93,255,160,0.35)]"
            : "border-line"
        } ${dim(m.id) ? "opacity-35" : "opacity-100"}`}
      >
        <Side side={m.sides[0]} />
        <div className="h-px bg-line/70" />
        <Side side={m.sides[1]} />
        <div className="border-t border-line/50 px-2 py-0.5 text-center">
          <Footer m={m} />
        </div>
      </Link>
    );
  }

  return (
    <div onMouseLeave={() => setActive(null)}>
      <p className="mb-4 text-sm text-muted">
        Hover a team to trace its path to the final · tap any match to see it on the fixtures page.
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-3 sm:gap-5">
          {bracket.rounds.map((r) => (
            <div key={r.key} className="flex w-36 flex-col sm:w-44">
              <h3 className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-faint">
                {r.label}
              </h3>
              <div className="flex flex-1 flex-col justify-around gap-2">
                {r.matches.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {bracket.thirdPlace && (
        <div className="mt-6 max-w-xs">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-faint">
            Third-place play-off
          </h3>
          <MatchCard m={bracket.thirdPlace} />
        </div>
      )}
    </div>
  );
}
