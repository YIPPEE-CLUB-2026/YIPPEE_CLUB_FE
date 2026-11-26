const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const admin = path.join(root, "apps", "admin");
const stage = path.join(admin, ".pages-build");
const output = path.join(admin, "out");
function clearGenerated(target, name) {
  if (path.resolve(target) !== path.join(admin, name) || path.dirname(target) !== admin)
    throw new Error("Unexpected admin output directory");
  fs.rmSync(target, { recursive: true, force: true });
}
const api = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.yippeclub.com/api/v1";
const apiUrl = new URL(api);
if (apiUrl.protocol !== "https:" || apiUrl.pathname.replace(/\/$/, "") !== "/api/v1" || apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password)
  throw new Error("Admin Pages requires an HTTPS /api/v1 base URL");
clearGenerated(stage, ".pages-build");
fs.mkdirSync(stage, { recursive: true });
fs.cpSync(path.join(admin, "src"), path.join(stage, "src"), { recursive: true });
fs.cpSync(path.join(admin, "public"), path.join(stage, "public"), {
  recursive: true,
  filter: source => path.basename(source) !== "ui-preview.html",
});
for (const file of ["package.json", "tsconfig.json", "next.config.ts"])
  fs.copyFileSync(path.join(admin, file), path.join(stage, file));
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next", {paths: [admin]}), "build"], {
  cwd: stage, stdio: "inherit", env: {...process.env, ADMIN_PAGES_EXPORT: "true", ADMIN_WORKSPACE_ROOT: admin,
    ADMIN_UI_PREVIEW: "false", NEXT_PUBLIC_ADMIN_UI_PREVIEW: "false", NEXT_PUBLIC_API_BASE_URL: api, API_PROXY_TARGET: ""},
});
if (result.status !== 0) process.exit(result.status || 1);
clearGenerated(output, "out");
fs.cpSync(path.join(stage, "out"), output, { recursive: true });
fs.writeFileSync(path.join(output, "_headers"), `/*\n  Cache-Control: no-store\n  X-Frame-Options: DENY\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  X-Robots-Tag: noindex, nofollow\n  Content-Security-Policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'\n`);
console.log("Admin Pages artifact ready: apps/admin/out (real authentication only)");
