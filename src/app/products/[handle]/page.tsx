import Image from "next/image";
import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify";
import { addToCart } from "@/lib/cart";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProductByHandle(params.handle);
  if (!product) notFound();

  return (
    <main>
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
          <p className="fc-label mt-4 text-text">${product.minPrice.toFixed(2)}</p>

          <form action={addToCart} className="mt-10 space-y-6">
            <fieldset>
              <legend className="fc-label mb-3 text-muted">Select Size</legend>
              <div className="flex flex-wrap gap-px bg-border">
                {product.variants.map((v, i) => (
                  <label key={v.id} className="bg-surface">
                    <input
                      type="radio"
                      name="merchandiseId"
                      value={v.id}
                      defaultChecked={i === 0}
                      disabled={!v.availableForSale}
                      className="peer sr-only"
                    />
                    <span className="fc-color fc-label block cursor-pointer px-5 py-3 text-muted peer-checked:bg-text peer-checked:text-bg peer-disabled:opacity-30">
                      {v.title}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              className="fc-color fc-label w-full border border-gold bg-gold px-6 py-4 text-ink hover:bg-gold-light"
            >
              Add to Bag
            </button>
          </form>

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
