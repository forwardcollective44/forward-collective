"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Email capture that joins / signs in to The Collective.
 * Submitting sends a Supabase magic link to the email. Clicking that link
 * lands on /auth/callback, which creates the member (+50 welcome points on
 * first sign-in) and opens The Collective.
 *
 * Phone is captured for the brand's SMS list but auth is email-only for now
 * (SMS OTP needs an SMS provider configured in Supabase).
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
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setState("error");
        setMessage(error.message);
      } else {
        setState("done");
        setMessage("Check your email — tap the link to enter the Collective.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="fc-label text-gold" role="status">
        {message}
      </p>
    );
  }

  const inputCls =
    "w-full border border-border bg-surface px-4 py-3 fc-body text-text placeholder:text-muted focus:border-muted focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className={
        variant === "footer"
          ? "flex w-full max-w-md flex-col gap-2 sm:flex-row"
          : "flex w-full max-w-md flex-col gap-2"
      }
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
        {state === "loading" ? "Sending…" : cta}
      </button>
      {state === "error" && (
        <p className="fc-label text-error sm:basis-full">{message}</p>
      )}
    </form>
  );
}
