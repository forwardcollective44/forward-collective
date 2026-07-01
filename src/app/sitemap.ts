import type { MetadataRoute } from "next";
import { getStorefrontProducts } from "@/lib/shopify";

const BASE_URL = "https://forwardcollective.us";

// Product list changes often (new drops, sold-out items) — always compute
// fresh instead of caching the sitemap at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/collective`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/archives`, changeFrequency: "weekly", priority: 0.6 },
  ];

  // Pulls every active product straight from Shopify, so new drops are
  // added to the sitemap automatically with no code change.
  const products = (await getStorefrontProducts(100)) ?? [];
  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => !!p.handle)
    .map((p) => ({
      url: `${BASE_URL}/products/${p.handle}`,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...staticPages, ...productPages];
}
