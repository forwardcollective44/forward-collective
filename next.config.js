/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Allow product photography from any https source during development.
      // Tighten this to your CDN / Shopify domain before production.
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
