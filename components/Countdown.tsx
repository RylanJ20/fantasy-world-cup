"use client";

import { useEffect, useState } from "react";
import { TrophyIcon } from "./icons";

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

const pad = (n: number) => String(n).padStart(2, "0");

/** Homepage ribbon: "Kicks off soon" + a live countdown. Vanishes at kickoff. */
export function KickoffBanner({ kickoff }: { kickoff: string }) {
  const { r, mounted, elapsed } = useCountdown(kickoff);
  if (elapsed) return null;

  return (
    <div className="mt-6 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-gold/40 bg-gradient-to-r from-gold/15 to-transparent px-4 py-2.5">
      <span className="flex items-center gap-2 text-sm">
        <TrophyIcon size={20} className="text-gold-bright" />
        <span className="font-bold text-gold-bright">Kicks off soon</span>
      </span>
      <span className="flex items-baseline gap-2 font-mono text-base tabular-nums text-chalk">
        {mounted && r ? (
          <>
            <Tick value={r.days} label="d" />
            <Tick value={r.hours} label="h" pad />
            <Tick value={r.mins} label="m" pad />
            <Tick value={r.secs} label="s" pad />
          </>
        ) : (
          <span className="text-muted">soon</span>
        )}
      </span>
    </div>
  );
}

function Tick({ value, label, pad: doPad }: { value: number; label: string; pad?: boolean }) {
  return (
    <span>
      <span className="font-bold text-turf-bright">{doPad ? pad(value) : value}</span>
      <span className="text-[0.7rem] text-faint">{label}</span>
    </span>
  );
}
