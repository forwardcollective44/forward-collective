"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCart, addLine, removeLine, getCart } from "./shopify";
import type { Cart } from "./shopify";

const COOKIE = "fc_cart";

function setCartCookie(id: string) {
  cookies().set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

// Current cart (or null). Used to seed the cart drawer on first paint.
export async function fetchCart(): Promise<Cart | null> {
  const cartId = cookies().get(COOKIE)?.value;
  if (!cartId) return null;
  return await getCart(cartId);
}

// Add a variant and return the updated cart so the drawer can show it
// immediately — no full-page navigation.
export async function addItemAction(merchandiseId: string): Promise<Cart | null> {
  if (!merchandiseId) return await fetchCart();

  const cartId = cookies().get(COOKIE)?.value;
  let cart = cartId ? await addLine(cartId, merchandiseId, 1) : null;
  if (!cart) cart = await createCart(merchandiseId, 1);
  if (cart?.id) setCartCookie(cart.id);
  return cart;
}

// Remove a line and return the updated cart.
export async function removeItemAction(lineId: string): Promise<Cart | null> {
  const cartId = cookies().get(COOKIE)?.value;
  if (cartId && lineId) {
    const cart = await removeLine(cartId, lineId);
    return cart ?? (await fetchCart());
  }
  return await fetchCart();
}

// --- Legacy form actions (kept for the standalone /cart page) ---------------

export async function addToCart(formData: FormData) {
  const merchandiseId = String(formData.get("merchandiseId") || "");
  if (!merchandiseId) return;

  const store = cookies();
  const cartId = store.get(COOKIE)?.value;

  let cart = cartId ? await addLine(cartId, merchandiseId, 1) : null;
  if (!cart) cart = await createCart(merchandiseId, 1);

  if (cart?.id) setCartCookie(cart.id);
  redirect("/cart");
}

export async function removeFromCart(formData: FormData) {
  const lineId = String(formData.get("lineId") || "");
  const store = cookies();
  const cartId = store.get(COOKIE)?.value;
  if (cartId && lineId) await removeLine(cartId, lineId);
  revalidatePath("/cart");
}
