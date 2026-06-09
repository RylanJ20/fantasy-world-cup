import type { Metadata } from "next";
import { Countdown } from "@/components/Countdown";
import { leagueMeta } from "@/lib/league";
import { BallIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Kickoff Countdown",
  description: "Counting down to the first match.",
};

export default function CountdownPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
      <section className="relative overflow-hidden rounded-2xl border border-line-strong panel px-4 py-12 text-center sm:px-10 sm:py-16">
        {/* chalk centre-circle flourish */}
        <svg
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 opacity-30"
          viewBox="0 0 400 400"
          aria-hidden
        >
          <circle className="chalk" cx="200" cy="200" r="120" />
          <circle cx="200" cy="200" r="3" fill="rgba(236,253,242,0.25)" />
        </svg>

        <div className="relative flex flex-col items-center">
          <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-line-strong bg-surface text-turf-bright">
            <BallIcon size={28} />
          </span>
          <p className="eyebrow">{leagueMeta.season}</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-chalk sm:text-7xl">
            Kicks off in
          </h1>
          <p className="mt-3 mb-10 max-w-md text-balance text-muted">
            Every squad sits level at zero until the first whistle. Get your
            trash talk ready.
          </p>

          <Countdown kickoff={leagueMeta.kickoff} />
        </div>
      </section>
    </div>
  );
}
