import type { Metadata } from "next";
import { getLeaderboardsView } from "@/lib/league";
import { LeaderboardsExplorer } from "@/components/LeaderboardsExplorer";

export const metadata: Metadata = {
  title: "Leaderboards",
  description: "World Cup stat leaders and fantasy leaderboards by category.",
};

export default function LeaderboardsPage() {
  // Both views are computed up front; the client toggle swaps between them.
  const all = getLeaderboardsView({ draftedOnly: false });
  const drafted = getLeaderboardsView({ draftedOnly: true });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">The whole tournament</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          Leaderboards
        </h1>
        <p className="mt-4 text-muted">
          Real World Cup stat leaders across all 48 nations — every player is
          ranked, with drafted players tagged by their manager. Toggle to focus
          on just the league&apos;s drafted players.
        </p>
      </div>

      <LeaderboardsExplorer all={all} drafted={drafted} />
    </div>
  );
}
