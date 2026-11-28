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

test('preview APIs preserve image order, multipart auth, and return deleted state', async () => {
  const cache = new Map();
  const api = load('apps/admin/src/lib/api.ts', cache);
  const previews = load('apps/admin/src/lib/previews.ts', cache);
  api.saveTokens({ access_token: 'admin', refresh_token: 'refresh' });
  const files = [new File(['second'], 'second.png', {type: 'image/png'}), new File(['first'], 'first.webp', {type: 'image/webp'})];
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push([url, init.method || 'GET']);
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer admin');
    if (init.method === 'POST') {
      assert.equal(new Headers(init.headers).get('Content-Type'), null);
      assert.deepEqual(init.body.getAll('previews').map(file => file.name), ['second.png', 'first.webp']);
      return json({preview_urls: ['/two.webp', '/one.png']});
    }
    return init.method === 'DELETE' ? json({preview_urls: []}) : json({admin_preview_urls: ['/existing.png']});
  };
  assert.deepEqual((await previews.getActivityPreviews(7)).preview_urls, ['/existing.png']);
  assert.equal((await previews.replaceActivityPreviews(7, files)).preview_urls.length, 2);
  assert.deepEqual((await previews.deleteActivityPreviews(7)).preview_urls, []);
  assert.deepEqual(calls, [['/api/v1/admin/activities/7', 'GET'], ['/api/v1/admin/activities/7/previews', 'POST'], ['/api/v1/admin/activities/7/previews', 'DELETE']]);
});

test('invalid preview uploads never reach the server; failed upload is not success', async () => {
  const previews = load('apps/admin/src/lib/previews.ts');
  let calls = 0;
  global.fetch = async () => { calls++; return json({message: '업로드 실패'}, 500); };
  const valid = new File(['image'], 'page.png', {type: 'image/png'});
  for (const files of [[], Array(6).fill(valid), [new File(['pdf'], 'x.pdf', {type:'application/pdf'})], [new File([], 'empty.png', {type:'image/png'})], [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', {type:'image/png'})]]) {
    assert.throws(() => previews.replaceActivityPreviews(7, files));
  }
  assert.equal(calls, 0);
  await assert.rejects(previews.replaceActivityPreviews(7, [valid]), error => error.status === 500);
  assert.equal(calls, 1);
});

test("sales sends exact unit/date formats and retains refund-only negative net amounts", async () => {
  const reporting = load("apps/admin/src/lib/reporting.ts");
  const urls = [];
  global.fetch = async url => {
    urls.push(String(url));
    return json({ unit: "day", date: "2026-11-25", timezone: "Asia/Seoul", paid_amount: 0, refund_amount: 2900, net_amount: -2900, paid_count: 0, refund_count: 1, buckets: [{ key: 0, paid_amount: 0, refund_amount: 2900, net_amount: -2900 }] });
  };
  const result = await reporting.getSales("day", "2026-11-25");
  await reporting.getSales("month", "2026-11-25");
  await reporting.getSales("year", "2026-11-25");
  assert.deepEqual(urls, ["/api/v1/admin/sales?unit=day&date=2026-11-25", "/api/v1/admin/sales?unit=month&date=2026-11", "/api/v1/admin/sales?unit=year&date=2026"]);
  assert.equal(result.buckets[0].net_amount, -2900);
});

test("issuance search encodes exact codes and preserves nullable order and download fields", async () => {
  const reporting = load("apps/admin/src/lib/reporting.ts");
  const urls = [];
  global.fetch = async url => {
    urls.push(String(url));
    return json({ count: 1, results: [{ id: 5, issuance_code: "W0007-K7WX-9M4R-Q2TV", right: "free", order_id: null, last_downloaded_at: null }] });
  };
  const result = await reporting.getIssuances({code: " W0007-K7WX-9M4R-Q2TV ", user_id: "12", activity_id: "7", page: 2});
  assert.equal(urls[0], "/api/v1/admin/worksheet-issuances?page=2&page_size=20&code=W0007-K7WX-9M4R-Q2TV&user_id=12&activity_id=7");
  assert.equal(result.results[0].order_id, null);
  assert.equal(result.results[0].last_downloaded_at, null);
  await reporting.getIssuance(5);
  assert.equal(urls[1], "/api/v1/admin/worksheet-issuances/5");
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

test('private admin file requests include bearer authentication and preserve binary content', async () => {
  const api = load('apps/admin/src/lib/api.ts');
  api.saveTokens({access_token:'admin', refresh_token:'refresh'});
  global.fetch = async (url, init) => {
    assert.equal(url, '/api/v1/admin/activities/7/files/pdf');
    assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer admin');
    assert.equal('responseType' in init, false);
    return new Response('pdf bytes', {headers:{'Content-Type':'application/pdf'}});
  };
  const blob = await api.apiRequest('/admin/activities/7/files/pdf', {responseType:'blob'});
  assert.equal(blob.type, 'application/pdf');
  assert.equal(await blob.text(), 'pdf bytes');
  global.fetch = async () => json({message:'권한 없음'}, 403);
  await assert.rejects(api.apiRequest('/admin/activities/7/files/pdf', {responseType:'blob'}), error => error.status === 403);
});
