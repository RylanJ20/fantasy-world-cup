import type { Metadata } from "next";
import { getEnrichedFixtures, hasFixtures } from "@/lib/fixtures";
import { FixtureBoard } from "@/components/FixtureBoard";
import { WhistleIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Who's in action",
  description: "World Cup fixtures with each manager's players and teams.",
};

export default function FixturesPage() {
  const fixtures = getEnrichedFixtures();

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Fixtures</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          Who&apos;s in action
        </h1>
        <p className="mt-4 text-muted">
          Every World Cup match, with the drafted players and teams playing in
          it — so you know who to watch each day.
        </p>
      </div>

      <div className="mt-8">
        {hasFixtures ? (
          <FixtureBoard fixtures={fixtures} />
        ) : (
          <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
            <WhistleIcon size={30} className="text-faint" />
            <p className="font-display text-xl tracking-wide text-muted">
              No fixtures loaded yet
            </p>
            <p className="max-w-sm text-sm text-faint">
              Run{" "}
              <code className="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-turf-bright">
                npm run import:fixtures
              </code>{" "}
              with your API key to pull in the World Cup schedule, then commit
              and push.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
