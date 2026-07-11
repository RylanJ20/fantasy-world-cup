// ──────────────────────────────────────────────────────────────────────────
//  Which nations are OUT of the World Cup. Derived purely from the imported
//  fixtures (data/fixtures.json) so it stays correct as results come in:
//
//   • Knockout exit — the loser of any FINISHED knockout game is out, EXCEPT a
//     semi-final loser (those two still contest the third-place play-off).
//   • Group-stage exit — once the Round of 32 is drawn with real teams, any
//     nation that played the group stage but isn't in the R32 didn't advance.
//
//  Powers the "greyed out" treatment on eliminated players/teams and the
//  still-alive counters on the standings.
// ──────────────────────────────────────────────────────────────────────────

import { fixtures } from "./fixtures";
import { countryCode } from "./flags";

const KNOCKOUT_STAGES = new Set([
  "Round of 32",
  "Round of 16",
  "Quarter-final",
  "Semi-final",
  "Final",
  "Third place",
]);

function computeEliminated(): Set<string> {
  const out = new Set<string>();

  // Knockout exits: the losing side of a finished KO game is out. A semi-final
  // loss is NOT an exit — the beaten semi-finalists drop into the third-place
  // match and can still score there.
  for (const f of fixtures) {
    if (f.status !== "FINISHED" || f.stage === "Semi-final") continue;
    if (!KNOCKOUT_STAGES.has(f.stage)) continue;
    const loser =
      f.winner === "HOME_TEAM" ? f.away : f.winner === "AWAY_TEAM" ? f.home : null;
    const code = loser ? countryCode(loser) : null;
    if (code) out.add(code);
  }

  // Group-stage exits: the 32 nations that advanced are exactly those named in
  // the Round of 32. Wait until the R32 carries real teams (not placeholders)
  // so mid-group-stage nations aren't flagged prematurely.
  const r32 = fixtures.filter((f) => f.stage === "Round of 32");
  const drawn = r32.some((f) => countryCode(f.home) && countryCode(f.away));
  if (drawn) {
    const advanced = new Set<string>();
    for (const f of r32) {
      const h = countryCode(f.home);
      const a = countryCode(f.away);
      if (h) advanced.add(h);
      if (a) advanced.add(a);
    }
    for (const f of fixtures) {
      if (!f.stage.startsWith("Group")) continue;
      for (const name of [f.home, f.away]) {
        const c = countryCode(name);
        if (c && !advanced.has(c)) out.add(c);
      }
    }
  }

  return out;
}

/** Flag-icons codes of every nation knocked out of the tournament. */
export const eliminatedCodes: ReadonlySet<string> = computeEliminated();

/** True when a nation has been eliminated (no more matches to play). */
export function isEliminated(country: string): boolean {
  const c = countryCode(country);
  return c ? eliminatedCodes.has(c) : false;
}
