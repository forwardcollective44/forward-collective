"use client";

import { useState } from "react";

/**
 * Email + phone capture. On submit it posts to /api/join, which creates the
 * Supabase user, credits +50, and triggers the Klaviyo welcome flow.
 * `variant="footer"` renders the compact inline version used in page footers.
 */
export default function JoinForm({
  variant = "block",
  cta = "Join the Collective",
}: {
  variant?: "block" | "footer";
  cta?: string;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        setState("done");
        setMessage(data.message ?? "You're in the Collective.");
      } else {
        setState("error");
        setMessage(data.message ?? "Something went wrong.");
      }
    } catch {
      setState("error");
      setMessage("Network error.");
    }
  }

  if (state === "done") {
    return (
      <p className="fc-label text-gold" role="status">
        {message || "You're in. 50 points just dropped."}
      </p>
    );
  }

  const inputCls =
    "w-full border border-border bg-surface px-4 py-3 fc-body text-text placeholder:text-muted focus:border-muted focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className={variant === "footer" ? "flex w-full max-w-md flex-col gap-2 sm:flex-row" : "flex w-full max-w-md flex-col gap-2"}
    >
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
        placeholder="PHONE (OPTIONAL)"
        aria-label="Phone"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="fc-color fc-label whitespace-nowrap border border-gold bg-gold px-6 py-3 text-bg hover:bg-gold-light disabled:opacity-50"
      >
        {state === "loading" ? "Joining…" : cta}
      </button>
      {state === "error" && (
        <p className="fc-label text-error sm:basis-full">{message}</p>
      )}
    </form>
  );
}
