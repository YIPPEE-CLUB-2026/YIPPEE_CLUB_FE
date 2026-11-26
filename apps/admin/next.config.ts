import type { NextConfig } from "next";
import path from "node:path";

// 가상 로그인은 로컬 개발에서만 허용합니다.
const uiPreview = process.env.NODE_ENV === "development" && process.env.ADMIN_UI_PREVIEW === "true";
const pages = process.env.ADMIN_PAGES_EXPORT === "true";
const workspaceRoot = process.env.ADMIN_WORKSPACE_ROOT || path.resolve(__dirname);
const config: NextConfig = {
  ...(pages ? { output: "export" as const } : {}),
  env: { NEXT_PUBLIC_ADMIN_UI_PREVIEW: uiPreview ? "true" : "false" },
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
  async headers() {
    if (pages) return [];
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
    if (uiPreview || pages) return [];
    const target = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
    return target
      ? [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }]
      : [];
  },
};
// 정적 Pages의 응답 헤더는 산출물 _headers에서 설정합니다.
if (pages) {
  delete config.headers;
  delete config.redirects;
  delete config.rewrites;
}
export default config;
