import type { NextConfig } from "next";

// Static export → Firebase Hosting (classiadshub.web.app). Dynamic routes are served
// through Hosting rewrites to their `_` placeholder page (see firebase.json).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
