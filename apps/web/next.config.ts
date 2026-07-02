import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()"
  }
] as const;

// Build targets:
//  - Vercel  → static export (`out/`), served as plain static files. The app is
//    a self-contained frontend on mock data, so no server runtime is required.
//    Security headers are applied by Vercel via the root `vercel.json`.
//  - Docker  → `standalone` server output for self-hosting.
//  - Local   → default (`next start` / `next dev`), with headers() active.
const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  output: isVercel ? "export" : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@certidz/ui"],
  // Static export has no image optimization server.
  images: { unoptimized: true },
  // headers() is not supported with `output: export`; on Vercel the same
  // headers are configured in vercel.json instead.
  ...(isVercel
    ? {}
    : {
        async headers() {
          return [{ source: "/(.*)", headers: [...securityHeaders] }];
        }
      })
};

export default nextConfig;
