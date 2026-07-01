import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/pdp";
import { stripHtml } from "@/lib/seo";
import ProductPurchase from "@/components/ProductPurchase";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const product = await getProductDetail(params.handle);
  if (!product) {
    return { title: "Product Not Found" };
  }

  const description = stripHtml(product.descriptionHtml);

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.image
        ? [{ url: product.image, width: 1200, height: 1200, alt: product.title }]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { handle: string };
}) {
  const product = await getProductDetail(params.handle);
  if (!product) notFound();

  const inStock = product.variants.some((v) => v.available);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: stripHtml(product.descriptionHtml, 500),
    image: product.image ? [product.image] : undefined,
    brand: { "@type": "Brand", name: "Forward Collective" },
    offers: {
      "@type": "Offer",
      url: `https://forwardcollective.us/products/${params.handle}`,
      priceCurrency: "USD",
      price: product.minPrice,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    // pb leaves room so the floating Add to Bag bar never hides the footer.
    <main className="pb-32">
      {/* Product structured data — lets Google show price/availability
          directly in search results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="grid md:grid-cols-2">
        {/* Image — framed by negative space so the garment can breathe. */}
        <div className="bg-surface p-8 sm:p-12 md:p-16 lg:p-24">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[520px]">
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
              <div className="flex h-full w-full items-center justify-center">
                <span className="fc-label text-muted">FC</span>
              </div>
            )}
          </div>
        </div>

        {/* Details — vertically centered with generous padding for an airy,
            editorial feel. Content is held in a narrow column so nothing
            stretches edge to edge. */}
        <div className="flex flex-col justify-center border-t border-border px-6 py-16 md:border-l md:border-t-0 md:px-16 md:py-24 lg:px-24">
          <div className="mx-auto w-full max-w-md">
            <h1 className="fc-display text-[clamp(28px,4.5vw,52px)] leading-[1.05] text-text">
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
                className="fc-body mt-14 max-w-prose space-y-3 border-t border-border pt-10 text-muted [&_li]:list-disc [&_ul]:ml-5"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
