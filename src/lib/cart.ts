"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCart, addLine, removeLine } from "./shopify";

const COOKIE = "fc_cart";

// Add a variant to the cart (called from the PDP form). Creates the cart on
// first add, otherwise appends a line. Stores the cart id in a cookie.
export async function addToCart(formData: FormData) {
  const merchandiseId = String(formData.get("merchandiseId") || "");
  if (!merchandiseId) return;

  const store = cookies();
  const cartId = store.get(COOKIE)?.value;

  let cart = cartId ? await addLine(cartId, merchandiseId, 1) : null;
  if (!cart) cart = await createCart(merchandiseId, 1);

  if (cart?.id) {
    store.set(COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  redirect("/cart");
}

export async function removeFromCart(formData: FormData) {
  const lineId = String(formData.get("lineId") || "");
  const store = cookies();
  const cartId = store.get(COOKIE)?.value;
  if (cartId && lineId) await removeLine(cartId, lineId);
  revalidatePath("/cart");
}
