/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Allow product photography from any https source during development.
      // Tighten this to your CDN / Shopify domain before production.
      { protocol: "https", hostname: "cdn.shopify.com" },
    ],
  },
  async redirects() {
    return [
      // Send the default Vercel URL to the real domain so nobody lands on
      // forward-collective.vercel.app. Preserves the path.
      {
        source: "/:path*",
        has: [{ type: "host", value: "forward-collective.vercel.app" }],
        destination: "https://forwardcollective.us/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
