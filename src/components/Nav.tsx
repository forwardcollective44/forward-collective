"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Staple" },
  { href: "/archives", label: "The Archives" },
  { href: "/collective", label: "The Collective" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className="fc-color text-[13px] font-extrabold uppercase tracking-[0.25em] text-text"
        >
          Forward Collective
        </Link>
        <div className="flex items-center gap-5 md:gap-8">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            const isArchives = link.href === "/archives";
            // The Archives link is always gold, regardless of active state.
            const color = isArchives
              ? "text-gold"
              : active
                ? "text-text"
                : "text-muted";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`fc-color fc-label ${color} hover:text-text`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
