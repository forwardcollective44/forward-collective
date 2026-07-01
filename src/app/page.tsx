import ProductCard from "@/components/ProductCard";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import { SAMPLE_PRODUCTS } from "@/lib/sample";
import { getStaplesGrouped } from "@/lib/shopify";

export const dynamic = "force-dynamic";

export default async function StaplePage() {
  // Live from the "Staple" collection in Shopify. One tile per colorway,
  // grouped by product type. Add products to that collection (and give them a
  // Product type) and they show up here automatically — no code change.
  const groups = await getStaplesGrouped("staple");

  return (
    <main>
      {/* Visually hidden but present in the DOM: gives search engines and
          screen readers a clear H1 for the homepage without changing the
          visual design. Delete `sr-only` if you'd rather show it. */}
      <h1 className="sr-only">
        Forward Collective — Streetwear Staples & Members-Only Drops
      </h1>

      {groups && groups.length ? (
        groups.map((group) => (
          <section key={group.type} className="border-t border-border">
            {/* Type band */}
            <div className="px-5 py-4 md:px-8">
              <h2 className="fc-label text-text">{group.type}</h2>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-3">
              {group.items.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        ))
      ) : (
        // Fallback before Shopify is connected.
        <section className="border-t border-border">
          <ProductGrid products={SAMPLE_PRODUCTS} />
        </section>
      )}

      <Footer />
    </main>
  );
}
