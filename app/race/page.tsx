import type { Metadata } from "next";
import { getTitleRace } from "@/lib/titleRace";
import { TitleRace } from "@/components/TitleRace";

export const metadata: Metadata = {
  title: "Title Race",
  description:
    "Replay the fantasy World Cup standings matchday by matchday — every lead change and comeback.",
};

export default function RacePage() {
  const race = getTitleRace();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">The whole season, in motion</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          Title Race
        </h1>
        <p className="mt-4 text-muted">
          Every point traced back to the day it was won. Drag the scrubber or hit
          play to sweep through the tournament and watch the standings re-order in
          real time — hover a manager to follow their line.
        </p>
      </div>

      <div className="mt-8">
        <TitleRace race={race} />
      </div>
    </div>
  );
}
