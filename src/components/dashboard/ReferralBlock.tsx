"use client";

import { useState } from "react";

export default function ReferralBlock({
  referralCode,
  totalReferrals,
  pointsFromReferrals,
}: {
  referralCode: string;
  totalReferrals: number;
  pointsFromReferrals: number;
}) {
  const [copied, setCopied] = useState(false);
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : `/?ref=${referralCode}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section className="space-y-4 border border-border bg-surface p-5">
      <h2 className="fc-label text-muted">Referrals</h2>
      <p className="fc-body text-text">Share your link. When they buy, you both earn.</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={link}
          className="w-full border border-border bg-bg px-4 py-3 fc-body text-muted"
        />
        <button
          onClick={copy}
          className="fc-color fc-label whitespace-nowrap border border-gold bg-gold px-6 py-3 text-bg hover:bg-gold-light"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex gap-8 pt-2">
        <div>
          <p className="fc-display text-[clamp(18px,3vw,24px)] text-text">{totalReferrals}</p>
          <p className="fc-label text-muted">Referrals</p>
        </div>
        <div>
          <p className="fc-display text-[clamp(18px,3vw,24px)] text-gold">{pointsFromReferrals}</p>
          <p className="fc-label text-muted">Pts Earned</p>
        </div>
      </div>
    </section>
  );
}
