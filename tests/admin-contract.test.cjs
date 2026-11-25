const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function load(file, cache = new Map()) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const exports = {};
  cache.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) =>
    load(path.resolve(path.dirname(file), name + ".ts"), cache),
  );
  return exports;
}
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => {
  const storage = new Map();
  global.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  global.window = new EventTarget();
});
test("admin 403 revokes only the admin session and emits the admin access event", async () => {
  const api = load("apps/admin/src/lib/api.ts");
  sessionStorage.setItem("yippee.local.session", "customer-stays");
  api.saveTokens({ access_token: "not-admin", refresh_token: "admin-refresh" });
  let expired = false;
  window.addEventListener("yippee-admin:session-expired", () => {
    expired = true;
  });
  global.fetch = async () =>
    json({ code: "PERMISSION_DENIED", message: "권한 없음", details: {} }, 403);
  await assert.rejects(
    api.apiRequest("/admin/orders?page=1&page_size=1"),
    (error) => error.status === 403,
  );
  assert.equal(api.readTokens(), null);
  assert.equal(
    sessionStorage.getItem("yippee.local.session"),
    "customer-stays",
  );
  assert.equal(expired, true);
});
test("admin token refresh does not read or overwrite customer credentials", async () => {
  const api = load("apps/admin/src/lib/api.ts");
  sessionStorage.setItem(
    "yippee.local.session",
    JSON.stringify({
      access_token: "customer-access",
      refresh_token: "customer-refresh",
    }),
  );
  api.saveTokens({ access_token: "old-admin", refresh_token: "admin-refresh" });
  global.fetch = async (url, init) => {
    if (url.endsWith("/auth/token/refresh")) {
      assert.deepEqual(JSON.parse(init.body), {
        refresh_token: "admin-refresh",
      });
      return json({
        access_token: "new-admin",
        refresh_token: "admin-refresh",
      });
    }
    const bearer = new Headers(init.headers).get("Authorization");
    assert.notEqual(bearer, "Bearer customer-access");
    return bearer === "Bearer new-admin"
      ? json({ count: 0, results: [] })
      : json({}, 401);
  };
  assert.deepEqual(await api.apiRequest("/admin/orders"), {
    count: 0,
    results: [],
  });
  assert.equal(
    JSON.parse(sessionStorage.getItem("yippee.local.session")).access_token,
    "customer-access",
  );
});
test("multipart product upload preserves browser-generated boundary and includes admin bearer token", async () => {
  const api = load("apps/admin/src/lib/api.ts");
  api.saveTokens({ access_token: "admin", refresh_token: "refresh" });
  const form = new FormData();
  form.set("title", "테스트");
  form.set("categories", "4,9");
  form.set(
    "pdf",
    new Blob(["%PDF-1.7"], { type: "application/pdf" }),
    "test.pdf",
  );
  global.fetch = async (url, init) => {
    assert.equal(url, "/api/v1/admin/activities");
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Content-Type"), null);
    assert.equal(headers.get("Authorization"), "Bearer admin");
    assert.equal(init.body, form);
    return json({ id: 71, is_public: false }, 201);
  };
  const result = await api.apiRequest("/admin/activities", {
    method: "POST",
    body: form,
  });
  assert.equal(result.id, 71);
  assert.equal(result.is_public, false);
});
test("admin mutations use the spec request body, and refund 503 remains an error", async () => {
  const admin = load("apps/admin/src/lib/admin.ts");
  global.fetch = async (url, init) => {
    assert.equal(url, "/api/v1/admin/orders/refund-requests/7/reject");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(init.body), { note: "다운로드 기록 확인" });
    return json({ id: 7, status: "rejected" });
  };
  assert.equal(
    (
      await admin.post("/orders/refund-requests/7/reject", {
        note: "다운로드 기록 확인",
      })
    ).status,
    "rejected",
  );
  global.fetch = async () =>
    json(
      { code: "SERVICE_UNAVAILABLE", message: "확인 지연", details: {} },
      503,
    );
  await assert.rejects(
    admin.post("/orders/refund-requests/7/approve"),
    (error) => error.status === 503,
  );
});
