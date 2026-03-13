import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Suppresses source map uploading logs during build
  silent: !process.env.CI,

  // Organization and project (from env)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps for readable error traces
  widenClientFileUpload: true,

  // Route Sentry requests through a Next.js rewrite to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Delete source maps after upload (don't expose to client)
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
