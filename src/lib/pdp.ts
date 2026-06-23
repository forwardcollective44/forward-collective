// Product detail for the PDP. Self-contained Storefront fetch (kept separate
// from shopify.ts) that returns each variant split into color + size so the
// product page can render color swatches and a size selector per color.
//
// QUERY is written as a single-line double-quoted string on purpose (no
// template literals) so the file stays easy to edit anywhere.

const API_VERSION = "2024-10";

const QUERY =
  "query Pdp($handle: String!) { product(handle: $handle) { title descriptionHtml featuredImage { url } priceRange { minVariantPrice { amount } } options { name values } variants(first: 100) { nodes { id title availableForSale price { amount } image { url } selectedOptions { name value } } } } }";

export interface PdpVariant {
  id: string;
  title: string;
  available: boolean;
  price: number;
  color: string | null;
  size: string | null;
  image: string | null;
}

export interface PdpDetail {
  title: string;
  descriptionHtml: string;
  image: string | null;
  minPrice: number;
  colors: string[];
  sizes: string[];
  variants: PdpVariant[];
}

export async function getProductDetail(handle: string): Promise<PdpDetail | null> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!domain || !token) return null;

  const url = "https://" + domain + "/api/" + API_VERSION + "/graphql.json";
  let json: any;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: QUERY, variables: { handle } }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }

  const p = json?.data?.product;
  if (!p) return null;

  const optionValues = (name: string): string[] => {
    const found = (p.options || []).find(
      (o: any) => String(o.name).toLowerCase() === name
    );
    return found?.values ?? [];
  };

  const variants: PdpVariant[] = (p.variants?.nodes || []).map((v: any) => {
    const pick = (n: string): string | null =>
      (v.selectedOptions || []).find(
        (s: any) => String(s.name).toLowerCase() === n
      )?.value ?? null;
    return {
      id: v.id,
      title: v.title,
      available: !!v.availableForSale,
      price: Number(v.price?.amount ?? 0),
      color: pick("color"),
      size: pick("size"),
      image: v.image?.url ?? null,
    };
  });

  return {
    title: p.title,
    descriptionHtml: p.descriptionHtml || "",
    image: p.featuredImage?.url ?? null,
    minPrice: Number(p.priceRange?.minVariantPrice?.amount ?? 0),
    colors: optionValues("color"),
    sizes: optionValues("size"),
    variants,
  };
}
