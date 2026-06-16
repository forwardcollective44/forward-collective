"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import { unlockExclusiveDrop } from "@/lib/actions";
import type { Product } from "@/lib/types";

type Reveal = { name: string; products: Product[] };

/**
 * The members-only exclusive drop on Forward Archives.
 *
 *  - "gate"     password box. While the drop is coming soon the box shows but
 *               won't open; once it's live, the right code unlocks it.
 *  - "cutscene" full-bleed white scene: the drop name fades in, then the veil
 *               fades away to reveal the clothes underneath.
 *  - "open"     the drop's products, ready to buy.
 *
 * The drop name and products are returned by the server only after the code is
 * verified, so nothing leaks before the reveal. If the member already unlocked
 * (cookie), the page passes initialReveal and we skip straight to "open".
 */
export default function ExclusiveDrop({
  status,
  teaser,
  initialReveal,
}: {
  status: "coming_soon" | "live";
  teaser: string;
  initialReveal: Reveal | null;
}) {
  const [reveal, setReveal] = useState<Reveal | null>(initialReveal);
  const [phase, setPhase] = useState<"gate" | "cutscene" | "open">(
    initialReveal ? "open" : "gate"
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await unlockExclusiveDrop(password);
      if (res.ok && res.reveal) {
        setReveal(res.reveal);
        setPhase("cutscene");
        window.setTimeout(() => setPhase("open"), 3600);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const comingSoon = status !== "live";

  return (
    <section className="relative">
      <style>{`
        @keyframes fcCutName {
          0%   { opacity: 0; transform: translateY(10px); letter-spacing: .35em; }
          28%  { opacity: 1; transform: translateY(0);   letter-spacing: .12em; }
          72%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fcCutVeil {
          0%   { opacity: 1; }
          74%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fcReveal {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ---------- Open: the drop ---------- */}
      {phase !== "gate" && reveal && (
        <div style={{ animation: "fcReveal .7s ease-out both" }}>
          <p className="fc-label text-muted">The Drop &mdash; Members Only</p>
          <h2 className="fc-display mt-2 text-[clamp(28px,6vw,48px)] text-text">
            {reveal.name}
          </h2>
          {reveal.products.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-px bg-border md:grid-cols-3">
              {reveal.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="fc-body mt-4 text-muted">
              Pieces are being loaded in. Refresh shortly.
            </p>
          )}
        </div>
      )}

      {/* ---------- Cutscene: white veil over the drop ---------- */}
      {phase === "cutscene" && reveal && (
        <div
          onClick={() => setPhase("open")}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white px-6 text-center"
          style={{ animation: "fcCutVeil 3.6s ease-in-out both" }}
        >
          <span
            className="fc-display text-[clamp(32px,8vw,72px)] text-[#111]"
            style={{ animation: "fcCutName 3.6s ease-in-out both" }}
          >
            {reveal.name}
          </span>
        </div>
      )}

      {/* ---------- Gate: the password box ---------- */}
      {phase === "gate" && (
        <div>
          <p className="fc-label text-muted">The Drop &mdash; Members Only</p>
          <h2 className="fc-display mt-2 text-[clamp(28px,6vw,48px)] text-text">
            {comingSoon ? "Coming soon." : "Enter the code."}
          </h2>
          <p className="fc-body mt-3 max-w-xl text-text">
            {comingSoon
              ? teaser ||
                "The next exclusive collection is almost here. Watch your texts — your unlock code is on the way."
              : "You got the code from Forward. Drop it in to step inside."}
          </p>

          <form onSubmit={submit} className="mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="UNLOCK CODE"
              aria-label="Unlock code"
              className="w-full border border-border bg-surface px-4 py-3 fc-body text-text placeholder:text-muted focus:border-muted focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="fc-color fc-label whitespace-nowrap border border-gold bg-gold px-6 py-3 text-ink hover:bg-gold-light disabled:opacity-50"
            >
              {busy ? "Checking…" : "Unlock"}
            </button>
          </form>
          {error && <p className="fc-label mt-3 text-error">{error}</p>}
        </div>
      )}
    </section>
  );
}
