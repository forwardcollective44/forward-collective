import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/pdp";
import ProductPurchase from "@/components/ProductPurchase";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProductDetail(params.handle);
  if (!product) notFound();

  return (
    // pb leaves room so the floating Add to Bag bar never hides the footer.
    <main className="pb-28">
      <section className="grid md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-surface md:aspect-auto md:min-h-[70vh]">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#ECEAE5]">
              <span className="fc-label text-muted">FC</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="border-l border-border p-6 md:p-12">
          <h1 className="fc-display text-[clamp(28px,5vw,52px)] text-text">
            {product.title}
          </h1>

          <ProductPurchase
            name={product.title}
            minPrice={product.minPrice}
            colors={product.colors}
            sizes={product.sizes}
            variants={product.variants}
          />

          {product.descriptionHtml && (
            <div
              className="fc-body mt-10 max-w-prose space-y-3 text-muted [&_li]:list-disc [&_ul]:ml-5"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
