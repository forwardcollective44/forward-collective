import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/signin", "/auth"],
    },
    sitemap: "https://forwardcollective.us/sitemap.xml",
  };
}
