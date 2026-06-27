"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeLead } from "@/lib/subscribe";

/**
 * SMS-forward join / sign-in.
 * Phone leads (it's your SMS list — pushed to Klaviyo for texting drops and
 * rewards). Email carries the secure passwordless sign-in link. On submit we
 * stash the phone in a short-lived cookie so the member record can save it,
 * then send the magic link.
 */
export default function JoinForm({
  variant = "block",
  cta = "Join the Collective",
  mode = "join",
}: {
  variant?: "block" | "footer";
  cta?: string;
  /** "signin" = existing member, email only (no phone capture). */
  mode?: "join" | "signin";
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      if (phone.trim()) {
        document.cookie = `fc_phone=${encodeURIComponent(
          phone.trim()
        )}; path=/; max-age=1800; samesite=lax`;
      }
      // Capture to Klaviyo + Shopify immediately, so a new lead is saved even
      // if they never click the magic link. (Skip for existing-member sign-in.)
      if (mode !== "signin") {
        subscribeLead({ email, phone }).catch(() => {});
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setState("error");
        setMessage(error.message);
      } else {
        setState("done");
        setMessage("Check your email for your sign-in link. Texts to follow.");
      }
    } catch {
      setState("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="fc-label text-gold" role="status">
        {mode === "signin"
          ? "Check your email for your sign-in link."
          : message}
      </p>
    );
  }

  const signin = mode === "signin";

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
      {!signin && (
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="PHONE"
          aria-label="Phone"
          className={inputCls}
        />
      )}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="EMAIL"
        aria-label="Email"
        className={inputCls}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="fc-color fc-label whitespace-nowrap border border-gold bg-gold px-6 py-3 text-ink hover:bg-gold-light disabled:opacity-50"
      >
        {state === "loading" ? "Sending…" : cta}
      </button>
      {variant !== "footer" && (
        <p className="fc-label text-muted">
          {signin
            ? "We'll email you a secure sign-in link. No password needed."
            : "Texts for drops & rewards. Email is just your secure sign-in."}
        </p>
      )}
      {state === "error" && (
        <p className="fc-label text-error sm:basis-full">{message}</p>
      )}
    </form>
  );
}
