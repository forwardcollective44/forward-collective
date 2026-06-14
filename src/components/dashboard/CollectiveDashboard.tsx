"use client";

import { useState } from "react";
import type { User, PointEvent } from "@/lib/types";
import { nextMilestone, pointsAway, type Reward } from "@/lib/rewards";
import RewardsStrip from "./RewardsStrip";
import StreakTracker from "./StreakTracker";
import PointsHistory from "./PointsHistory";
import ReferralBlock from "./ReferralBlock";

export default function CollectiveDashboard({
  user,
  events,
}: {
  user: User;
  events: PointEvent[];
}) {
  const [points, setPoints] = useState(user.points_total);
  const [notice, setNotice] = useState<string | null>(null);

  const next = nextMilestone(points);
  const away = pointsAway(points);

  const referralPoints = events
    .filter((e) => e.type === "referral_bonus" && e.points > 0)
    .reduce((s, e) => s + e.points, 0);

  async function handleRedeem(reward: Reward) {
    // Optimistic; replace with a call to the redeemReward server action.
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
    <div className="mx-auto max-w-5xl space-y-10 px-5 py-12 md:px-8">
      {/* Points balance */}
      <header className="flex flex-col gap-4 border-b border-border pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fc-label text-muted">Points Balance</p>
          <p className="fc-display text-[clamp(48px,12vw,80px)] text-text">
            {points.toLocaleString()}
          </p>
          <p className="fc-body text-muted">Member since {memberSince}</p>
        </div>
        <div className="text-left md:text-right">
          <p className={`fc-display text-[clamp(16px,3vw,22px)] ${user.current_streak_months >= 2 ? "text-gold" : "text-muted"}`}>
            {user.current_streak_months}-Month Streak
          </p>
          {next && away !== null && (
            <p className="fc-body text-muted">
              {away.toLocaleString()} pts to {next.description}
            </p>
          )}
        </div>
      </header>

      {notice && (
        <p className="fc-label border border-gold bg-surface px-4 py-3 text-gold">{notice}</p>
      )}

      <RewardsStrip
        pointsTotal={points}
        earlyAccessUnlocked={user.early_access}
        onRedeem={handleRedeem}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <StreakTracker user={{ ...user, points_total: points }} />
        <ReferralBlock
          referralCode={user.referral_code ?? ""}
          totalReferrals={events.filter((e) => e.type === "referral_bonus" && e.points === 200).length}
          pointsFromReferrals={referralPoints}
        />
      </div>

      <PointsHistory events={events} />
    </div>
  );
}
