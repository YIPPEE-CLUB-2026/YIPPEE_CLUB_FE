import type { NextConfig } from "next";
import path from "node:path";

const pages = process.env.PAGES_STATIC_EXPORT === "true";
const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  ...(pages
    ? {
        output: "export" as const,
        images: { unoptimized: true },
        turbopack: {
          root: process.env.YIPPEE_WORKSPACE_ROOT || path.resolve("."),
        },
      }
    : {
        async headers() {
          return [
            {
              source: "/auth/callback/:provider",
              headers: [
                { key: "Referrer-Policy", value: "no-referrer" },
                { key: "Cache-Control", value: "no-store" },
              ],
            },
            {
              source: "/password/reset",
              headers: [
                { key: "Referrer-Policy", value: "no-referrer" },
                { key: "Cache-Control", value: "no-store" },
              ],
            },
          ];
        },
        async rewrites() {
          const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
          return target
            ? [
                {
                  source: "/api/v1/health",
                  destination: `${target}/api/v1/health/`,
                },
                {
                  source: "/api/v1/health/",
                  destination: `${target}/api/v1/health/`,
                },
                {
                  source: "/api/v1/:path*",
                  destination: `${target}/api/v1/:path*`,
                },
              ]
            : [];
        },
      }),
};
export default nextConfig;
