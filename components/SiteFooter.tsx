import { leagueMeta } from "@/lib/league";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-center text-xs text-faint sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-display tracking-wide text-muted">
            {leagueMeta.name}
          </span>{" "}
          · {leagueMeta.season} fantasy tracker
        </p>
        <p>Scores update as matches are played. Built for the group chat.</p>
      </div>
    </footer>
  );
}
