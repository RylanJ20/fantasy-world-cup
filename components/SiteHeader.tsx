"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallIcon } from "./icons";
import { leagueMeta } from "@/lib/league";

const NAV = [
  { href: "/", label: "Standings" },
  { href: "/rules", label: "Scoring" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-line-strong bg-surface text-turf-bright transition-colors group-hover:text-turf">
            <BallIcon size={22} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg tracking-wide text-chalk">
              {leagueMeta.name}
            </span>
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-faint">
              {leagueMeta.season}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
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
