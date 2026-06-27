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

  // Always fetch fresh from Shopify so any edit you make in the admin —
  // price, photo, title, description, availability — shows on the site on the
  // very next page load. Every page here is already dynamic, so there is no
  // static cache to lose. (opts.noStore kept for call-site compatibility.)
  void opts;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
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
// The Staples page — pulled live from a Shopify collection, one tile PER
// COLORWAY, grouped by product type. Add/remove products in the "Staple"
// collection in Shopify (and set a Product type) and this updates itself; no
// code change needed. A product with White + Black shows as two tiles.
// ---------------------------------------------------------------------------

export interface StapleTypeGroup {
  type: string; // e.g. "Tees", "Hoodies", "Sweatpants"
  items: Product[]; // one Product per colorway (category holds the color name)
}

// Order the type bands appear in. Anything not listed falls to the end,
// alphabetically — so new product types you add still show up automatically.
const TYPE_ORDER = ["Tees", "Hoodies", "Sweatpants"];

const STAPLES_QUERY = `
  query Staples($handle: String!) {
    collection(handle: $handle) {
      products(first: 60, sortKey: CREATED, reverse: true) {
        nodes {
          id
          title
          handle
          productType
          options { name values }
          featuredImage { url }
          priceRange { minVariantPrice { amount } }
          variants(first: 100) {
            nodes {
              availableForSale
              price { amount }
              image { url }
              selectedOptions { name value }
            }
          }
        }
      }
    }
  }
`;

interface StaplesData {
  collection: {
    products: {
      nodes: {
        id: string;
        title: string;
        handle: string;
        productType: string | null;
        options: { name: string; values: string[] }[];
        featuredImage: { url: string } | null;
        priceRange: { minVariantPrice: { amount: string } };
        variants: {
          nodes: {
            availableForSale: boolean;
            price: { amount: string };
            image: { url: string } | null;
            selectedOptions: { name: string; value: string }[];
          }[];
        };
      }[];
    };
  } | null;
}

export async function getStaplesGrouped(
  handle = "staple"
): Promise<StapleTypeGroup[] | null> {
  const data = await storefront<StaplesData>(STAPLES_QUERY, { handle });
  if (!data?.collection) return null;

  const groups = new Map<string, Product[]>();

  for (const p of data.collection.products.nodes) {
    const colorOption = p.options.find((o) => o.name.toLowerCase() === "color");
    const colors = colorOption?.values?.length ? colorOption.values : [""];

    for (const color of colors) {
      const colorVariants = color
        ? p.variants.nodes.filter((v) =>
            v.selectedOptions.some(
              (o) => o.name.toLowerCase() === "color" && o.value === color
            )
          )
        : p.variants.nodes;

      const withImage = colorVariants.find((v) => v.image?.url);
      const image =
        withImage?.image?.url ?? p.featuredImage?.url ?? null;

      const prices = colorVariants.map((v) => Number(v.price.amount));
      const price = prices.length
        ? Math.min(...prices)
        : Number(p.priceRange.minVariantPrice.amount);

      const tile: Product = {
        id: `${p.id}:${color || "default"}`,
        name: p.title,
        category: color, // colorway shown on the card
        price,
        image_url: image,
        tag: "staple",
        active: true,
        handle: p.handle,
      };

      const type = p.productType || "Other";
      const arr = groups.get(type) ?? [];
      arr.push(tile);
      groups.set(type, arr);
    }
  }

  // Order the bands: known types first (in TYPE_ORDER), then the rest A→Z.
  const ordered = Array.from(groups.keys()).sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a);
    const ib = TYPE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return ordered.map((type) => ({ type, items: groups.get(type)! }));
}

// ---------------------------------------------------------------------------
// Forward Archives — sections driven entirely by Shopify collections.
// Any collection with the "Archive order" metafield (forward.archive_order)
// set appears as a section, low number first. The collection's title is the
// section name, its description (rich text — supports images / social proof)
// is the story, and its products are the clothing. Add a collection, set the
// number, fill it in — no code change.
// ---------------------------------------------------------------------------

export interface ArchiveSection {
  id: string;
  title: string;
  handle: string;
  descriptionHtml: string;
  image: string | null;
  products: Product[];
}

const ARCHIVE_SECTIONS_QUERY = `
  query ArchiveSections {
    collections(first: 50) {
      nodes {
        id
        title
        handle
        descriptionHtml
        image { url }
        order: metafield(namespace: "forward", key: "archive_order") { value }
        exclusive: metafield(namespace: "forward", key: "exclusive") { value }
        products(first: 24, sortKey: CREATED, reverse: true) {
          nodes {
            id
            title
            handle
            productType
            featuredImage { url }
            priceRange { minVariantPrice { amount } }
          }
        }
      }
    }
  }
`;

interface ArchiveSectionsData {
  collections: {
    nodes: {
      id: string;
      title: string;
      handle: string;
      descriptionHtml: string | null;
      image: { url: string } | null;
      order: { value: string } | null;
      exclusive: { value: string } | null;
      products: {
        nodes: {
          id: string;
          title: string;
          handle: string;
          productType: string | null;
          featuredImage: { url: string } | null;
          priceRange: { minVariantPrice: { amount: string } };
        }[];
      };
    }[];
  };
}

export async function getArchiveSections(): Promise<ArchiveSection[]> {
  const data = await storefront<ArchiveSectionsData>(ARCHIVE_SECTIONS_QUERY);
  if (!data) return [];
  return data.collections.nodes
    // Has an archive order, and is NOT the current exclusive drop (that one
    // lives in its own gated section, not the past-collections list).
    .filter((c) => c.order?.value != null && c.order.value !== "")
    .filter((c) => c.exclusive?.value !== "true")
    .sort((a, b) => Number(a.order!.value) - Number(b.order!.value))
    .map((c) => ({
      id: c.id,
      title: c.title,
      handle: c.handle,
      descriptionHtml: c.descriptionHtml || "",
      image: c.image?.url ?? null,
      products: c.products.nodes.map((n) => ({
        id: n.id,
        name: n.title,
        category: n.productType || "",
        price: Number(n.priceRange.minVariantPrice.amount),
        image_url: n.featuredImage?.url ?? null,
        tag: "archive",
        active: true,
        handle: n.handle,
      })),
    }));
}

// ---------------------------------------------------------------------------
// Exclusive drop — the one current members-only release. Controlled entirely
// in Shopify, no code, via metafields on a single collection:
//
//   forward.exclusive          "true"   — marks THIS collection as the drop
//   forward.exclusive_status   "coming_soon" | "live"
//   forward.exclusive_password the shared unlock code (read server-side only)
//   forward.exclusive_teaser   optional line shown while it's coming soon
//
// The collection TITLE is the drop name (the cutscene headline) and its
// products are the clothing revealed after unlock. The drop name and the
// products are never sent to the browser until the member unlocks — the gate
// only ever knows the status and teaser. When the drop is over, remove the
// "exclusive" flag and give the collection an "archive_order" to fold it into
// the past-collections list. One drop flagged at a time.
// ---------------------------------------------------------------------------

export interface ExclusiveDropMeta {
  handle: string; // server-side only; used to scope the unlock cookie
  status: "coming_soon" | "live";
  teaser: string;
}

export interface ExclusiveReveal {
  name: string;
  products: Product[];
}

interface ExclusiveNode {
  title: string;
  handle: string;
  flag: { value: string } | null;
  status: { value: string } | null;
  teaser: { value: string } | null;
  password: { value: string } | null;
  products: {
    nodes: {
      id: string;
      title: string;
      handle: string;
      productType: string | null;
      featuredImage: { url: string } | null;
      priceRange: { minVariantPrice: { amount: string } };
    }[];
  };
}

async function fetchExclusiveNode(): Promise<ExclusiveNode | null> {
  const data = await storefront<{ collections: { nodes: ExclusiveNode[] } }>(
    `query ExclusiveDrop {
       collections(first: 50) {
         nodes {
           title
           handle
           flag: metafield(namespace: "forward", key: "exclusive") { value }
           status: metafield(namespace: "forward", key: "exclusive_status") { value }
           teaser: metafield(namespace: "forward", key: "exclusive_teaser") { value }
           password: metafield(namespace: "forward", key: "exclusive_password") { value }
           products(first: 48, sortKey: CREATED, reverse: true) {
             nodes {
               id
               title
               handle
               productType
               featuredImage { url }
               priceRange { minVariantPrice { amount } }
             }
           }
         }
       }
     }`,
    {},
    { noStore: true }
  );
  if (!data) return null;
  return data.collections.nodes.find((n) => n.flag?.value === "true") ?? null;
}

/** Safe for the gate: status + teaser only. No drop name, no products. */
export async function getExclusiveDropMeta(): Promise<ExclusiveDropMeta | null> {
  const c = await fetchExclusiveNode();
  if (!c) return null;
  return {
    handle: c.handle,
    status: c.status?.value === "live" ? "live" : "coming_soon",
    teaser: c.teaser?.value || "",
  };
}

/** The reveal: drop name + products. Call ONLY after a verified unlock. */
export async function getExclusiveReveal(): Promise<ExclusiveReveal | null> {
  const c = await fetchExclusiveNode();
  if (!c) return null;
  return {
    name: c.title,
    products: c.products.nodes.map((n) => ({
      id: n.id,
      name: n.title,
      category: n.productType || "",
      price: Number(n.priceRange.minVariantPrice.amount),
      image_url: n.featuredImage?.url ?? null,
      tag: "exclusive",
      active: true,
      handle: n.handle,
    })),
  };
}

/** Server-only password read. Never expose the result to the client. */
export async function getExclusivePassword(): Promise<string | null> {
  const c = await fetchExclusiveNode();
  return c?.password?.value ?? null;
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
