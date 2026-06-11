import type { Metadata } from "next";
import type { ReactNode } from "react";
import { POINTS } from "@/lib/scoring";
import { SectionTitle, signed } from "@/components/ui";
import {
  BallIcon,
  BootIcon,
  GloveIcon,
  ShieldIcon,
  WhistleIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Scoring",
  description: "How fantasy points are awarded.",
};

function RuleRow({ label, value }: { label: string; value: number }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-line/60 py-2.5 last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span
        className={`font-mono tnum text-base font-bold ${
          value < 0 ? "text-red" : "text-turf-bright"
        }`}
      >
        {signed(value)}
      </span>
    </li>
  );
}

function RuleCard({
  icon,
  eyebrow,
  title,
  scope,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  scope: string;
  children: ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">{eyebrow}</p>
          <h3 className="flex items-center gap-2 font-display text-2xl tracking-wide text-chalk">
            <span className="text-turf-bright">{icon}</span>
            {title}
          </h3>
        </div>
      </div>
      <p className="mb-3 rounded-lg border border-line/60 bg-bg-2/50 px-3 py-1.5 text-xs text-faint">
        Applies to: <span className="font-semibold text-muted">{scope}</span>
      </p>
      <ul>{children}</ul>
    </div>
  );
}

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">The rulebook</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          How scoring works
        </h1>
        <p className="mt-4 text-muted">
          Every manager drafts an 11-player squad{" "}
          <span className="text-chalk">(1 GK · 2 CB · 1 DEF · 1 WB · 3 MID · 3 FWD)</span>{" "}
          and 6 national teams. Points come from real match events.
        </p>
      </div>

      <section className="mt-10">
        <SectionTitle eyebrow="Squad" title="Player Points" icon={<BootIcon size={24} />} />
        <div className="grid gap-4 md:grid-cols-3">
          <RuleCard
            icon={<BallIcon size={22} />}
            eyebrow="Outfield & keepers"
            title="All Players"
            scope="Every drafted player"
          >
            <RuleRow label="Goal" value={POINTS.GOAL} />
            <RuleRow label="Assist" value={POINTS.ASSIST} />
            <RuleRow label="Shot on goal" value={POINTS.SHOT_ON_GOAL} />
            <RuleRow label="Man of the match" value={POINTS.MOTM} />
          </RuleCard>

          <RuleCard
            icon={<GloveIcon size={22} />}
            eyebrow="Between the sticks"
            title="Goalkeeper"
            scope="GK only"
          >
            <RuleRow label="Save" value={POINTS.SAVE} />
            <RuleRow label="Penalty save (in play)" value={POINTS.PK_SAVE} />
            <RuleRow label="Penalty save (shootout)" value={POINTS.SHOOTOUT_SAVE} />
            <RuleRow label="Team win" value={POINTS.GK_WIN} />
            <RuleRow label="Goal allowed (each)" value={POINTS.GOAL_ALLOWED} />
          </RuleCard>

          <RuleCard
            icon={<ShieldIcon size={22} />}
            eyebrow="At the back"
            title="Defensive Bonus"
            scope="GK · CB · DEF · WB"
          >
            <RuleRow label="Clean sheet" value={POINTS.CLEAN_SHEET} />
            <RuleRow label="Only one goal allowed" value={POINTS.ONE_GOAL_ALLOWED} />
          </RuleCard>
        </div>
      </section>

      <section className="mt-12">
        <SectionTitle eyebrow="Drafted nations" title="Team Points" icon={<WhistleIcon size={24} />} />
        <div className="grid gap-4 md:grid-cols-3">
          <RuleCard
            icon={<WhistleIcon size={22} />}
            eyebrow="Match result"
            title="Result"
            scope="Each of your 6 teams"
          >
            <RuleRow label="Win" value={POINTS.TEAM_WIN} />
            <RuleRow label="Tie" value={POINTS.TEAM_TIE} />
          </RuleCard>
          <RuleCard
            icon={<ShieldIcon size={22} />}
            eyebrow="Defence"
            title="Shutout"
            scope="Each of your 6 teams"
          >
            <RuleRow label="Shutout (clean sheet)" value={POINTS.TEAM_SHUTOUT} />
          </RuleCard>
          <div className="panel flex flex-col justify-center gap-3 p-5">
            <p className="eyebrow">Good to know</p>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-turf-bright">▸</span>
                <span>
                  Shutouts <span className="text-chalk">stack</span> with the
                  result — a 2–0 win is{" "}
                  {signed(POINTS.TEAM_WIN + POINTS.TEAM_SHUTOUT)}.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-turf-bright">▸</span>
                <span>
                  Clean-sheet bonuses go to the keeper{" "}
                  <span className="text-chalk">and every defender</span> (CB, DEF,
                  WB).
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-turf-bright">▸</span>
                <span>
                  Only the GK takes the win bonus and the −2 per goal conceded.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 shrink-0 text-turf-bright">▸</span>
                <span>
                  A penalty save in open play is{" "}
                  {signed(POINTS.PK_SAVE)}, but a save in a{" "}
                  <span className="text-chalk">penalty shootout</span> is worth{" "}
                  {signed(POINTS.SHOOTOUT_SAVE)}.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
