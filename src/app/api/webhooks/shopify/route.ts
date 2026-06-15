// Forward Collective — Shopify order webhook.
//
// Shopify calls this endpoint when an order is paid. We verify the request is
// genuinely from Shopify (HMAC), match the order's customer to a Collective
// member by email, and credit loyalty points through the points engine. The
// handler is idempotent: Shopify retries webhooks, so we skip any order we've
// already credited (point_events carries the order_id).
//
// Setup:
//   1) In Shopify admin → Settings → Notifications → Webhooks, create a
//      webhook: event "Order payment", format JSON, URL
//      https://forward-collective.vercel.app/api/webhooks/shopify
//   2) Copy the signing secret shown on that page into Vercel as
//      SHOPIFY_WEBHOOK_SECRET, then redeploy.

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { recordFulfilledOrder } from "@/lib/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyHmac(rawBody: string, hmacHeader: string | null, secret: string): boolean {
  if (!hmacHeader) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(hmacHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

interface ShopifyLineItem {
  quantity?: number;
}
interface ShopifyOrder {
  id?: number | string;
  email?: string | null;
  contact_email?: string | null;
  current_total_price?: string;
  total_price?: string;
  created_at?: string;
  customer?: { email?: string | null } | null;
  line_items?: ShopifyLineItem[];
}

export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[shopify-webhook] SHOPIFY_WEBHOOK_SECRET not set");
    // 200 so Shopify doesn't hammer retries while the secret is being wired up.
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 200 });
  }

  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  if (!verifyHmac(raw, hmac, secret)) {
    return NextResponse.json({ ok: false, reason: "bad_hmac" }, { status: 401 });
  }

  let order: ShopifyOrder;
  try {
    order = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_json" }, { status: 400 });
  }

  const orderId = String(order.id ?? "");
  const email =
    order.email || order.contact_email || order.customer?.email || null;
  const amount = Number(order.current_total_price ?? order.total_price ?? 0);
  const itemCount = (order.line_items ?? []).reduce(
    (sum, li) => sum + (li.quantity ?? 0),
    0
  );

  if (!orderId || !email) {
    // Nothing to attribute; acknowledge so Shopify stops retrying.
    return NextResponse.json({ ok: true, reason: "no_order_or_email" });
  }

  const admin = createServiceClient();

  // Idempotency: have we already credited this order?
  const { data: existing } = await admin
    .from("point_events")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);
  if (existing && existing.length) {
    return NextResponse.json({ ok: true, reason: "already_processed" });
  }

  // Match the order to a member by email.
  const { data: user } = await admin
    .from("users")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (!user) {
    return NextResponse.json({ ok: true, reason: "no_member_for_email" });
  }

  const result = await recordFulfilledOrder({
    userId: user.id,
    orderId,
    amount,
    itemCount,
    purchaseDate: order.created_at,
  });

  return NextResponse.json({ ok: result.ok, earned: result.earned });
}
