// Forward Collective — shared types

export type PointEventType =
  | "purchase_base"
  | "order_size_bonus"
  | "quantity_bonus"
  | "recurring_bonus"
  | "streak_bonus"
  | "anniversary_bonus"
  | "referral_bonus"
  | "welcome_bonus"
  | "redemption";

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  points_total: number;
  collective_member: boolean;
  early_access: boolean;
  member_since: string | null;
  last_purchase_date: string | null;
  purchase_count: number;
  current_streak_months: number;
  longest_streak_months: number;
  lifetime_spend: number;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface PointEvent {
  id: string;
  user_id: string;
  order_id: string | null;
  type: PointEventType;
  description: string;
  points: number; // positive = earned, negative = redeemed
  created_at: string;
}

export interface Drop {
  id: string;
  name: string;
  season: string;
  status: string;
  early_access_date: string | null;
  public_release_date: string | null;
  image_url: string | null;
  created_at: string;
}

export type RedemptionStatus = "active" | "used" | "pending_fulfillment";

export interface Redemption {
  id: string;
  user_id: string;
  points_spent: number;
  reward_description: string;
  discount_code: string | null;
  status: RedemptionStatus;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  tag: "staple" | "archive" | "exclusive";
  active: boolean;
  handle?: string;
}
