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

// metadataBase + the title template mean every child page can set just its
// own `title` (e.g. "The Collective") and Next.js renders it as
// "The Collective | Forward Collective" automatically. Pages that don't set
// their own metadata fall back to the values below.
export const metadata: Metadata = {
  metadataBase: new URL("https://forwardcollective.us"),
  title: {
    default: "Forward Collective | Streetwear Staples & Members-Only Drops",
    template: "%s | Forward Collective",
  },
  description:
    "Shop Forward Collective's core tees, hoodies, and sweatpants. Join The Collective free to earn points on every order and unlock early access to new drops.",
  openGraph: {
    siteName: "Forward Collective",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
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
