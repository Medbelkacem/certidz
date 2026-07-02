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

const nextConfig: NextConfig = {
  // Standalone output powers the self-hosted Docker image. Vercel provides its
  // own build target, so skip it there (VERCEL=1 is set during Vercel builds).
  output: process.env.VERCEL ? undefined : "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@certidz/ui"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...securityHeaders]
      }
    ];
  }
};

export default nextConfig;
