import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Forward Collective",
  description: "For The Collective. Keep Moving Forward.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
