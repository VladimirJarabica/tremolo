import type { NextConfig } from "next";

const securityHeaders = [
  // frame-ancestors 'none' equivalent for older clients that predate CSP.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    const base = [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];

    // HSTS only in production: dev runs over plain localhost, where the browser
    // would otherwise pin a broken-https expectation on 127.0.0.1.
    if (process.env.NODE_ENV === "production") {
      base[0].headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return base;
  },
};

export default nextConfig;
