import { tournamentGroups } from "@/lib/groups";

/**
 * A "wall of nations" flanking the centered content. The 12 World Cup groups
 * are split into two edge-anchored columns — A–F down the left gutter, G–L down
 * the right — each rendered as a 2×2 pod, so all 48 flags appear exactly once:
 *
 *   A | content | G
 *   B | content | H
 *   …            …
 *   F | content | L
 *
 * Decorative; never interactive. Hidden on narrow screens where the gutters
 * disappear (see globals.css).
 */
export function FlagBackdrop() {
  const groups = tournamentGroups;
  if (groups.length === 0) return null;

  const columns = [groups.slice(0, 6), groups.slice(6, 12)]; // A–F | G–L

  return (
    <div className="flag-backdrop" aria-hidden>
      {columns.map((col, c) => (
        <div className="flag-col" key={c}>
          {col.map((codes, i) => (
            <div className="flag-pod" key={i}>
              {codes.map((code, j) => (
                <span key={j} className={`fi fi-${code}`} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
