// ──────────────────────────────────────────────────────────────────────────
//  Shared live / finished match status, used by both the fixtures board and the
//  knockout bracket so the "Live" indicator behaves identically on each.
// ──────────────────────────────────────────────────────────────────────────

export const isLive = (s?: string) => s === "IN_PLAY" || s === "PAUSED";
export const isDone = (s?: string) => s === "FINISHED";

// The upstream free-tier API reports IN_PLAY slowly and unreliably, so a
// genuinely live match can still read "TIMED" for a while. To surface the Live
// badge in real time we also infer it from the clock: a fixture counts as live
// from kickoff until a stage-dependent window later (groups ~130', knockouts
// ~180' to cover extra time + penalties) — unless the API has already said
// FINISHED/IN_PLAY, in which case we trust the API.
export const liveWindowMin = (stage: string) =>
  stage.startsWith("Group") ? 130 : 180;

export function isLiveNow(
  f: { status?: string; utcDate?: string | null; stage: string },
  now: number | null,
): boolean {
  if (isDone(f.status)) return false; // API says it's over — trust it
  if (isLive(f.status)) return true; // API says in-play — trust it
  if (now == null || !f.utcDate) return false; // pre-hydration / no kickoff time
  const kickoff = new Date(f.utcDate).getTime();
  return now >= kickoff && now < kickoff + liveWindowMin(f.stage) * 60_000;
}
