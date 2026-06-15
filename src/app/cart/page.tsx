import Link from "next/link";
import { cookies } from "next/headers";
import { getCart } from "@/lib/shopify";
import { removeFromCart } from "@/lib/cart";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cartId = cookies().get("fc_cart")?.value;
  const cart = cartId ? await getCart(cartId) : null;
  const lines = cart?.lines ?? [];

  return (
    <main>
      <section className="mx-auto max-w-3xl px-5 py-12 md:px-8">
        <h1 className="fc-display text-[clamp(28px,5vw,48px)] text-text">Your Bag</h1>

        {lines.length === 0 ? (
          <p className="fc-body mt-8 text-muted">
            Your bag is empty.{" "}
            <Link href="/" className="fc-color text-gold hover:text-gold-light">
              Shop Staple
            </Link>
            .
          </p>
        ) : (
          <>
            <div className="mt-8 divide-y divide-border border-y border-border">
              {lines.map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${l.handle}`}
                      className="fc-color fc-label text-text hover:text-gold"
                    >
                      {l.title}
                    </Link>
                    <p className="fc-label mt-1 text-muted">
                      {l.variantTitle} · Qty {l.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="fc-label text-text">
                      ${(l.price * l.quantity).toFixed(2)}
                    </span>
                    <form action={removeFromCart}>
                      <input type="hidden" name="lineId" value={l.id} />
                      <button type="submit" className="fc-color fc-label text-muted hover:text-error">
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <span className="fc-label text-muted">Subtotal</span>
              <span className="fc-display text-[clamp(18px,3vw,24px)] text-text">
                ${cart!.subtotal.toFixed(2)}
              </span>
            </div>

            <a
              href={cart!.checkoutUrl}
              className="fc-color fc-label mt-8 block w-full border border-gold bg-gold px-6 py-4 text-center text-ink hover:bg-gold-light"
            >
              Checkout
            </a>
            <p className="fc-label mt-3 text-center text-muted">
              Secure checkout by Shopify
            </p>
          </>
        )}
      </section>
      <Footer />
    </main>
  );
}
