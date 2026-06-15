"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Each link has its own hover accent color.
const LINKS = [
  { href: "/", label: "The Staples", hover: "hover:text-[#3B82F6]" },
  { href: "/archives", label: "Kadima Archives", hover: "hover:text-[#F76707]" },
  { href: "/collective", label: "The Collective", hover: "hover:text-[#6741D9]" },
  { href: "/cart", label: "Bag", hover: "hover:text-text" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const baseColor = (href: string) =>
    pathname === href ? "text-text" : "text-muted";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        {/* Logo / brand — home, highlights red on hover */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="fc-color text-[12px] font-extrabold uppercase tracking-[0.2em] text-text hover:text-[#E03131] md:text-[13px] md:tracking-[0.25em]"
        >
          Forward Collective
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`fc-color fc-label ${baseColor(link.href)} ${link.hover}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="fc-color fc-label text-text md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="flex flex-col md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`fc-color fc-label border-t border-border px-5 py-4 ${baseColor(
                link.href
              )} ${link.hover}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
