"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  apiRequest,
  isUiPreview,
  ApiError,
  readTokens,
  saveTokens,
  type Tokens,
} from "../lib/api";
import { adminRequest, errorMessage, type User } from "../lib/admin";
import {
  Dashboard,
  Products,
  Categories,
  Orders,
  Refunds,
  Members,
  Downloads,
  FutureModule,
  Settings,
} from "./Sections";

const menus = [
  ["overview", "◫", "운영 대시보드", "OVERVIEW"],
  ["products", "▤", "학습지 관리", "콘텐츠"],
  ["categories", "⊞", "카테고리 관리", ""],
  ["downloads", "↓", "다운로드 · 발급 이력", ""],
  ["challenges", "◎", "도전과제 인증 검수", "검수"],
  ["orders", "▣", "주문 · 결제 관리", "운영"],
  ["refunds", "↶", "환불 요청", ""],
  ["members", "♧", "회원 관리", ""],
  ["support", "☷", "문의 · 프로모션", ""],
  ["settings", "⚙", "설정 · 연동 현황", "시스템"],
] as const;
type Section = (typeof menus)[number][0];

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={error ? "notice error" : "notice"}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
export function Empty({
  title = "아직 등록된 내역이 없습니다",
  description = "새로운 내역이 들어오면 여기에 표시됩니다.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty">
      <span aria-hidden="true">◇</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export default function AdminConsole() {
  const [gate, setGate] = useState<"loading" | "login" | "ready" | "error">(
    "loading",
  );
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [section, setSection] = useState<Section>("overview");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);
  async function verify() {
    setGate("loading");
    setError("");
    try {
      // 화면 표시 여부를 이메일이나 로컬 플래그로 판정하지 않습니다.
      await adminRequest("/orders?page=1&page_size=1");
      const profile = await apiRequest<User>("/users/me");
      setUser(profile);
      setGate("ready");
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        const tokens = readTokens();
        saveTokens(null);
        if (tokens)
          void apiRequest("/auth/logout", {
            method: "POST",
            body: JSON.stringify({ refresh_token: tokens.refresh_token }),
          }).catch(() => {});
        setError(
          cause.status === 403
            ? "관리자 권한이 없는 계정입니다. BE의 ADMIN_EMAILS에 등록된 계정으로 로그인하세요."
            : "로그인이 만료되었습니다. 다시 로그인하세요.",
        );
        setGate("login");
      } else {
        setError(errorMessage(cause));
        setGate("error");
      }
    }
  }
  useEffect(() => {
    const selectFromUrl = () => {
      const value = new URLSearchParams(location.search).get("view");
      setSection(menus.some(([key]) => key === value) ? value as Section : "overview");
    };
    selectFromUrl();
    window.addEventListener("popstate", selectFromUrl);
    const expire = () => {
      setUser(null);
      setGate("login");
      setError("로그인이 만료되었습니다. 다시 로그인하세요.");
    };
    window.addEventListener("yippee-admin:session-expired", expire);
    if (isUiPreview) setGate("login");
    else if (readTokens()) void verify();
    else setGate("login");
    return () => {
      window.removeEventListener("popstate", selectFromUrl);
      window.removeEventListener("yippee-admin:session-expired", expire);
    };
  }, []);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (isUiPreview) {
      setUser({ id: 0, email: "preview@example.com", name: "UI 미리보기", nickname: null, is_active: true, created_at: new Date().toISOString(), last_login_at: null });
      setGate("ready");
      return;
    }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const tokens = await apiRequest<Tokens>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: String(form.get("email")).trim().toLowerCase(),
          password: String(form.get("password")),
        }),
      });
      saveTokens(tokens);
      await verify();
    } catch (cause) {
      setError(errorMessage(cause));
      setGate("login");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    if (isUiPreview) {
      setUser(null);
      setGate("login");
      return;
    }
    const tokens = readTokens();
    saveTokens(null);
    setUser(null);
    setGate("login");
    if (tokens)
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      }).catch(() => {});
  }
  function navigate(next: Section) {
    setSection(next);
    setSidebar(false);
    window.history.pushState(null, "", `?view=${next}`);
  }
  if (gate !== "ready")
    return (
      <main className="auth-shell">
        <div className="auth-story">
          <a className="brand" href="/">
            YIPPEE<span>CLUB</span>
            <b>OPERATIONS</b>
          </a>
          <div>
            <span className="eyebrow">SMALL PLAY, BIG GROWTH.</span>
            <h1>
              작은 놀이를
              <br />큰 성장으로.
            </h1>
            <p>
              아이들의 즐거운 시작을 만드는
              <br />
              운영자들의 공간입니다.
            </p>
          </div>
          <span className="auth-orbit" aria-hidden="true">
            ✳
          </span>
          <p className="auth-foot">YIPPEE CLUB · 관리자 전용</p>
        </div>
        <div className="auth-form">
          <div className="auth-card">
            <span className="eyebrow">ADMIN CONSOLE</span>
            <h2>운영자 로그인</h2>
            <p>{isUiPreview ? "UI 확인 모드입니다. 아이디와 비밀번호에 아무 값이나 입력하세요." : "관리자 계정으로 서비스를 관리하세요."}</p>
            {error && <Notice error>{error}</Notice>}
            {gate === "loading" ? (
              <Notice>관리자 권한을 확인하고 있습니다…</Notice>
            ) : gate === "error" ? (
              <button onClick={() => void verify()}>다시 연결</button>
            ) : (
              <form onSubmit={login}>
                <label>
                  이메일
                  <input
                    type={isUiPreview ? "text" : "email"}
                    name="email"
                    autoComplete="username"
                    placeholder="admin@example.com"
                    required
                  />
                </label>
                <label>
                  비밀번호
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button className="primary full" disabled={busy}>
                  {busy ? "확인 중…" : "관리자 콘솔 시작하기 →"}
                </button>
              </form>
            )}
            <p className="auth-caption">
              {isUiPreview ? "외부 API 연결이 꺼져 있습니다. 목록은 빈 상태로 표시됩니다." : "서버에서 관리자 권한을 확인한 계정만 입장할 수 있습니다."}
              <br />
              고객용 앱의 로그인 상태와 별도로 관리됩니다.
            </p>
          </div>
        </div>
      </main>
    );
  const current = menus.find(([key]) => key === section)!;
  return (
    <div className="console">
      <aside className={`sidebar ${sidebar ? "is-open" : ""}`}>
        <a className="brand" href="/">
          YIPPEE<span>CLUB</span>
          <b>OPERATIONS</b>
        </a>
        <div className="workspace">
          <span className="workspace-mark">Y</span>
          <div>
            <strong>YIPPEE CLUB</strong>
            <small>운영 관리 워크스페이스</small>
          </div>
          <span className="live-dot" />
        </div>
        <nav aria-label="관리자 메뉴">
          {menus.map(([key, icon, label, group]) => (
            <div key={key}>
              {group && <p className="nav-group">{group}</p>}
              <button
                className={`nav-item ${section === key ? "active" : ""}`}
                aria-current={section === key ? "page" : undefined}
                onClick={() => navigate(key)}
              >
                <span aria-hidden="true">{icon}</span>
                {label}
                {["challenges", "support"].includes(key) && <small>준비</small>}
              </button>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="avatar">
            {(user?.name || user?.email || "A").slice(0, 1).toUpperCase()}
          </span>
          <div>
            <strong>{user?.name || "관리자"}</strong>
            <small>{user?.email}</small>
          </div>
          <button
            className="icon-button"
            title="로그아웃"
            aria-label="로그아웃"
            onClick={() => void logout()}
          >
            ↪
          </button>
        </div>
      </aside>
      {sidebar && (
        <button
          className="sidebar-shade"
          aria-label="메뉴 닫기"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="메뉴 열기"
              onClick={() => setSidebar(true)}
            >
              ☰
            </button>
            <span className="breadcrumb">
              워크스페이스 <b>/</b> {current[2]}
            </span>
          </div>
          <div className="topbar-right">
            <span className="connection">
              <i /> 관리자 권한 확인됨
            </span>
            <span className="topbar-date">
              {new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                dateStyle: "long",
              }).format(new Date())}
            </span>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">YIPPEE CLUB OPERATIONS</span>
              <h1>
                {current[2]}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {section === "overview"
                  ? "오늘의 운영 현황과 먼저 확인할 일을 살펴보세요."
                  : "정확한 기록으로, 더 좋은 놀이 경험을 만듭니다."}
              </p>
            </div>
            <button
              className="secondary"
              onClick={() => setRefresh((value) => value + 1)}
            >
              ↻ 새로고침
            </button>
          </div>
          <div key={`${section}:${refresh}`}>
            {section === "overview" ? (
              <Dashboard navigate={navigate} />
            ) : section === "products" ? (
              <Products />
            ) : section === "categories" ? (
              <Categories />
            ) : section === "orders" ? (
              <Orders />
            ) : section === "refunds" ? (
              <Refunds />
            ) : section === "members" ? (
              <Members />
            ) : section === "downloads" ? (
              <Downloads />
            ) : section === "settings" ? (
              <Settings />
            ) : (
              <FutureModule kind={section} />
            )}
          </div>
          <footer>
            YIPPEE CLUB 운영 콘솔
            <span>모든 시각은 한국 표준시(KST) 기준입니다.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
