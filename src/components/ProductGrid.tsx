import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

// 3-col grid with 1px gridlines (the #1E1E1E background shows through the gap).
// Collapses to 2-col at 768px and 1-col at 480px.
export default function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="fc-grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
