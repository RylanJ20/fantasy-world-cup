"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallIcon } from "./icons";
import { leagueMeta } from "@/lib/league";

const NAV = [
  { href: "/", label: "Standings" },
  { href: "/leaderboards", label: "Leaders" },
  { href: "/rules", label: "Scoring" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-line-strong bg-surface text-turf-bright transition-colors group-hover:text-turf">
            <BallIcon size={22} />
          </span>
          <span className="font-display text-base leading-none tracking-wide text-chalk sm:text-lg">
            {leagueMeta.name}
          </span>
        </Link>

        <nav className="-mr-2 flex items-center gap-0.5 overflow-x-auto pr-2 sm:gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold transition-colors sm:px-3 ${
                  active
                    ? "bg-turf/12 text-turf-bright"
                    : "text-muted hover:bg-surface-2 hover:text-chalk"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
