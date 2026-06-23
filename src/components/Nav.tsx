"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagButton } from "@/components/cart/CartUI";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

// Each link has its own hover accent color. The bag lives separately as an
// icon + count button (it opens the slide-in drawer instead of navigating).
const LINKS = [
  { href: "/", label: "The Staples", hover: "hover:text-[#3B82F6]" },
  { href: "/archives", label: "Forward Archives", hover: "hover:text-[#F76707]" },
  { href: "/collective", label: "The Collective", hover: "hover:text-[#6741D9]" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const baseColor = (href: string) =>
    pathname === href ? "text-text" : "text-muted";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex items-center justify-between px-5 py-4 md:px-8">
        {/* Logo — home link, drawn as a color-able mask. */}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          aria-label="Forward Collective — Home"
          className="group inline-flex items-center"
        >
          <span
            aria-hidden="true"
            className="fc-color block bg-text group-hover:bg-[#E03131]"
            style={{
              height: "26px",
              width: "92px",
              WebkitMaskImage: "url(/logo.png)",
              maskImage: "url(/logo.png)",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "left center",
              maskPosition: "left center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
          <span className="sr-only">Forward Collective</span>
        </Link>

        {/* Desktop links + bag */}
        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cx("fc-color fc-label", baseColor(link.href), link.hover)}
            >
              {link.label}
            </Link>
          ))}
          <BagButton />
        </div>

        {/* Mobile: bag icon next to the menu toggle */}
        <div className="flex items-center gap-5 md:hidden">
          <BagButton />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="fc-color fc-label text-text"
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="flex flex-col md:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cx(
                "fc-color fc-label border-t border-border px-5 py-4",
                baseColor(link.href),
                link.hover
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
