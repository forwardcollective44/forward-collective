import Image from "next/image";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group relative overflow-hidden bg-surface">
      {/* 3:4 image */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
            className="fc-transform object-cover group-hover:scale-[1.04]"
          />
        ) : (
          // Placeholder block — swap for real product photography.
          <div className="fc-transform flex h-full w-full items-center justify-center bg-[#101010] group-hover:scale-[1.04]">
            <span className="fc-label text-muted">FC</span>
          </div>
        )}
        {/* Select Size — slides up from bottom on hover */}
        <button
          className="fc-transform absolute inset-x-0 bottom-0 translate-y-full bg-text py-3 text-bg group-hover:translate-y-0"
          aria-label={`Select size for ${product.name}`}
        >
          <span className="fc-label">Select Size</span>
        </button>
      </div>
      {/* Meta */}
      <div className="space-y-1 px-3 py-4">
        <h3 className="fc-label text-text">{product.name}</h3>
        <p className="fc-label text-muted">{product.category}</p>
        <p className="fc-label text-text">${product.price.toFixed(0)}</p>
      </div>
    </article>
  );
}
