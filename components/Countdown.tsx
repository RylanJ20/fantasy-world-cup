"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "./icons";

type Remaining = { days: number; hours: number; mins: number; secs: number };

function remaining(target: number): Remaining | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

/** Ticking remaining time. `r` is null once elapsed; `mounted` guards hydration. */
export function useCountdown(kickoff: string) {
  const target = new Date(kickoff).getTime();
  const [r, setR] = useState<Remaining | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tick = () => setR(remaining(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return { r, mounted, elapsed: mounted && r === null };
}

function Box({ value }: { value: string }) {
  return (
    <div className="panel flex min-w-[4.75rem] flex-col items-center px-3 py-4 sm:min-w-[7rem] sm:px-6 sm:py-7">
      <span className="font-display text-5xl leading-none tabular-nums text-turf-bright sm:text-7xl">
        {value}
      </span>
    </div>
  );
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <Box value={value} />
      <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-faint sm:text-xs">
        {label}
      </span>
    </div>
  );
}

/** Big kickoff countdown. Renders an "underway" state once the time passes. */
export function Countdown({ kickoff }: { kickoff: string }) {
  const { r, mounted, elapsed } = useCountdown(kickoff);

  if (elapsed) {
    return (
      <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="eyebrow">The wait is over</p>
        <h2 className="font-display text-4xl text-turf-bright sm:text-6xl">
          We&apos;re underway
        </h2>
        <p className="max-w-sm text-muted">
          The tournament has kicked off. Time to track some points.
        </p>
        <Link
          href="/"
          className="lift mt-3 inline-flex items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-5 py-2.5 text-sm font-bold text-chalk"
        >
          View the standings <ChevronRight size={16} />
        </Link>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const v = mounted && r ? r : null;
  const localKickoff =
    mounted &&
    new Date(kickoff).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-start justify-center gap-3 sm:gap-5">
        <Unit value={v ? String(v.days) : "—"} label="Days" />
        <Unit value={v ? pad(v.hours) : "—"} label="Hours" />
        <Unit value={v ? pad(v.mins) : "—"} label="Minutes" />
        <Unit value={v ? pad(v.secs) : "—"} label="Seconds" />
      </div>
      {localKickoff && (
        <p className="text-sm text-muted">
          First match · <span className="text-chalk">{localKickoff}</span>{" "}
          <span className="text-faint">(your local time)</span>
        </p>
      )}
    </div>
  );
}
