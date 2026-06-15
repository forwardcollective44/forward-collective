import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

// 3-col grid with 1px gridlines (the border color shows through the gaps).
// 2 columns on phones, 3 on desktop — edge-to-edge, grid-to-grid.
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="fc-grid grid-cols-2 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
