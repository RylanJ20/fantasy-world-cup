import { leagueMeta } from "@/lib/league";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-center text-xs text-faint sm:flex-row sm:px-6 sm:text-left">
        <p>
          <span className="font-display tracking-wide text-muted">
            {leagueMeta.name}
          </span>{" "}
          · fantasy tracker
        </p>
        <p>Scores update as matches are played. Marc is cute.</p>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-7 text-center text-[0.65rem] text-faint/70 sm:px-6 sm:text-left">
        Trophy photo by{" "}
        <a
          href="https://commons.wikimedia.org/wiki/File:FIFA_World_Cup_Trophy_photo_by_Djuradj_Vujcic.jpg"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-muted"
        >
          Djuradj Vujcic
        </a>
        ,{" "}
        <a
          href="https://creativecommons.org/licenses/by/2.0/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-muted"
        >
          CC BY 2.0
        </a>{" "}
        (cropped).
      </div>
    </footer>
  );
}
