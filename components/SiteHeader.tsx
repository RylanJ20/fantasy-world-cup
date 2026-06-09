"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallIcon, MenuIcon, XIcon } from "./icons";
import { leagueMeta } from "@/lib/league";

const NAV = [
  { href: "/", label: "Standings" },
  { href: "/leaderboards", label: "Leaders" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/rules", label: "Scoring" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="group flex shrink-0 items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-line-strong bg-surface text-turf-bright transition-colors group-hover:text-turf">
            <BallIcon size={22} />
          </span>
          <span className="font-display text-base leading-none tracking-wide text-chalk sm:text-lg">
            {leagueMeta.name}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-chalk transition-colors hover:bg-surface-2 sm:hidden"
        >
          {open ? <XIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-line bg-bg/95 backdrop-blur-xl sm:hidden"
        >
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-lg px-3 py-3 text-base font-bold transition-colors ${
                    active
                      ? "bg-turf/12 text-turf-bright"
                      : "text-muted hover:bg-surface-2 hover:text-chalk"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
