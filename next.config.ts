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

// Sentry configuration (optional - only enabled if auth token is present)
const sentryEnabled =
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT;

// Only wrap with Sentry if all required env vars are present
export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Suppresses source map uploading logs during build
      silent: !process.env.CI,

      // Organization and project (from env)
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,

      // Upload source maps for readable error traces
      widenClientFileUpload: true,

      // Route Sentry requests through a Next.js rewrite to avoid ad-blockers
      tunnelRoute: "/monitoring",

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,
    })
  : nextConfig;
