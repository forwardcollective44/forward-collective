"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeLead } from "@/lib/subscribe";
import { resolveSignInEmail } from "@/lib/actions";

/**
 * SMS-forward join / sign-in.
 * The account always lives under email — that's the only channel the magic
 * link goes out on. Phone is optional: it is your SMS list (pushed to
 * Klaviyo for texting drops and rewards) and unlocks a signup bonus, but
 * signing up only ever requires an email address.
 * On submit we stash the phone (if given) in a short-lived cookie so the
 * member record can save it, then send the magic link.
 * In sign-in mode, a single field accepts either an email or a phone number
 * — a phone number is resolved server-side to the matching account's email
 * before the magic link is sent, since email is still the only delivery
 * channel.
 */
export default function JoinForm({
  variant = "block",
  cta = "Join the Collective",
  mode = "join",
}: {
  variant?: "block" | "footer";
  cta?: string;
  /** "signin" = existing member, email or phone to look up the account. */
  mode?: "join" | "signin";
}) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // signin mode: email OR phone
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const signin = mode === "signin";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    try {
      const supabase = createClient();

      if (signin) {
        const resolvedEmail = await resolveSignInEmail(identifier);
        if (!resolvedEmail) {
          setState("error");
          setMessage(
            "We couldn't find an account with that email or phone. Try joining instead."
          );
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({
          email: resolvedEmail,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) {
          setState("error");
          setMessage(error.message);
        } else {
          setState("done");
          setMessage("Check your email for your sign-in link.");
        }
        return;
      }

      if (phone.trim()) {
        document.cookie = `fc_phone=${encodeURIComponent(
          phone.trim()
        )}; path=/; max-age=1800; samesite=lax`;
      }
      // Capture to Klaviyo + Shopify immediately, so a new lead is saved even
      // if they never click the magic link.
      subscribeLead({ email, phone }).catch(() => {});
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
        {signin ? "Check your email for your sign-in link." : message}
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
      {signin ? (
        <input
          type="text"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="EMAIL OR PHONE"
          aria-label="Email or phone"
          className={inputCls}
        />
      ) : (
        <>
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
            aria-label="Phone (optional)"
            className={inputCls}
          />
          <p className="fc-label text-gold">
            +25 bonus points and first alerts by text when new drops go live.          </p>
        </>
      )}
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
            : "Your account lives under your email. Texts are optional, for drops & rewards."}
        </p>
      )}
      {state === "error" && (
        <p className="fc-label text-error sm:basis-full">{message}</p>
      )}
    </form>
  );
}
