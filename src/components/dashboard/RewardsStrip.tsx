"use client";

import { REWARDS, rewardState, type Reward } from "@/lib/rewards";

// Horizontal scrollable row of reward cards. Always shows the next milestone.
export default function RewardsStrip({
  pointsTotal,
  earlyAccessUnlocked,
  onRedeem,
}: {
  pointsTotal: number;
  earlyAccessUnlocked: boolean;
  onRedeem?: (reward: Reward) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="fc-label text-muted">Rewards</h2>
      <div className="flex gap-px overflow-x-auto bg-border pb-px">
        {REWARDS.map((reward) => {
          const state = rewardState(reward, pointsTotal, earlyAccessUnlocked);
          const away = reward.points - pointsTotal;
          const pct = Math.min(100, Math.round((pointsTotal / reward.points) * 100));

          return (
            <div
              key={reward.points}
              className={`flex min-w-[200px] flex-col justify-between gap-4 bg-surface p-4 ${
                state === "locked" ? "opacity-40" : "opacity-100"
              }`}
            >
              <div className="space-y-2">
                <p className="fc-label text-gold">{reward.points.toLocaleString()} pts</p>
                <p className="fc-body text-text">{reward.description}</p>
              </div>

              {state === "redeemable" && (
                <button
                  onClick={() => onRedeem?.(reward)}
                  className="fc-color fc-label border border-gold bg-gold px-4 py-2 text-bg hover:bg-gold-light"
                >
                  Redeem
                </button>
              )}

              {state === "near" && (
                <div className="space-y-2">
                  <p className="fc-label text-text">{away} pts away</p>
                  <div className="h-px w-full bg-border">
                    <div className="h-px bg-gold" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {state === "locked" && <p className="fc-label text-muted">Locked</p>}

              {state === "unlocked_status" && (
                <p className="fc-label text-gold">Unlocked — permanent</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
