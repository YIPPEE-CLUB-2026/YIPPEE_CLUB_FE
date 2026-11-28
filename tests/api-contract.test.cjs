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

test('parent profile sends supported fields and validates the exact nickname rule', async () => {
  const profile = load('src/services/profile.ts');
  let body;
  global.fetch = async (url, init) => { assert.equal(url, '/api/v1/users/me'); assert.equal(init.method, 'PATCH'); body = JSON.parse(init.body); return json({id: 1, nickname:'도영 엄마', relation:'mother', age_group:null, profile_completed:true}); };
  const result = await profile.updateProfile(' 도영 ', ' 도영 엄마 ', {relation:'mother', age_group:null});
  assert.deepEqual(body, {name:'도영', nickname:'도영 엄마', relation:'mother', age_group:null});
  assert.equal(result.profile_completed, true);
  assert.equal(profile.validNickname('도영 엄마'), true);
  for (const value of ['도영  엄마', 'ㄱㄴ', 'a', '엄마!', '12345678901']) assert.equal(profile.validNickname(value), false);
});

test('order period uses Korean dates and clamps month-end without rolling into the next month', () => {
  const dates = load('src/lib/date.ts');
  assert.equal(dates.orderSinceDate(1, new Date('2026-03-31T12:00:00Z')), '2026-02-28');
  assert.equal(dates.orderSinceDate(3, new Date('2026-11-26T15:30:00Z')), '2026-08-27');
  assert.equal(dates.orderSinceDate(12, new Date('2024-02-29T04:00:00Z')), '2023-02-28');
});

test('orders forward since and map server payment timestamps and methods without fabricating a payment', async () => {
  const orders = load('src/services/orders.ts');
  const dates = load('src/lib/date.ts');
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    if (url.includes('?')) return json({count:1, results:[{order_id:31}]});
    return json({id:31, status:'refunded', total_amount:1900, items:[], created_at:'2026-11-24T14:00:00Z', paid_at:'2026-11-24T15:01:00Z', refunded_at:'2026-11-26T01:00:00Z', payment_method:'toss', refund_request:null});
  };
  const [order] = await orders.listOrders(undefined, '2026-08-27');
  assert.equal(calls[0], '/api/v1/orders?page=1&page_size=100&since=2026-08-27');
  assert.equal(order.date, dates.formatServerDateTime('2026-11-24T15:01:00Z'));
  assert.equal(order.method, '토스페이먼츠');
  assert.equal(order.refundedAt, '2026-11-26T01:00:00Z');
  global.fetch = async () => json({id:32, status:'pending', total_amount:1900, items:[], paid_at:null, payment_method:null});
  const pending = await orders.getOrder('32');
  assert.equal(pending.date, '결제 전');
  assert.equal(pending.method, '결제 전');
});

test('favorites read every page rather than silently truncating after the first response', async () => {
  const service = load('src/services/activities.ts');
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    return json(url.includes('page=1&') ? {count:3,results:[{id:1},{id:2}]} : {count:3,results:[{id:3}]});
  };
  assert.deepEqual(await service.listFavoriteIds(), [1,2,3]);
  assert.deepEqual(calls, ['/api/v1/favorites?page=1&page_size=100','/api/v1/favorites?page=2&page_size=100']);
});

test('catalog forwards keyword, alias category, filters, sorting and pagination to the server', async () => {
  const service = load('src/services/activities.ts');
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    if (url.includes('activity-categories')) return json({results:[{id:14,name:'수학'}]});
    return json({count:0,results:[],next:null});
  };
  await service.queryActivities({age:'3',duration:'20-plus',difficulty:'normal',price:'2000',sort:'price_asc',domain:''}, ' 공룡 ', '숫자', 2);
  assert.equal(calls.length, 2);
  const query = new URL(calls[1], 'https://test.local').searchParams;
  assert.deepEqual(Object.fromEntries(query), {page:'2',page_size:'20',sort:'price_asc',q:'공룡',category:'14',age_years:'3',duration:'20-65535',difficulty:'normal',price_max:'2000'});
  calls.length = 0;
  await service.queryActivities({age:'',duration:'',difficulty:'',price:'',sort:'latest',domain:''}, '', '없는 분류', 1);
  assert.equal(calls.length, 1);
});

test('recommendation month age uses the Korean date at UTC midnight boundaries', () => {
  const dates = load('src/lib/date.ts');
  const recommendations = load('src/lib/recommendations.ts');
  const now = new Date('2026-11-27T15:01:00Z');
  assert.equal(dates.childAgeMonths('2023-11-28', now), 36);
  const items = [{id:1,ageMinMonths:36,ageMaxMonths:36,categoryIds:[]}];
  assert.deepEqual(recommendations.recommendActivities(items, {birth_date:'2023-11-28',interests:[]}, now).map(item=>item.id), [1]);
});

test('order lists share image requests across orders and do not fetch category data for thumbnails', async () => {
  const orders = load('src/services/orders.ts');
  const calls = [];
  global.fetch = async url => {
    calls.push(url);
    if (url.startsWith('/api/v1/orders?')) return json({count:2,results:[{order_id:1},{order_id:2}]});
    if (url.startsWith('/api/v1/activities/7')) return json({image:'/api/v1/activities/7/files/image'});
    return json({id:Number(url.split('/').pop()),status:'paid',total_amount:100,items:[{activity_id:7,title:'구매 당시 제목',price:100,plan:'permanent'}],payment_method:'toss',paid_at:'2026-11-27T00:00:00Z',refund_request:null});
  };
  const result = await orders.listOrders();
  assert.equal(result.length, 2);
  assert.equal(result[0].items[0].title, '구매 당시 제목');
  assert.equal(calls.filter(url=>url === '/api/v1/activities/7').length, 1);
  assert.equal(calls.some(url=>url.includes('activity-categories')), false);
});
