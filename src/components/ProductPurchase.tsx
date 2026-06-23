"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/components/cart/CartUI";
import type { PdpVariant } from "@/lib/pdp";

// Common color names -> swatch hex. Anything not listed falls back to the
// variant's own product image (so new colors still look right), then to grey.
const SWATCH: Record<string, string> = {
  white: "#ffffff",
  offwhite: "#f3efe7",
  cream: "#f5f0e6",
  bone: "#e7e1d5",
  beige: "#e8e0d0",
  sand: "#d8c9a8",
  tan: "#c2b280",
  khaki: "#c2b280",
  stone: "#b8b0a0",
  grey: "#8c8a85",
  gray: "#8c8a85",
  charcoal: "#36454f",
  black: "#141414",
  navy: "#1f2a44",
  blue: "#2a4d8f",
  green: "#3a5a40",
  olive: "#556b2f",
  forest: "#2e4031",
  brown: "#6f4e37",
  maroon: "#5a1f1f",
  red: "#8b3a3a",
  burgundy: "#5a1f1f",
  purple: "#5b3a72",
  pink: "#d8a0b0",
  yellow: "#d9c04a",
  orange: "#c8702d",
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export default function ProductPurchase({
  name,
  minPrice,
  colors,
  sizes,
  variants,
}: {
  name: string;
  minPrice: number;
  colors: string[];
  sizes: string[];
  variants: PdpVariant[];
}) {
  const { add, busy } = useCart();
  const hasColor = colors.length > 0;
  const hasSize = sizes.length > 0;

  const variantFor = useMemo(
    () => (color: string | null, size: string | null) =>
      variants.find(
        (v) =>
          (!hasColor || v.color === color) && (!hasSize || v.size === size)
      ),
    [variants, hasColor, hasSize]
  );

  const firstSizeFor = (color: string | null) => {
    if (!hasSize) return null;
    const open = sizes.find((s) => variantFor(color, s)?.available);
    return open ?? sizes[0] ?? null;
  };

  const [color, setColor] = useState<string | null>(hasColor ? colors[0] : null);
  const [size, setSize] = useState<string | null>(() =>
    firstSizeFor(hasColor ? colors[0] : null)
  );

  function chooseColor(next: string) {
    setColor(next);
    if (hasSize && !variantFor(next, size)?.available) {
      setSize(firstSizeFor(next));
    }
  }

  const current = variantFor(color, size);
  const price = current?.price ?? minPrice;
  const canAdd = !!current && current.available;

  const onAdd = () => {
    if (current && canAdd) add(current.id);
  };

  const swatchStyle = (c: string): React.CSSProperties => {
    const hex = SWATCH[c.toLowerCase().replace(/\s+/g, "")];
    if (hex) return { backgroundColor: hex };
    const img = variants.find((v) => v.color === c && v.image)?.image;
    if (img) return { backgroundImage: "url(" + img + ")", backgroundSize: "cover" };
    return { backgroundColor: "#cccccc" };
  };

  const summary = [color, size].filter(Boolean).join(" · ");

  const addButton = (extra?: string) => (
    <button
      type="button"
      onClick={onAdd}
      disabled={!canAdd || busy}
      className={cx(
        "fc-color fc-label whitespace-nowrap border border-gold bg-gold px-6 py-4 text-ink hover:bg-gold-light disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-muted",
        extra
      )}
    >
      {canAdd ? "Add to Bag" : "Sold Out"}
    </button>
  );

  return (
    <div>
      {/* Price */}
      <p className="fc-label mt-4 text-text">${price.toFixed(2)}</p>

      <div className="mt-10 space-y-7">
        {/* Color swatches */}
        {hasColor && (
          <div>
            <p className="fc-label mb-3 text-muted">
              Color <span className="text-text">— {color}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {colors.map((c) => {
                const selected = c === color;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => chooseColor(c)}
                    aria-label={c}
                    title={c}
                    className={cx(
                      "h-8 w-8 rounded-full border border-border outline-none transition",
                      selected
                        ? "ring-2 ring-text ring-offset-2 ring-offset-bg"
                        : "hover:ring-1 hover:ring-muted hover:ring-offset-2 hover:ring-offset-bg"
                    )}
                    style={swatchStyle(c)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Size pills — flush button group, no grey background */}
        {hasSize && (
          <div>
            <p className="fc-label mb-3 text-muted">Size</p>
            <div className="flex flex-wrap">
              {sizes.map((s) => {
                const v = variantFor(color, s);
                const open = !!v?.available;
                const selected = s === size;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={!open}
                    onClick={() => setSize(s)}
                    className={cx(
                      "fc-color fc-label relative -ml-px -mt-px min-w-[3.25rem] border border-border px-4 py-3 text-center",
                      selected
                        ? "z-10 border-text bg-text text-bg"
                        : "bg-bg text-muted hover:text-text",
                      !open &&
                        "cursor-not-allowed text-muted/40 line-through hover:text-muted/40"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Inline add */}
        {addButton("w-full")}
      </div>

      {/* Floating add-to-bag — present the moment you land, always reachable */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 md:px-8">
          <div className="min-w-0">
            <p className="fc-label truncate text-text">{name}</p>
            <p className="fc-label truncate text-muted">
              {summary ? summary + " · " : ""}${price.toFixed(2)}
            </p>
          </div>
          {addButton()}
        </div>
      </div>
    </div>
  );
}
