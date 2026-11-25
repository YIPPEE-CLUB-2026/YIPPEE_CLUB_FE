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
  const js = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  new Function("exports", "require", js)(exports, (name) =>
    load(path.resolve(path.dirname(file), name + ".ts"), cache),
  );
  return exports;
}
const consent = { terms: true, privacy: true, age_over_14: true };
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
test("provider URLs contain encoded registered callbacks, random state, and Google scopes", () => {
  const social = load("src/services/social-auth.ts");
  for (const provider of ["kakao", "naver", "google"]) {
    const url = new URL(
      social.createSocialAuthorization(provider, "/saved", consent),
    );
    assert.equal(url.searchParams.get("response_type"), "code");
    assert.equal(
      url.searchParams.get("redirect_uri"),
      `http://localhost:3000/auth/callback/${provider}`,
    );
    assert.match(url.searchParams.get("state"), /^[a-f0-9]{64}$/);
    if (provider === "google")
      assert.equal(url.searchParams.get("scope"), "openid email");
  }
});
test("unregistered origins, missing consent, and external return URLs are rejected", () => {
  const social = load("src/services/social-auth.ts");
  assert.throws(() =>
    social.createSocialAuthorization("naver", "/", {
      ...consent,
      privacy: false,
    }),
  );
  assert.equal(sessionStorage.getItem("yippee.oauth.transaction"), null);
  assert.equal(social.safeReturnPath("//evil.example"), "/");
  assert.equal(social.safeReturnPath("/\\evil.example"), "/");
  assert.equal(social.safeReturnPath("/auth/callback/google"), "/");
  assert.equal(
    social.socialLoginOrigin("http://127.0.0.1:3000"),
    "http://localhost:3000",
  );
  assert.equal(
    social.socialLoginOrigin("https://yippeclub.com"),
    "https://www.yippeclub.com",
  );
  assert.throws(() => social.socialLoginOrigin("https://preview.pages.dev"));
});
test("naver state mismatch cannot reach the BE", async () => {
  const social = load("src/services/social-auth.ts");
  social.createSocialAuthorization("naver", "/", consent);
  global.fetch = () => {
    throw new Error("must not call server");
  };
  await assert.rejects(
    social.finishSocialLogin("naver", "?code=example&state=wrong"),
    /일치/,
  );
});
test("StrictMode-style concurrent callbacks exchange a code once and send the exact BE fields", async () => {
  const social = load("src/services/social-auth.ts");
  const url = new URL(
    social.createSocialAuthorization("naver", "/cart", consent),
  );
  const state = url.searchParams.get("state");
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    assert.equal(url, "/api/v1/auth/social/naver");
    assert.deepEqual(JSON.parse(options.body), {
      authorization_code: "one-use-code",
      redirect_uri: "http://localhost:3000/auth/callback/naver",
      state,
      agreements: consent,
    });
    return new Response(
      JSON.stringify({
        access_token: "access",
        refresh_token: "refresh",
        is_new_user: true,
        user: {
          id: 42,
          email: "sample@example.com",
          phone: "",
          name: "",
          nickname: "",
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  };
  const query = "?code=one-use-code&state=" + state;
  const first = social.finishSocialLogin("naver", query),
    second = social.finishSocialLogin("naver", query);
  assert.equal(first, second);
  const result = await first;
  await second;
  assert.equal(calls, 1);
  assert.equal(result.result.user.id, 42);
  assert.equal(result.returnPath, "/cart");
});
test("failed code exchanges are not retried after callback reload, and include request_id", async () => {
  const social = load("src/services/social-auth.ts");
  const url = new URL(social.createSocialAuthorization("google", "/", consent));
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify({
        code: "EMAIL_REQUIRED",
        message: "이메일 필요",
        details: {},
        request_id: "req_example",
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  };
  const query = "?code=used&state=" + url.searchParams.get("state");
  await assert.rejects(
    social.finishSocialLogin("google", query),
    (error) =>
      error.code === "EMAIL_REQUIRED" && error.requestId === "req_example",
  );
  const reloaded = load("src/services/social-auth.ts");
  await assert.rejects(reloaded.finishSocialLogin("google", query));
  assert.equal(calls, 1);
});
test("production media links follow the configured HTTPS API instead of the old HTTP host", () => {
  const previous = process.env.NEXT_PUBLIC_API_BASE_URL;
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.yippeclub.com/api/v1";
  try {
    const api = load("src/lib/api.ts");
    assert.equal(
      api.resolveApiFileUrl(
        "http://54.206.246.207:8080/api/v1/activities/7/files/pdf?token=example",
      ),
      "https://api.yippeclub.com/api/v1/activities/7/files/pdf?token=example",
    );
    assert.throws(() => api.resolveApiFileUrl("javascript:alert(1)"));
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = previous;
  }
});
