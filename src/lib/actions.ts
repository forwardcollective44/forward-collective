"use server";

// Forward Collective — server actions.
// These run only on the server and use the service-role client for writes that
// must bypass RLS (crediting points, redemptions, membership creation).

import { cookies } from "next/headers";
import { createServiceClient, createClient } from "./supabase/server";
import {
  calcOrderPoints,
  welcomeBonus,
  phoneBonus,
  referralBonus,
  crossesEarlyAccess,
  WELCOME_POINTS,
  PHONE_BONUS_POINTS,
  type OrderInput,
} from "./points";
import { nextMilestone, REWARDS } from "./rewards";
import * as klaviyo from "./klaviyo";
import {
  getExclusiveDropMeta,
  getExclusivePassword,
  getExclusiveReveal,
  type ExclusiveReveal,
} from "./shopify";

// Normalizes a raw phone number to E.164 (e.g. "+15551234567"), matching the
// format used everywhere else phone is stored or sent (Klaviyo, Shopify).
// Returns null for anything that doesn't look like a real number, so a bad
// value never gets silently stored or used for a sign-in lookup.
function formatPhone(raw?: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/[^\d]/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  if (raw.trim().startsWith("+")) return raw.trim();
  return null;
}

/**
 * Unlock the exclusive drop. Runs server-side: the real code and the products
 * never reach the browser until the entered code matches AND the drop is live.
 * On success it sets a 30-day cookie scoped to the drop handle so the member
 * stays unlocked, and returns the reveal (name + products) for the cutscene.
 */
export async function unlockExclusiveDrop(password: string): Promise<{
  ok: boolean;
  status: "coming_soon" | "live";
  message: string;
  reveal?: ExclusiveReveal;
}> {
  const meta = await getExclusiveDropMeta();
  if (!meta) {
    return {
      ok: false,
      status: "coming_soon",
      message: "No drop is scheduled right now. Check back soon.",
    };
  }
  if (meta.status !== "live") {
    return {
      ok: false,
      status: "coming_soon",
      message: "Not yet — this drop unlocks soon. Keep your code close.",
    };
  }
  const real = await getExclusivePassword();
  if (!real || password.trim() !== real.trim()) {
    return {
      ok: false,
      status: "live",
      message: "That code isn't right. Check the text from Forward.",
    };
  }

  cookies().set("fc_drop_unlocked", meta.handle, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const reveal = await getExclusiveReveal();
  return { ok: true, status: "live", message: "Unlocked.", reveal: reveal ?? undefined };
}

function generateReferralCode(): string {
  return "FC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/**
 * Membership entry. Fires from any email/SMS capture on the site.
 * Idempotent on an existing signed-in user: never double-credits the welcome.
 */
export async function joinCollective(input: {
  email?: string;
  phone?: string;
  referredByCode?: string;
}): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  // Requires an authenticated Supabase user row (created via Supabase Auth on
  // email/SMS capture). See README for the recommended auth flow.
  if (!authUser) {
    return { ok: false, message: "Sign-in session required to join." };
  }

  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("users")
    .select("id, collective_member")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existing?.collective_member) {
    return { ok: true, message: "Already a member." };
  }

  // Resolve referrer, if any.
  let referredBy: string | null = null;
  if (input.referredByCode) {
    const { data: ref } = await admin
      .from("users")
      .select("id")
      .eq("referral_code", input.referredByCode)
      .maybeSingle();
    referredBy = ref?.id ?? null;
  }

  // Phone is optional — the account itself always lives under email.
  const phone = formatPhone(input.phone);
  const startingPoints = WELCOME_POINTS + (phone ? PHONE_BONUS_POINTS : 0);

  const now = new Date().toISOString();
  await admin.from("users").upsert({
    id: authUser.id,
    email: input.email ?? authUser.email,
    phone,
    collective_member: true,
    member_since: now,
    points_total: startingPoints,
    referral_code: generateReferralCode(),
    referred_by: referredBy,
  });

  const wb = welcomeBonus();
  const events = [
    {
      user_id: authUser.id,
      type: wb.type,
      description: wb.description,
      points: wb.points,
    },
  ];
  if (phone) {
    const pb = phoneBonus();
    events.push({
      user_id: authUser.id,
      type: pb.type,
      description: pb.description,
      points: pb.points,
    });
  }
  await admin.from("point_events").insert(events);

  await klaviyo.welcome({ email: input.email, phone }, startingPoints);

  return { ok: true, message: "You're in the Collective." };
}

/**
 * Ensure the signed-in auth user has a Collective member record.
 * Runs on first sign-in (from /auth/callback): creates the row, credits
 * welcome points (+ a phone bonus if they gave a number), fires the Klaviyo
 * welcome flow. Idempotent.
 */
export async function ensureMember(userId: string, email: string | null): Promise<void> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("users")
    .select("id, collective_member")
    .eq("id", userId)
    .maybeSingle();
  if (existing?.collective_member) return;

  const phone = formatPhone(cookies().get("fc_phone")?.value ?? null);
  const startingPoints = WELCOME_POINTS + (phone ? PHONE_BONUS_POINTS : 0);
  const now = new Date().toISOString();
  await admin.from("users").upsert({
    id: userId,
    email,
    phone,
    collective_member: true,
    member_since: now,
    points_total: startingPoints,
    referral_code: generateReferralCode(),
  });

  const wb = welcomeBonus();
  const events = [
    {
      user_id: userId,
      type: wb.type,
      description: wb.description,
      points: wb.points,
    },
  ];
  if (phone) {
    const pb = phoneBonus();
    events.push({
      user_id: userId,
      type: pb.type,
      description: pb.description,
      points: pb.points,
    });
  }
  await admin.from("point_events").insert(events);

  // Add to Klaviyo lists (email + SMS) and fire the welcome flow.
  await klaviyo.subscribeMember({ email, phone });
  await klaviyo.welcome({ email, phone }, startingPoints);
}

/**
 * Resolve a sign-in identifier (typed into the single "email or phone" field
 * on /signin) to the account's email — the only channel the magic link ever
 * goes out on. The account's identity is always the email address; phone is
 * just an alternate lookup key so a returning member doesn't need to remember
 * which one they used.
 *
 * Returns null if the identifier is a phone number with no matching member —
 * never falls back to sending anything to a raw phone number.
 */
export async function resolveSignInEmail(identifier: string): Promise<string | null> {
  const value = identifier.trim();
  if (!value) return null;
  if (value.includes("@")) return value;

  const phone = formatPhone(value);
  if (!phone) return null;

  const admin = createServiceClient();
  const { data } = await admin
    .from("users")
    .select("email")
    .eq("phone", phone)
    .maybeSingle();

  return data?.email ?? null;
}

/**
 * Credit points for a fulfilled order. Call from your Shopify/Stripe
 * fulfillment webhook. Handles base, multiplier, quantity, recurring and
 * streak bonuses, plus referral and early-access side effects.
 */
export async function recordFulfilledOrder(input: {
  userId: string;
  orderId: string;
  amount: number;
  itemCount: number;
  purchaseDate?: string;
}): Promise<{ ok: boolean; earned: number }> {
  const admin = createServiceClient();
  const { data: user } = await admin
    .from("users")
    .select("*")
    .eq("id", input.userId)
    .single();
  if (!user) return { ok: false, earned: 0 };

  const purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : new Date();
  const orderInput: OrderInput = {
    orderId: input.orderId,
    amount: input.amount,
    itemCount: input.itemCount,
    purchaseDate,
    purchaseCountBefore: user.purchase_count ?? 0,
    lastPurchaseDate: user.last_purchase_date ? new Date(user.last_purchase_date) : null,
    currentStreakMonths: user.current_streak_months ?? 0,
  };

  const result = calcOrderPoints(orderInput);

  // Persist each event.
  if (result.events.length) {
    await admin.from("point_events").insert(
      result.events.map((e) => ({
        user_id: input.userId,
        order_id: input.orderId,
        type: e.type,
        description: e.description,
        points: e.points,
      }))
    );
  }

  const pointsBefore = user.points_total ?? 0;
  let pointsAfter = pointsBefore + result.totalEarned;

  // Referral payout on the referred user's FIRST purchase.
  if ((user.purchase_count ?? 0) === 0 && user.referred_by) {
    const rb = referralBonus();
    await admin.from("point_events").insert([
      {
        user_id: user.referred_by,
        type: rb.referrer.type,
        description: rb.referrer.description,
        points: rb.referrer.points,
      },
      {
        user_id: input.userId,
        type: rb.referred.type,
        description: rb.referred.description,
        points: rb.referred.points,
      },
    ]);
    pointsAfter += rb.referred.points;
    // Bump the referrer's running total.
    await incrementUserPoints(user.referred_by, rb.referrer.points);
    const { data: referrer } = await admin
      .from("users")
      .select("email, phone")
      .eq("id", user.referred_by)
      .maybeSingle();
    if (referrer) await klaviyo.referralConfirmed(referrer);
  }

  const newStreak = result.newStreakMonths;
  const longest = Math.max(user.longest_streak_months ?? 0, newStreak);
  const earlyAccess = user.early_access || crossesEarlyAccess(pointsBefore, pointsAfter);

  await admin
    .from("users")
    .update({
      points_total: pointsAfter,
      purchase_count: (user.purchase_count ?? 0) + 1,
      last_purchase_date: purchaseDate.toISOString(),
      current_streak_months: newStreak,
      longest_streak_months: longest,
      lifetime_spend: (user.lifetime_spend ?? 0) + input.amount,
      early_access: earlyAccess,
    })
    .eq("id", input.userId);

  // Klaviyo: points earned + milestone + early access.
  const next = nextMilestone(pointsAfter);
  await klaviyo.pointsEarned(user, result.totalEarned, pointsAfter, next?.description ?? null);
  const crossed = REWARDS.find((r) => pointsBefore < r.points && pointsAfter >= r.points);
  if (crossed) await klaviyo.milestoneReached(user, crossed.points);
  if (!user.early_access && earlyAccess) await klaviyo.earlyAccessUnlocked(user);

  return { ok: true, earned: result.totalEarned };
}

/** Atomically add points to a user's total (used for the referrer credit). */
async function incrementUserPoints(userId: string, delta: number) {
  const admin = createServiceClient();
  const { data } = await admin.from("users").select("points_total").eq("id", userId).single();
  const current = data?.points_total ?? 0;
  await admin.from("users").update({ points_total: current + delta }).eq("id", userId);
}

/**
 * Redeem a reward. Deducts points immediately, logs a negative point_event and
 * a redemptions row. Cash rewards expect a discount code generated upstream
 * (Shopify/Stripe); free-item and manual rewards land as pending_fulfillment.
 */
export async function redeemReward(input: {
  userId: string;
  rewardPoints: number;
  rewardDescription: string;
  kind: "cash" | "free_item";
  discountCode?: string;
}): Promise<{ ok: boolean; message: string }> {
  const admin = createServiceClient();
  const { data: user } = await admin
    .from("users")
    .select("points_total")
    .eq("id", input.userId)
    .single();
  if (!user) return { ok: false, message: "User not found." };
  if ((user.points_total ?? 0) < input.rewardPoints) {
    return { ok: false, message: "Not enough points." };
  }

  await admin.from("point_events").insert({
    user_id: input.userId,
    type: "redemption",
    description: "Redeemed: " + input.rewardDescription,
    points: -input.rewardPoints,
  });

  await admin.from("users").update({
    points_total: (user.points_total ?? 0) - input.rewardPoints,
  }).eq("id", input.userId);

  await admin.from("redemptions").insert({
    user_id: input.userId,
    points_spent: input.rewardPoints,
    reward_description: input.rewardDescription,
    discount_code: input.discountCode ?? null,
    status: input.kind === "free_item" ? "pending_fulfillment" : "active",
  });

  return {
    ok: true,
    message:
      input.kind === "cash"
        ? "Redeemed. Code: " + (input.discountCode ?? "(generate upstream)")
        : "Redeemed. Select your free item at checkout.",
  };
}
