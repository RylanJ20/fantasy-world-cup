import type { Metadata } from "next";
import { groups, hasGroups, draftedManagers, type GroupTable } from "@/lib/groups";
import { Flag } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Group Tables",
  description: "Real World Cup group standings, with drafted nations highlighted.",
};

function GroupCard({ g }: { g: GroupTable }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line px-4 py-2.5">
        <h3 className="font-display text-lg tracking-wide text-chalk">{g.group}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[0.62rem] font-bold uppercase tracking-wider text-faint">
            <th className="py-2 pl-4 text-left font-bold">Team</th>
            <th className="px-1 text-center font-bold">P</th>
            <th className="px-1 text-center font-bold">W</th>
            <th className="px-1 text-center font-bold">D</th>
            <th className="px-1 text-center font-bold">L</th>
            <th className="px-1 text-center font-bold">GD</th>
            <th className="px-2 text-center font-bold text-chalk">Pts</th>
          </tr>
        </thead>
        <tbody className="font-mono tnum">
          {g.table.map((r) => {
            const managers = draftedManagers(r.team);
            const drafted = managers.length > 0;
            return (
              <tr
                key={r.team}
                className={`border-t border-line/50 ${
                  drafted ? "bg-turf/8" : ""
                } ${r.position <= 2 ? "" : "text-muted"}`}
                title={drafted ? `Drafted by ${managers.join(", ")}` : undefined}
              >
                <td className="py-2 pl-4">
                  <span className="flex items-center gap-2">
                    <span className="w-4 text-right text-xs text-faint">{r.position}</span>
                    <Flag country={r.team} size={14} />
                    <span
                      className={`truncate font-sans font-semibold ${
                        drafted ? "text-turf-bright" : "text-chalk"
                      }`}
                    >
                      {r.team}
                    </span>
                  </span>
                </td>
                <td className="px-1 text-center text-muted">{r.played}</td>
                <td className="px-1 text-center text-muted">{r.won}</td>
                <td className="px-1 text-center text-muted">{r.draw}</td>
                <td className="px-1 text-center text-muted">{r.lost}</td>
                <td className="px-1 text-center text-muted">
                  {r.gd > 0 ? `+${r.gd}` : r.gd}
                </td>
                <td className="px-2 text-center font-bold text-chalk">{r.points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function GroupsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 sm:pt-12">
      <div className="max-w-2xl">
        <p className="eyebrow">Real World Cup</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-chalk sm:text-6xl">
          Group Tables
        </h1>
        <p className="mt-4 text-muted">
          The actual tournament standings. Nations someone drafted are{" "}
          <span className="font-semibold text-turf-bright">highlighted</span>.
        </p>
      </div>

      {hasGroups ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <GroupCard key={g.group} g={g} />
          ))}
        </div>
      ) : (
        <div className="panel mt-8 flex flex-col items-center gap-3 px-6 py-14 text-center">
          <ShieldIcon size={30} className="text-faint" />
          <p className="font-display text-xl tracking-wide text-muted">
            No group data yet
          </p>
          <p className="max-w-sm text-sm text-faint">
            Run{" "}
            <code className="rounded bg-bg-2 px-1.5 py-0.5 font-mono text-turf-bright">
              npm run import:groups
            </code>{" "}
            once group games begin to pull in the real tables.
          </p>
        </div>
      )}
    </div>
  );
}
