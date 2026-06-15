// Forward Collective — Shopify Storefront API client.
//
// Makes the site "headless": Shopify stays the commerce backend (products,
// inventory, cart, checkout, payments) and this app is the storefront. We read
// products and build a cart via the Storefront API, then hand the customer off
// to Shopify's prebuilt hosted checkout (cart.checkoutUrl).
//
// Required env:
//   SHOPIFY_STORE_DOMAIN=gkufcd-m5.myshopify.com
//   SHOPIFY_STOREFRONT_ACCESS_TOKEN=...   (Headless channel public token)

import type { Product } from "./types";

const API_VERSION = "2024-10";

function endpoint(): string | null {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) return null;
  return `https://${domain}/api/${API_VERSION}/graphql.json`;
}

async function storefront<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: { noStore?: boolean } = {}
): Promise<T | null> {
  const url = endpoint();
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    ...(opts.noStore
      ? { cache: "no-store" as const }
      : { next: { revalidate: 300 } }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Products (grid)
// ---------------------------------------------------------------------------

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        handle
        productType
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
      handle: string;
      productType: string | null;
      featuredImage: { url: string; altText: string | null } | null;
      priceRange: { minVariantPrice: { amount: string } };
    }[];
  };
}

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
    handle: n.handle,
  }));
}

// ---------------------------------------------------------------------------
// Products in a collection (e.g. the Archives gallery)
// ---------------------------------------------------------------------------

const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: CREATED, reverse: true) {
        nodes {
          id
          title
          handle
          productType
          featuredImage { url altText }
          priceRange { minVariantPrice { amount } }
        }
      }
    }
  }
`;

export async function getCollectionProducts(
  handle: string,
  first = 24
): Promise<Product[] | null> {
  const data = await storefront<{
    collection: {
      products: {
        nodes: {
          id: string;
          title: string;
          handle: string;
          productType: string | null;
          featuredImage: { url: string; altText: string | null } | null;
          priceRange: { minVariantPrice: { amount: string } };
        }[];
      };
    } | null;
  }>(COLLECTION_PRODUCTS_QUERY, { handle, first });
  if (!data?.collection) return null;
  return data.collection.products.nodes.map((n) => ({
    id: n.id,
    name: n.title,
    category: n.productType || "",
    price: Number(n.priceRange.minVariantPrice.amount),
    image_url: n.featuredImage?.url ?? null,
    tag: "archive",
    active: true,
    handle: n.handle,
  }));
}

// ---------------------------------------------------------------------------
// Single product (PDP)
// ---------------------------------------------------------------------------

export interface PdpVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: number;
}
export interface Pdp {
  title: string;
  descriptionHtml: string;
  image: string | null;
  minPrice: number;
  variants: PdpVariant[];
}

const PRODUCT_QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      title
      descriptionHtml
      featuredImage { url }
      priceRange { minVariantPrice { amount } }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price { amount }
        }
      }
    }
  }
`;

export async function getProductByHandle(handle: string): Promise<Pdp | null> {
  const data = await storefront<{
    product: {
      title: string;
      descriptionHtml: string;
      featuredImage: { url: string } | null;
      priceRange: { minVariantPrice: { amount: string } };
      variants: { nodes: { id: string; title: string; availableForSale: boolean; price: { amount: string } }[] };
    } | null;
  }>(PRODUCT_QUERY, { handle });
  if (!data?.product) return null;
  const p = data.product;
  return {
    title: p.title,
    descriptionHtml: p.descriptionHtml || "",
    image: p.featuredImage?.url ?? null,
    minPrice: Number(p.priceRange.minVariantPrice.amount),
    variants: p.variants.nodes.map((v) => ({
      id: v.id,
      title: v.title,
      availableForSale: v.availableForSale,
      price: Number(v.price.amount),
    })),
  };
}

// ---------------------------------------------------------------------------
// Cart  →  Shopify hosted checkout
// ---------------------------------------------------------------------------

export interface CartLine {
  id: string;
  title: string;
  variantTitle: string;
  quantity: number;
  price: number;
  image: string | null;
  handle: string;
}
export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: number;
  lines: CartLine[];
}

const CART_FRAGMENT = `
  fragment CartParts on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount } }
    lines(first: 50) {
      nodes {
        id
        quantity
        merchandise {
          ... on ProductVariant {
            title
            price { amount }
            product { title handle featuredImage { url } }
          }
        }
      }
    }
  }
`;

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: { amount: string } };
  lines: {
    nodes: {
      id: string;
      quantity: number;
      merchandise: {
        title: string;
        price: { amount: string };
        product: { title: string; handle: string; featuredImage: { url: string } | null };
      };
    }[];
  };
}

function shapeCart(raw: RawCart | null | undefined): Cart | null {
  if (!raw) return null;
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: Number(raw.cost.subtotalAmount.amount),
    lines: raw.lines.nodes.map((l) => ({
      id: l.id,
      title: l.merchandise.product.title,
      variantTitle: l.merchandise.title,
      quantity: l.quantity,
      price: Number(l.merchandise.price.amount),
      image: l.merchandise.product.featuredImage?.url ?? null,
      handle: l.merchandise.product.handle,
    })),
  };
}

export async function createCart(merchandiseId: string, quantity = 1): Promise<Cart | null> {
  const data = await storefront<{ cartCreate: { cart: RawCart } }>(
    `mutation Create($lines: [CartLineInput!]!) {
       cartCreate(input: { lines: $lines }) { cart { ...CartParts } }
     } ${CART_FRAGMENT}`,
    { lines: [{ merchandiseId, quantity }] },
    { noStore: true }
  );
  return shapeCart(data?.cartCreate?.cart);
}

export async function addLine(cartId: string, merchandiseId: string, quantity = 1): Promise<Cart | null> {
  const data = await storefront<{ cartLinesAdd: { cart: RawCart } }>(
    `mutation Add($cartId: ID!, $lines: [CartLineInput!]!) {
       cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartParts } }
     } ${CART_FRAGMENT}`,
    { cartId, lines: [{ merchandiseId, quantity }] },
    { noStore: true }
  );
  return shapeCart(data?.cartLinesAdd?.cart);
}

export async function removeLine(cartId: string, lineId: string): Promise<Cart | null> {
  const data = await storefront<{ cartLinesRemove: { cart: RawCart } }>(
    `mutation Remove($cartId: ID!, $lineIds: [ID!]!) {
       cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartParts } }
     } ${CART_FRAGMENT}`,
    { cartId, lineIds: [lineId] },
    { noStore: true }
  );
  return shapeCart(data?.cartLinesRemove?.cart);
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(
    `query Cart($id: ID!) { cart(id: $id) { ...CartParts } } ${CART_FRAGMENT}`,
    { id: cartId },
    { noStore: true }
  );
  return shapeCart(data?.cart);
}
