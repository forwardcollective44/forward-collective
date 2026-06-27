import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { CartProvider } from "@/components/cart/CartUI";
import EmailCapturePopup from "@/components/EmailCapturePopup";
import { fetchCart } from "@/lib/cart";
import {
  GoogleTagManagerHead,
  GoogleTagManagerNoScript,
} from "@/components/GoogleTagManager";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Forward Collective",
  description: "For The Collective. Keep Moving Forward.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cart = await fetchCart();
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <GoogleTagManagerHead />
      </head>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <GoogleTagManagerNoScript />
        <CartProvider initial={cart}>
          <Nav />
          {children}
          <EmailCapturePopup />
        </CartProvider>
      </body>
    </html>
  );
}
