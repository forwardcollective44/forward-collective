"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { addItemAction, removeItemAction } from "@/lib/cart";
import type { Cart } from "@/lib/shopify";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type Ctx = {
  cart: Cart | null;
  count: number;
  open: boolean;
  busy: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (merchandiseId: string) => Promise<void>;
  remove: (lineId: string) => Promise<void>;
};

const CartCtx = createContext<Ctx | null>(null);

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}

export function CartProvider({
  initial,
  children,
}: {
  initial: Cart | null;
  children: ReactNode;
}) {
  const [cart, setCart] = useState<Cart | null>(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = useCallback(async (merchandiseId: string) => {
    if (!merchandiseId) return;
    setBusy(true);
    setOpen(true);
    try {
      const next = await addItemAction(merchandiseId);
      setCart(next);
    } finally {
      setBusy(false);
    }
  }, []);

  const remove = useCallback(async (lineId: string) => {
    setBusy(true);
    try {
      const next = await removeItemAction(lineId);
      setCart(next);
    } finally {
      setBusy(false);
    }
  }, []);

  const count = cart?.totalQuantity ?? 0;

  return (
    <CartCtx.Provider
      value={{
        cart,
        count,
        open,
        busy,
        openCart: () => setOpen(true),
        closeCart: () => setOpen(false),
        add,
        remove,
      }}
    >
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

function CartDrawer() {
  const { cart, count, open, busy, closeCart, remove } = useCart();
  const lines = cart?.lines ?? [];

  return (
    <>
      {/* Dim overlay */}
      <div
        onClick={closeCart}
        aria-hidden="true"
        className={cx(
          "fixed inset-0 z-[60] bg-black/30 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Panel */}
      <aside
        aria-label="Your bag"
        className={cx(
          "fixed right-0 top-0 z-[70] flex h-full w-[88%] max-w-sm flex-col bg-bg shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <span className="fc-label text-text">Your Bag ({count})</span>
          <button
            type="button"
            onClick={closeCart}
            className="fc-color fc-label text-muted hover:text-text"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <p className="fc-body p-6 text-muted">
              Your bag is empty.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-4 p-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-surface">
                    {l.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="fc-label text-text">{l.title}</p>
                    <p className="fc-label mt-1 text-muted">
                      {l.variantTitle} · Qty {l.quantity}
                    </p>
                    <button
                      type="button"
                      onClick={() => remove(l.id)}
                      disabled={busy}
                      className="fc-color fc-label mt-3 text-muted hover:text-error disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                  <span className="fc-label text-text">
                    ${(l.price * l.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="space-y-3 border-t border-border p-5">
          {lines.length > 0 && cart ? (
            <>
              <div className="flex items-center justify-between">
                <span className="fc-label text-muted">Subtotal</span>
                <span className="fc-label text-text">
                  ${cart.subtotal.toFixed(2)}
                </span>
              </div>
              <a
                href={cart.checkoutUrl}
                className="fc-color fc-label block border border-gold bg-gold px-6 py-4 text-center text-ink hover:bg-gold-light"
              >
                Checkout
              </a>
            </>
          ) : null}
          <button
            type="button"
            onClick={closeCart}
            className="fc-color fc-label block w-full py-2 text-center text-muted hover:text-text"
          >
            Continue Shopping
          </button>
        </footer>
      </aside>
    </>
  );
}

export function BagButton({ className }: { className?: string }) {
  const { openCart, count } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={"Bag, " + count + " items"}
      className={cx("fc-color relative inline-flex text-text", className)}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-text px-1 text-[10px] font-bold leading-none text-bg">
          {count}
        </span>
      ) : null}
    </button>
  );
}

export function ContinueShoppingLink({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cx(
        "fc-color fc-label text-gold hover:text-gold-light",
        className
      )}
    >
      Continue Shopping
    </button>
  );
}
