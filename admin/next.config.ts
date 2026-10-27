import type { NextConfig } from "next";

// Static export → Firebase Hosting (classiadshub-admin.web.app). The API is reached
// same-origin at /api/v1 through the Hosting → Cloud Functions rewrite.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
