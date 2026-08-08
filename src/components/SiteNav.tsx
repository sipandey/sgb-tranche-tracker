"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LearnButton } from "@/components/LearnPanel";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/positions", label: "My holdings" },
  { href: "/log", label: "Action log" },
  { href: "/settings", label: "Settings" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-deep)_82%,transparent)] backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-lg tracking-tight shrink-0">
          <span className="brand-glow">SGB Tracker</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 text-sm overflow-x-auto">
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-2 py-1 whitespace-nowrap transition-colors ${
                  active
                    ? "text-[var(--gold-bright)]"
                    : "muted hover:text-[var(--ink)]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <LearnButton />
        </nav>
      </div>
    </header>
  );
}
