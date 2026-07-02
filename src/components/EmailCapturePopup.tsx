"use client";

import { useEffect, useState } from "react";
import { subscribeLead } from "@/lib/subscribe";

// "Join The Collective" capture. Appears ~4s after landing, once per visitor
// (a dismissal or a successful join is remembered in localStorage). Submits to
// the shared subscribeLead action -> Klaviyo + Shopify. Brand-clean, white,
// gold accent; never blocks the page.

const SEEN_KEY = "fc_collective_popup_seen";
const DELAY_MS = 4000;

const inputCls =
  "w-full border border-border bg-surface px-4 py-3 fc-body text-text placeholder:text-muted focus:border-muted focus:outline-none";

export default function EmailCapturePopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(SEEN_KEY)) {
        t = setTimeout(() => setOpen(true), DELAY_MS);
      }
    } catch {
      /* localStorage blocked — just don't auto-open */
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  function remember() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function dismiss() {
    setOpen(false);
    remember();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await subscribeLead({ email, phone });
      if (res.ok) {
        setState("done");
        setMessage(res.message);
        remember();
      } else {
        setState("error");
        setMessage(res.message);
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
      {/* Backdrop */}
      <div
        onClick={dismiss}
        aria-hidden="true"
        className="absolute inset-0 bg-black/40"
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Join The Collective"
        className="relative w-full max-w-md border border-border bg-bg p-8 shadow-2xl"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="fc-color fc-label absolute right-4 top-4 text-muted hover:text-text"
        >
          Close
        </button>

        {state === "done" ? (
          <div className="py-6 text-center">
            <p className="fc-display text-[clamp(22px,4vw,30px)] leading-[1.05] text-text">
              You&apos;re in.
            </p>
            <p className="fc-body mt-3 text-muted">{message}</p>
            <button
              type="button"
              onClick={dismiss}
              className="fc-color fc-label mt-6 border border-gold bg-gold px-6 py-3 text-ink hover:bg-gold-light"
            >
              Keep Shopping
            </button>
          </div>
        ) : (
          <>
            <p className="fc-label text-gold">The Collective</p>
            <h2 className="fc-display mt-2 text-[clamp(24px,5vw,36px)] leading-[1.05] text-text">
              First access.
              <br />
              Every drop.
            </h2>
            <p className="fc-body mt-3 text-muted">
              Join for early access to drops and member rewards. Your account
              lives under your email — phone is optional, for drop texts and
              a signup bonus.
            </p>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL"
                aria-label="Email"
                className={inputCls}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="PHONE (OPTIONAL) — FOR DROP TEXTS"
                aria-label="Phone (optional)"
                className={inputCls}
              />
              <p className="fc-label text-gold">
                Add your phone for first alerts by text when new drops go live.
              </p>
              <button
                type="submit"
                disabled={state === "loading"}
                className="fc-color fc-label mt-1 border border-gold bg-gold px-6 py-3 text-ink hover:bg-gold-light disabled:opacity-50"
              >
                {state === "loading" ? "Joining…" : "Join The Collective"}
              </button>
              {state === "error" && (
                <p className="fc-label text-error">{message}</p>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="fc-color fc-label mt-1 text-muted hover:text-text"
              >
                No thanks
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
