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
const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test('rental selection is identical in the server quote and created order', async () => {
  const payments = load('src/services/payments.ts');
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({url, body: JSON.parse(init.body)});
    return json(url.endsWith('/quote') ? {subtotal: 700, payable_amount: 700, unavailable_activity_ids: [], refund_notice: '안내'} : {order_id: 1, status: 'pending', amount: 700});
  };
  await payments.quoteOrder([7, 8], undefined, [7]);
  await payments.createOrder([7, 8], true, [7]);
  assert.deepEqual(calls[0], {url: '/api/v1/orders/quote', body: {activity_ids:[7,8], rental_activity_ids:[7]}});
  assert.deepEqual(calls[1].body, {activity_ids:[7,8], rental_activity_ids:[7], agreed_to_payment:true, agreed_to_refund_notice:true});
});

test('customer samples use the public image endpoint without requesting a downloadable PDF', async () => {
  const activities = load('src/services/activities.ts');
  const calls = [];
  global.fetch = async (url, init) => { calls.push([url, init.method || 'GET']); return json({preview_urls:['/api/v1/activities/7/previews/1?v=1']}); };
  assert.deepEqual(await activities.getActivityPreviews(7), ['/api/v1/activities/7/previews/1?v=1']);
  assert.deepEqual(calls, [['/api/v1/activities/7/preview', 'GET']]);
});

test('withdrawal uses the existing DELETE profile contract and propagates failure', async () => {
  const profile = load('src/services/profile.ts');
  const calls = [];
  global.fetch = async (url, init) => { calls.push([url, init.method, init.body]); return json({message:'탈퇴 완료'}); };
  await profile.withdrawAccount();
  assert.deepEqual(calls, [['/api/v1/users/me', 'DELETE', undefined]]);
  global.fetch = async () => json({message:'실패'}, 500);
  await assert.rejects(profile.withdrawAccount(), error => error.status === 500);
});

test('category aliases match customer tabs without changing unrelated categories', () => {
  const {categoryMatches} = load('src/lib/categories.ts');
  assert.equal(categoryMatches('숫자', '수학'), true);
  assert.equal(categoryMatches('역할', '역할 놀이'), true);
  assert.equal(categoryMatches('음악', '노래하고 춤추기'), true);
  assert.equal(categoryMatches('그림/색칠', '미술 놀이'), true);
  assert.equal(categoryMatches('영어', '한글'), false);
});
beforeEach(() => {
  const storage = new Map();
  global.sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  global.window = new EventTarget();
  window.location = { origin: "http://localhost:3000" };
});
test("401 renews the access token once for concurrent API calls, then retries with bearer token", async () => {
  const api = load("src/lib/api.ts");
  api.saveTokens({ access_token: "old", refresh_token: "refresh" });
  let refreshes = 0;
  global.fetch = async (url, init) => {
    if (url.endsWith("/auth/token/refresh")) {
      refreshes++;
      assert.deepEqual(JSON.parse(init.body), { refresh_token: "refresh" });
      return json({ access_token: "new", refresh_token: "refresh" });
    }
    return new Headers(init.headers).get("Authorization") === "Bearer new"
      ? json({ id: 21 })
      : json({ code: "AUTHENTICATION_REQUIRED" }, 401);
  };
  const results = await Promise.all([
    api.apiRequest("/users/me"),
    api.apiRequest("/users/me"),
  ]);
  assert.equal(refreshes, 1);
  assert.equal(results[0].id, 21);
});
test("invalid refresh clears the session and does not claim a successful login", async () => {
  const api = load("src/lib/api.ts");
  api.saveTokens({ access_token: "expired", refresh_token: "invalid" });
  let expired = false;
  window.addEventListener("yippee:session-expired", () => {
    expired = true;
  });
  global.fetch = async (url) =>
    json({}, url.endsWith("/auth/token/refresh") ? 400 : 401);
  await assert.rejects(api.apiRequest("/users/me"));
  assert.equal(api.readTokens(), null);
  assert.equal(expired, true);
});
test("catalog preserves BE IDs, rental prices, image and pdf URLs, without injecting demo rows", async () => {
  const service = load("src/services/activities.ts");
  const row = {
    id: 37,
    title: "서버 활동지",
    price: 1900,
    rental_price: 700,
    rental_days: 7,
    description: "",
    age_min_months: 36,
    age_max_months: 47,
    duration_min: 5,
    duration_max: 10,
    difficulty: "easy",
    categories: [99],
    image: "/image",
    pdf: "/pdf",
  };
  global.fetch = async (url) =>
    url.includes("activity-categories")
      ? json({ results: [{ id: 99, name: "미술" }] })
      : json({ count: 1, next: null, results: [row] });
  const result = await service.listActivities(new AbortController().signal);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 37);
  assert.deepEqual(result[0].categoryIds, [99]);
  assert.equal(result[0].rentalPrice, 700);
  assert.equal(result[0].pdf, "/pdf");
  global.fetch = async (url) =>
    url.includes("activity-categories")
      ? json({ results: [] })
      : json({ count: 0, next: null, results: [] });
  assert.deepEqual(
    await service.listActivities(new AbortController().signal),
    [],
  );
});
test("create and confirm orders send BE integer IDs and only fields allowed by the spec", async () => {
  const service = load("src/services/payments.ts");
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push([url, JSON.parse(init.body)]);
    return json({ order_id: 31, status: "paid", paid_amount: 1900 });
  };
  await service.createOrder([37], true);
  await service.confirmPayment(31, "payment-key", "ord_session");
  assert.deepEqual(calls[0][1], {
    activity_ids: [37],
    agreed_to_payment: true,
    agreed_to_refund_notice: true,
  });
  assert.deepEqual(calls[1][1], {
    order_id: 31,
    pg_payment_key: "payment-key",
    pg_order_id: "ord_session",
  });
  global.fetch = async () =>
    json({ code: "SERVICE_UNAVAILABLE", message: "확인 중" }, 503);
  await assert.rejects(
    service.confirmPayment(31, "payment-key", "ord_session"),
    (error) => error.status === 503,
  );
});
