import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Include font files in the serverless bundle (needed for PDF generation on Vercel)
  outputFileTracingIncludes: {
    "/api/cotizaciones": ["./src/lib/cotizador/fonts/**/*"],
    "/api/cotizaciones/preview": ["./src/lib/cotizador/fonts/**/*"],
    "/api/cotizaciones/\\[id\\]/regenerate": ["./src/lib/cotizador/fonts/**/*"],
  },
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
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy (CSP)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://www.gstatic.com https://maps.googleapis.com https://www.youtube.com https://matterport.com https://client.crisp.chat https://connect.facebook.net https://*.googletagmanager.com https://*.google-analytics.com https://*.datahq04.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://client.crisp.chat https://api.mapbox.com",
              "font-src 'self' https://fonts.gstatic.com https://client.crisp.chat data:",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "connect-src 'self' https://*.supabase.co https://*.google.com https://api.mapbox.com wss://*.supabase.co https://client.crisp.chat wss://client.relay.crisp.chat wss://stream.relay.crisp.chat https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.facebook.com https://*.facebook.net https://connect.facebook.net https://*.datahq04.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "frame-src 'self' blob: https://www.youtube.com https://matterport.com https://www.google.com https://game.crisp.chat https://iframe.videodelivery.net https:",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(process.env.NODE_ENV === "production"
                ? ["upgrade-insecure-requests"]
                : []),
            ]
              .join("; ")
              .replace(/\s+/g, " "),
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy (restrict browser features)
          {
            key: "Permissions-Policy",
            value: [
              "geolocation=()",
              "microphone=()",
              "camera=()",
              "payment=()",
              "usb=()",
              "interest-cohort=()",
            ].join(", "),
          },
          // Strict-Transport-Security (HSTS) - only for production HTTPS
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
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
    })
  : nextConfig;
