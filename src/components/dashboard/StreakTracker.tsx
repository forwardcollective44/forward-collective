import type { User } from "@/lib/types";

function purchasedThisMonth(lastPurchase: string | null): boolean {
  if (!lastPurchase) return false;
  const d = new Date(lastPurchase);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function nextAnniversary(memberSince: string | null): Date | null {
  if (!memberSince) return null;
  const start = new Date(memberSince);
  const now = new Date();
  const next = new Date(start);
  next.setFullYear(now.getFullYear());
  if (next < now) next.setFullYear(now.getFullYear() + 1);
  return next;
}

export default function StreakTracker({ user }: { user: User }) {
  const streak = user.current_streak_months;
  const boughtThisMonth = purchasedThisMonth(user.last_purchase_date);
  const anniversary = nextAnniversary(user.member_since);

  // Next streak bonus the user is building toward.
  const nextStreakBonus =
    streak < 3 ? { at: 3, pts: 100 } : streak < 6 ? { at: 6, pts: 200 } : streak < 12 ? { at: 12, pts: 500 } : { at: streak + 1, pts: 100 };

  return (
    <section className="space-y-4 border border-border bg-surface p-5">
      <h2 className="fc-label text-muted">Streak & Milestones</h2>

      <p className={`fc-display text-[clamp(20px,4vw,32px)] ${streak >= 2 ? "text-gold" : "text-muted"}`}>
        {streak}-Month Streak
      </p>

      {streak >= 1 && !boughtThisMonth && (
        <p className="fc-body text-text">
          Purchase this month to keep your {streak}-month streak.{" "}
          <span className="text-gold">+{nextStreakBonus.pts} bonus pts</span> if you do.
        </p>
      )}

      {boughtThisMonth && (
        <p className="fc-body text-text">
          You&apos;ve purchased this month. Streak secured. Next milestone:{" "}
          <span className="text-gold">
            {nextStreakBonus.at} months (+{nextStreakBonus.pts} pts)
          </span>
          .
        </p>
      )}

      {anniversary && (
        <p className="fc-body text-muted">
          Next anniversary: {anniversary.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} —{" "}
          <span className="text-gold">+150 pts</span>
        </p>
      )}
    </section>
  );
}
