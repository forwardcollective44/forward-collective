// Forward Collective — rewards table and redemption helpers.
// No cap, no ceiling. There is always a next milestone above the user's balance.

export type RewardKind = "cash" | "free_item" | "early_access";

export interface Reward {
  points: number;
  description: string;
  kind: RewardKind;
  /** Dollar value for cash rewards. */
  value?: number;
}

export const REWARDS: Reward[] = [
  { points: 150, description: "$5 off your next order", kind: "cash", value: 5 },
  { points: 300, description: "$12 off your next order", kind: "cash", value: 12 },
  { points: 600, description: "$25 off your next order", kind: "cash", value: 25 },
  { points: 1000, description: "$40 off your next order", kind: "cash", value: 40 },
  { points: 1750, description: "$75 off your next order", kind: "cash", value: 75 },
  { points: 2500, description: "$100 off your next order", kind: "cash", value: 100 },
  {
    points: 4000,
    description: "Free item from Staple catalog (up to $100 value)",
    kind: "free_item",
  },
  {
    points: 6000,
    description: "Early access to every Forward Collective drop before it goes public",
    kind: "early_access",
  },
];

/** The next reward the user is working toward, or null if they own them all. */
export function nextMilestone(pointsTotal: number): Reward | null {
  return REWARDS.find((r) => r.points > pointsTotal) ?? null;
}

/** Points remaining until the next milestone, or null at the top. */
export function pointsAway(pointsTotal: number): number | null {
  const next = nextMilestone(pointsTotal);
  return next ? next.points - pointsTotal : null;
}

/**
 * Whether a given reward can be redeemed right now.
 * Early access is a permanent status: once unlocked it stays unlocked and is
 * never "spent", so it shows as unlocked rather than redeemable.
 */
export function isRedeemable(
  reward: Reward,
  pointsTotal: number,
  earlyAccessUnlocked: boolean
): boolean {
  if (reward.kind === "early_access") return false; // status, not a spend
  return pointsTotal >= reward.points;
}

/** UI state for a single reward card. */
export type RewardState = "redeemable" | "near" | "locked" | "unlocked_status";

export function rewardState(
  reward: Reward,
  pointsTotal: number,
  earlyAccessUnlocked: boolean
): RewardState {
  if (reward.kind === "early_access") {
    return earlyAccessUnlocked ? "unlocked_status" : "locked";
  }
  if (pointsTotal >= reward.points) return "redeemable";
  if (reward.points - pointsTotal <= 300) return "near";
  return "locked";
}
