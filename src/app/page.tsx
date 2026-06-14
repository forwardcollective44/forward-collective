import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import { SAMPLE_PRODUCTS } from "@/lib/sample";
import { getStorefrontProducts } from "@/lib/shopify";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  // Live products from Shopify (headless). Falls back to your real sample
  // products until SHOPIFY_STORE_DOMAIN + SHOPIFY_STOREFRONT_ACCESS_TOKEN are set.
  const live = await getStorefrontProducts(24);
  if (live && live.length) return live;
  return SAMPLE_PRODUCTS;
}

export default async function StaplePage() {
  const products = await getProducts();

  return (
    <main>
      {/* Hellstar-style: no marketing hero. The page opens straight onto the
          clothing grid, edge to edge, directly under the sticky nav. */}
      <section className="border-t border-border">
        <ProductGrid products={products} />
      </section>

      <Footer />
    </main>
  );
}
