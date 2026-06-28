import type { Metadata } from "next";
import { getBracket } from "@/lib/bracket";
import { Bracket } from "@/components/Bracket";
import { SectionTitle } from "@/components/ui";
import { TrophyIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Knockout Bracket",
  description: "The full World Cup knockout bracket — every team's path to the final.",
};

export default function BracketPage() {
  const bracket = getBracket();
  const empty = bracket.rounds.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
      <SectionTitle
        eyebrow="Knockout stage"
        title="The Bracket"
        icon={<TrophyIcon size={24} />}
      />
      {empty ? (
        <div className="panel px-6 py-10 text-center text-muted">
          The knockout bracket appears once the group stage is complete.
        </div>
      ) : (
        <Bracket bracket={bracket} />
      )}
    </div>
  );
}
