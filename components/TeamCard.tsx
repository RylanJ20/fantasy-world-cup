import type { TeamScore } from "@/lib/scoring";
import { isEliminated } from "@/lib/elimination";
import { EliminatedBadge, Flag, Pts, RecordBadges, ScoreLines, signed } from "./ui";
import { ChevronRight } from "./icons";

function resultTone(r: "W" | "D" | "L"): string {
  return r === "W" ? "text-turf-bright" : r === "D" ? "text-muted" : "text-red";
}

export function TeamCard({ ts }: { ts: TeamScore }) {
  const { team, record } = ts;
  const out = isEliminated(team.country);

  return (
    <article className={`panel p-4 ${out ? "is-out" : ""}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Flag country={team.country} size={30} className="mt-1" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl leading-tight tracking-wide text-chalk">
                {team.country}
              </h3>
              {out && <EliminatedBadge />}
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <RecordBadges w={record.w} d={record.d} l={record.l} />
            </div>
          </div>
        </div>
        <div className="text-right">
          <Pts value={ts.total} className="text-3xl font-bold text-turf-bright" />
          <p className="text-[0.6rem] font-bold uppercase tracking-widest text-faint">
            pts
          </p>
        </div>
      </header>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-line/60 bg-bg-2/50 px-3 py-2 text-xs">
        <span className="text-faint">
          GF <span className="font-mono font-bold text-chalk">{record.gf}</span>
          {"  ·  "}
          GA <span className="font-mono font-bold text-chalk">{record.ga}</span>
        </span>
        <span className="text-faint">
          Shutouts{" "}
          <span className="font-mono font-bold text-turf-bright">{record.shutouts}</span>
        </span>
      </div>

      <div className="mt-3 border-t border-line/60 pt-3">
        <ScoreLines lines={ts.lines} />
      </div>

      {ts.perMatch.length > 0 && (
        <details className="group mt-2">
          <summary className="flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-wider text-muted hover:text-chalk">
            <ChevronRight size={14} className="chev" />
            Results · {ts.perMatch.length}
          </summary>
          <ul className="mt-2 space-y-2">
            {ts.perMatch.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-line/60 bg-bg-2/50 px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`font-mono font-bold ${resultTone(m.match.result)}`}>
                    {m.match.result}
                  </span>
                  <span className="text-chalk">{m.match.opponent}</span>
                  <span className="font-mono text-xs text-faint">
                    {m.match.goalsFor}–{m.match.goalsAgainst}
                  </span>
                </span>
                <span className="font-mono text-sm font-bold text-turf-bright">
                  {signed(m.points)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
