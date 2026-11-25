const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const stage = path.join(root, ".pages-build");
const output = path.join(root, "out");
// 이 스크립트가 생성하는 두 디렉터리만 정리하며 원본 src나 실행 중인 개발 빌드는 건드리지 않습니다.
function clearGenerated(target, name) {
  if (
    path.resolve(target) !== path.join(root, name) ||
    path.dirname(target) !== root
  )
    throw new Error("Unexpected generated directory");
  fs.rmSync(target, { recursive: true, force: true });
}
const api =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yippeclub.com/api/v1";
if (
  !/^https:\/\//.test(api) ||
  !new URL(api).pathname.replace(/\/$/, "").endsWith("/api/v1")
)
  throw new Error("Pages 배포에는 HTTPS API 기본 주소가 필요합니다.");
clearGenerated(stage, ".pages-build");
fs.mkdirSync(stage, { recursive: true });
const dynamicRoute = path.join(root, "src", "app", "[...slug]");
fs.cpSync(path.join(root, "src"), path.join(stage, "src"), {
  recursive: true,
  filter: (source) => source !== dynamicRoute,
});
fs.cpSync(path.join(root, "public"), path.join(stage, "public"), {
  recursive: true,
});
for (const name of ["package.json", "tsconfig.json", "next.config.ts"])
  fs.copyFileSync(path.join(root, name), path.join(stage, name));
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  {
    cwd: stage,
    stdio: "inherit",
    env: {
      ...process.env,
      PAGES_STATIC_EXPORT: "true",
      YIPPEE_WORKSPACE_ROOT: root,
      NEXT_PUBLIC_API_BASE_URL: api,
      API_PROXY_TARGET: "",
    },
  },
);
if (result.status !== 0) process.exit(result.status || 1);
clearGenerated(output, "out");
fs.cpSync(path.join(stage, "out"), output, { recursive: true });
// Cloudflare Pages의 기본 SPA fallback을 사용합니다. 임의 활동지 ID와 OAuth 콜백도 index.html로 진입합니다.
const notFound = path.join(output, "404.html");
if (fs.existsSync(notFound)) fs.unlinkSync(notFound);
fs.writeFileSync(
  path.join(output, "_headers"),
  `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/auth/callback/*\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n/password/reset\n  Cache-Control: no-store\n  Referrer-Policy: no-referrer\n`,
);
console.log(
  "Cloudflare Pages artifact ready: out/ (customer only; HTTPS API: " +
    api +
    ")",
);
