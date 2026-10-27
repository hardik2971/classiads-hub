import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";

// Next.js metadata route → /robots.txt (static export)
export const dynamic = "force-static";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/checkout", "/login", "/register", "/verify-otp", "/forgot-password"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
