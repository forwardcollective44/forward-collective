import Link from "next/link";
import JoinForm from "./JoinForm";

const POLICIES = [
  { label: "Shipping", href: "/shipping-policy" },
  { label: "Returns", href: "/return-policy" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-of-service" },
];

/**
 * showJoin controls the opt-in strip. Pages that already have their own join /
 * sign-in form (The Collective, Forward Archives) pass showJoin={false} so the
 * page only ever shows one form. The Staples homepage keeps it (showJoin
 * defaults true).
 */
export default function Footer({ showJoin = true }: { showJoin?: boolean }) {
  return (
    <footer className="border-t border-border">
      {/* Opt-in strip */}
      {showJoin && (
        <div className="flex flex-col gap-5 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="fc-display text-[clamp(18px,3vw,28px)] text-text">
            Join The Collective.
            <br />
            Earn points on every order.
          </p>
          <JoinForm variant="footer" />
        </div>
      )}

      {/* Bottom bar: tagline, small policy links, copyright */}
      <div className="flex flex-col gap-4 border-t border-border px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <span className="fc-label text-muted">Keep Moving Forward</span>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {POLICIES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="fc-color fc-label text-muted hover:text-text"
            >
              {p.label}
            </Link>
          ))}
        </nav>

        <span className="fc-label text-muted">FC &mdash; 2026</span>
      </div>
    </footer>
  );
}
