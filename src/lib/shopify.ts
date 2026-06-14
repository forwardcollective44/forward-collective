// Forward Collective — Shopify Storefront API client.
//
// This is the bridge that makes the site "headless": Shopify stays the
// commerce backend (products, inventory, checkout, payments) and this app is
// the storefront customers see. We read products via the Storefront API and
// hand checkout back to Shopify's hosted checkout.
//
// Required env:
//   SHOPIFY_STORE_DOMAIN=gkufcd-m5.myshopify.com
//   SHOPIFY_STOREFRONT_ACCESS_TOKEN=...   (from a custom app, Storefront API)
//
// Create the token: Shopify admin → Settings → Apps and sales channels →
// Develop apps → Create an app → Storefront API access scopes:
// unauthenticated_read_product_listings, unauthenticated_write_checkouts,
// unauthenticated_read_checkouts → Install → copy the Storefront API token.

import type { Product } from "./types";

const API_VERSION = "2024-10";

function endpoint(): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) return null;
  return `https://${domain}/api/${API_VERSION}/graphql.json`;
}

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T | null> {
  const url = endpoint();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!url || !token) return null; // not configured yet → caller falls back to sample data

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    // Revalidate product data every 5 minutes.
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as T;
}

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        productType
        handle
        featuredImage { url altText }
        priceRange { minVariantPrice { amount } }
      }
    }
  }
`;

interface StorefrontProducts {
  products: {
    nodes: {
      id: string;
      title: string;
      productType: string | null;
      handle: string;
      featuredImage: { url: string; altText: string | null } | null;
      priceRange: { minVariantPrice: { amount: string } };
    }[];
  };
}

/** Fetch live products from Shopify. Returns null if not configured. */
export async function getStorefrontProducts(first = 24): Promise<Product[] | null> {
  const data = await storefront<StorefrontProducts>(PRODUCTS_QUERY, { first });
  if (!data) return null;
  return data.products.nodes.map((n) => ({
    id: n.id,
    name: n.title,
    category: n.productType || "",
    price: Number(n.priceRange.minVariantPrice.amount),
    image_url: n.featuredImage?.url ?? null,
    tag: "staple",
    active: true,
  }));
}
