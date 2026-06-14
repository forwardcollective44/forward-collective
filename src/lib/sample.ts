// Sample data for local development before Supabase is seeded.
// Pages fall back to this when no DB rows are returned.

import type { Product, Drop, User, PointEvent } from "./types";

// Real Forward Apparel products (image URLs from your Shopify CDN). Used as a
// fallback so the grid shows real clothing before the Storefront token is set.
export const SAMPLE_PRODUCTS: Product[] = [
  { id: "p1", name: "Collective Zip Hoodie", category: "Outerwear", price: 80, image_url: "https://cdn.shopify.com/s/files/1/0959/5086/4680/files/store-1781314491630-1475532178.png?v=1781314495", tag: "staple", active: true },
  { id: "p2", name: "1944 Tee", category: "Tops", price: 52.5, image_url: "https://cdn.shopify.com/s/files/1/0959/5086/4680/files/store-1781314362447-3799982389.png?v=1781314366", tag: "staple", active: true },
  { id: "p3", name: "Kill Bill Sweatpants", category: "Bottoms", price: 100, image_url: "https://cdn.shopify.com/s/files/1/0959/5086/4680/files/store-1781314099577-7758409780.png?v=1781314103", tag: "staple", active: true },
  { id: "p4", name: "Forward Staple Sweatpants", category: "Bottoms", price: 44.55, image_url: "https://cdn.shopify.com/s/files/1/0959/5086/4680/files/store-1781313820410-4717760180.png?v=1781313824", tag: "staple", active: true },
];

export const SAMPLE_DROPS: Drop[] = [
  { id: "d1", name: "Origin", season: "FW24", status: "archived", early_access_date: null, public_release_date: null, image_url: null, created_at: "" },
  { id: "d2", name: "Nightshift", season: "SS25", status: "archived", early_access_date: null, public_release_date: null, image_url: null, created_at: "" },
  { id: "d3", name: "Static", season: "FW25", status: "archived", early_access_date: null, public_release_date: null, image_url: null, created_at: "" },
  { id: "d4", name: "Threshold", season: "SS26", status: "archived", early_access_date: null, public_release_date: null, image_url: null, created_at: "" },
];

// A demo member for previewing the dashboard without auth.
export const SAMPLE_MEMBER: User = {
  id: "demo",
  email: "member@example.com",
  phone: null,
  name: "Demo Member",
  points_total: 1840,
  collective_member: true,
  early_access: false,
  member_since: "2025-09-01T00:00:00.000Z",
  last_purchase_date: "2026-05-04T00:00:00.000Z",
  purchase_count: 7,
  current_streak_months: 4,
  longest_streak_months: 4,
  lifetime_spend: 1620,
  referral_code: "FC-DEMO01",
  referred_by: null,
  created_at: "2025-09-01T00:00:00.000Z",
};

export const SAMPLE_EVENTS: PointEvent[] = [
  { id: "e1", user_id: "demo", order_id: "1007", type: "purchase_base", description: "Purchase — $180.00", points: 180, created_at: "2026-05-04T00:00:00.000Z" },
  { id: "e2", user_id: "demo", order_id: "1007", type: "order_size_bonus", description: "Order over $100 — 1.25x bonus", points: 45, created_at: "2026-05-04T00:00:00.000Z" },
  { id: "e3", user_id: "demo", order_id: null, type: "streak_bonus", description: "3-month streak", points: 100, created_at: "2026-04-02T00:00:00.000Z" },
  { id: "e4", user_id: "demo", order_id: null, type: "redemption", description: "Redeemed: $5 off your next order", points: -150, created_at: "2026-03-18T00:00:00.000Z" },
  { id: "e5", user_id: "demo", order_id: "1003", type: "purchase_base", description: "Purchase — $120.00", points: 120, created_at: "2026-03-01T00:00:00.000Z" },
  { id: "e6", user_id: "demo", order_id: null, type: "welcome_bonus", description: "Welcome to The Collective", points: 50, created_at: "2025-09-01T00:00:00.000Z" },
];
