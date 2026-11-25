import { apiRequest, type Tokens } from "../lib/api";

export const socialProviders = ["kakao", "naver", "google"] as const;
export type SocialProvider = (typeof socialProviders)[number];
export const providerNames: Record<SocialProvider, string> = {
  kakao: "카카오",
  naver: "네이버",
  google: "Google",
};
const clientIds: Record<SocialProvider, string> = {
  kakao:
    process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ||
    "8d7884e4822e3bd6861a2f8bd66da2ee",
  naver: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "PA5iB6jZfS2ma8AB_vbu",
  google:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "313959714230-7qi63oafdvepvbls54bi76dgh4uu3egl.apps.googleusercontent.com",
};
const endpoints: Record<SocialProvider, string> = {
  kakao: "https://kauth.kakao.com/oauth/authorize",
  naver: "https://nid.naver.com/oauth2.0/authorize",
  google: "https://accounts.google.com/o/oauth2/v2/auth",
};
const transactionKey = "yippee.oauth.transaction";
interface Transaction {
  provider: SocialProvider;
  state: string;
  redirectUri: string;
  returnPath: string;
  agreements: { terms: true; privacy: true; age_over_14: true };
  createdAt: number;
  consumed?: boolean;
}
export interface SocialResult extends Tokens {
  is_new_user: boolean;
  user: {
    id: number;
    email: string;
    name: string | null;
    nickname: string | null;
    phone: string | null;
  };
}
export function isSocialProvider(value: string): value is SocialProvider {
  return socialProviders.includes(value as SocialProvider);
}
export function safeReturnPath(path: unknown): string {
  return typeof path === "string" &&
    /^\/(?!\/)/.test(path) &&
    !/[\\\r\n]/.test(path) &&
    !/^\/(?:auth\/callback|login)(?:[/?#]|$)/.test(path)
    ? path
    : "/";
}
export function socialLoginOrigin(origin: string): string {
  const url = new URL(origin);
  if (
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.port === "3000" &&
    url.protocol === "http:"
  )
    return "http://localhost:3000";
  if (
    ["www.yippeclub.com", "yippeclub.com"].includes(url.hostname) &&
    url.protocol === "https:"
  )
    return "https://www.yippeclub.com";
  throw new Error(
    "소셜 로그인은 localhost:3000 또는 https://www.yippeclub.com에서 이용해 주세요.",
  );
}
export function createSocialAuthorization(
  provider: SocialProvider,
  returnPath: string,
  consent: { terms: boolean; privacy: boolean; age_over_14: boolean },
) {
  if (!consent.terms || !consent.privacy || !consent.age_over_14)
    throw new Error("필수 약관에 동의해 주세요.");
  const origin = socialLoginOrigin(window.location.origin);
  if (origin !== window.location.origin)
    throw new Error("등록된 로그인 주소로 이동한 뒤 다시 시도해 주세요.");
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const state = Array.from(random, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const redirectUri = `${origin}/auth/callback/${provider}`;
  const transaction: Transaction = {
    provider,
    state,
    redirectUri,
    returnPath: safeReturnPath(returnPath),
    agreements: { terms: true, privacy: true, age_over_14: true },
    createdAt: Date.now(),
  };
  sessionStorage.setItem(transactionKey, JSON.stringify(transaction));
  const url = new URL(endpoints[provider]);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientIds[provider]);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  if (provider === "google") url.searchParams.set("scope", "openid email");
  return url.toString();
}
// 동일 코드의 요청 Promise를 재사용해 StrictMode의 effect 재실행도 한 번만 교환합니다.
const exchanges = new Map<
  string,
  Promise<{ result: SocialResult; returnPath: string }>
>();
export function finishSocialLogin(provider: SocialProvider, query: string) {
  const params = new URLSearchParams(query);
  const code = params.get("code");
  const key = `${provider}:${code || params.get("state") || ""}`;
  const existing = exchanges.get(key);
  if (existing) return existing;
  const pending = (async () => {
    let transaction: Transaction | null = null;
    try {
      transaction = JSON.parse(
        sessionStorage.getItem(transactionKey) || "null",
      );
    } catch {
      /* 아래에서 잘못된 세션을 차단합니다. */
    }
    if (
      !transaction ||
      transaction.provider !== provider ||
      Date.now() - transaction.createdAt > 10 * 60 * 1000 ||
      transaction.createdAt > Date.now() ||
      params.get("state") !== transaction.state ||
      transaction.redirectUri !==
        `${window.location.origin}/auth/callback/${provider}` ||
      transaction.consumed
    )
      throw new Error(
        "로그인 요청이 만료되었거나 일치하지 않습니다. 로그인 화면에서 다시 시작해 주세요.",
      );
    if (params.has("error")) {
      sessionStorage.removeItem(transactionKey);
      throw new Error(
        "공급자 로그인이 취소되었거나 거절되었습니다. 다시 시작해 주세요.",
      );
    }
    if (!code)
      throw new Error("로그인 인증 코드가 없습니다. 다시 시작해 주세요.");
    transaction.consumed = true;
    sessionStorage.setItem(transactionKey, JSON.stringify(transaction));
    const result = await apiRequest<SocialResult>(`/auth/social/${provider}`, {
      method: "POST",
      body: JSON.stringify({
        authorization_code: code,
        redirect_uri: transaction.redirectUri,
        ...(provider === "naver" ? { state: transaction.state } : {}),
        agreements: transaction.agreements,
      }),
    });
    if (
      !result.access_token ||
      !result.refresh_token ||
      typeof result.is_new_user !== "boolean" ||
      !Number.isSafeInteger(result.user?.id)
    )
      throw new Error("소셜 로그인 응답 형식을 확인해 주세요.");
    sessionStorage.removeItem(transactionKey);
    return { result, returnPath: safeReturnPath(transaction.returnPath) };
  })();
  exchanges.set(key, pending);
  return pending;
}
