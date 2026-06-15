"use client";

import { useState } from "react";
import type { User, PointEvent } from "@/lib/types";
import {
  nextMilestone,
  pointsAway,
  tierFromLifetime,
  tierColor,
  nextTier,
  type Reward,
} from "@/lib/rewards";
import PointsLine from "@/components/PointsLine";
import RewardsStrip from "./RewardsStrip";
import StreakTracker from "./StreakTracker";
import PointsHistory from "./PointsHistory";
import ReferralBlock from "./ReferralBlock";

const TIER_LINE: Record<string, string> = {
  Bronze: "You're in. Keep moving forward.",
  Silver: "Picking up speed — the system's rewarding you.",
  Gold: "Running with the Collective now.",
  Platinum: "Permanent standing. Every drop, early. Always.",
};

export default function CollectiveDashboard({
  user,
  events,
}: {
  user: User;
  events: PointEvent[];
}) {
  const [points, setPoints] = useState(user.points_total);
  const [notice, setNotice] = useState<string | null>(null);

  const name =
    user.name?.split(" ")[0] || user.email?.split("@")[0] || "Member";

  // Lifetime earned = every positive event. Drives the permanent tier.
  const lifetimeEarned = events
    .filter((e) => e.points > 0)
    .reduce((s, e) => s + e.points, 0);
  const tier = tierFromLifetime(lifetimeEarned);
  const upTier = nextTier(lifetimeEarned);

  const next = nextMilestone(points);
  const away = pointsAway(points);

  const referralPoints = events
    .filter((e) => e.type === "referral_bonus" && e.points > 0)
    .reduce((s, e) => s + e.points, 0);

  async function handleRedeem(reward: Reward) {
    if (reward.kind === "early_access") return;
    setNotice(`Redeeming "${reward.description}"…`);
    setPoints((p) => p - reward.points);
    setNotice(`Redeemed "${reward.description}". Check your email for the code.`);
  }

  const memberSince = user.member_since
    ? new Date(user.member_since).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-5 py-12 md:px-8">
      {/* Personalized welcome */}
      <header className="border-b border-border pb-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="fc-display text-[clamp(32px,7vw,64px)] text-text">
              Welcome, {name}.
            </p>
            <p className="fc-body mt-2 text-muted">{TIER_LINE[tier]}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="fc-label px-4 py-2 text-[#FFFFFF]"
              style={{ backgroundColor: tierColor(tier) }}
            >
              {tier} Collective
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="fc-color fc-label text-muted hover:text-text">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Balance + the animated points line */}
        <div className="mt-10">
          <p className="fc-label text-muted">Points Balance</p>
          <p className="fc-display text-[clamp(40px,11vw,72px)] text-text">
            {points.toLocaleString()}
          </p>
          <p className="fc-body text-muted">Member since {memberSince}</p>
        </div>

        <div className="mt-8">
          <PointsLine current={points} />
        </div>

        <p className="fc-label mt-4 text-muted">
          {upTier
            ? `${upTier.toGo.toLocaleString()} more lifetime points to ${upTier.tier}.`
            : "Platinum — permanent. Spend freely; your standing stays."}
          {next && away !== null && (
            <span className="text-gold">
              {"  ·  "}
              {away.toLocaleString()} pts to {next.description}
            </span>
          )}
        </p>
      </header>

      {notice && (
        <p className="fc-label border border-gold bg-surface px-4 py-3 text-gold">{notice}</p>
      )}

      <RewardsStrip
        pointsTotal={points}
        earlyAccessUnlocked={user.early_access || tier === "Platinum"}
        onRedeem={handleRedeem}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <StreakTracker user={{ ...user, points_total: points }} />
        <ReferralBlock
          referralCode={user.referral_code ?? ""}
          totalReferrals={
            events.filter((e) => e.type === "referral_bonus" && e.points === 200).length
          }
          pointsFromReferrals={referralPoints}
        />
      </div>

      <PointsHistory events={events} />
    </div>
  );
}
