import type { NextConfig } from "next";
import path from "node:path";

// 가상 로그인은 로컬 개발에서만 허용합니다.
const uiPreview = process.env.NODE_ENV === "development" && process.env.ADMIN_UI_PREVIEW === "true";
const config: NextConfig = {
  env: { NEXT_PUBLIC_ADMIN_UI_PREVIEW: uiPreview ? "true" : "false" },
  turbopack: { root: path.resolve(__dirname) },
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    if (uiPreview) return [];
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    return target
      ? [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }]
      : [];
  },
};
export default config;
