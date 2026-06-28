import type { PlayerMatchScore } from "@/lib/scoring";
import { signed } from "./ui";
import { ChevronRight } from "./icons";

/** Collapsible per-match scoring log. Shared by PlayerCard and ReplacementCard. */
export function MatchLog({ perMatch }: { perMatch: PlayerMatchScore[] }) {
  if (perMatch.length === 0) return null;
  return (
    <details className="group mt-2">
      <summary className="flex items-center gap-1.5 py-1 text-xs font-bold uppercase tracking-wider text-muted hover:text-chalk">
        <ChevronRight size={14} className="chev" />
        Match log · {perMatch.length}
      </summary>
      <ul className="mt-2 space-y-2">
        {perMatch.map((m, i) => (
          <li
            key={i}
            className="rounded-lg border border-line/60 bg-bg-2/50 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-chalk">
                {m.match.opponent}
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  m.points < 0 ? "text-red" : "text-turf-bright"
                }`}
              >
                {signed(m.points)}
              </span>
            </div>
            {m.lines.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-faint">
                {m.lines.map((l, j) => (
                  <span key={j}>
                    {l.label}{" "}
                    <span
                      className={`font-mono ${l.tone === "bad" ? "text-red" : "text-turf"}`}
                    >
                      {signed(l.points)}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
