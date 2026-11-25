import {
  createSocialAuthorization,
  safeReturnPath,
  socialLoginOrigin,
  isSocialProvider,
  providerNames,
  type SocialProvider,
} from "../services/social-auth";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { Icon } from "../components/Icon";
import { WireDialog } from "../components/WireDialog";
import {
  checkEmail,
  sendSignupCode,
  confirmSignupCode,
  login,
  signup,
} from "../services/auth";
import { useBack } from "../components/NavigationHistory";
import { useAuth } from "../context/AuthContext";

import { PasswordField } from "../components/PasswordField";

type Step =
  "entry" | "login" | "terms" | "password" | "verification" | "complete";

export function AuthPage() {
  const { establish } = useAuth();
  const navigate = useNavigate();
  const leave = useBack("/");
  const location = useLocation();
  const requestedPath: unknown =
    location.state?.from ||
    new URLSearchParams(location.search).get("returnTo");
  const returnPath = safeReturnPath(requestedPath);
  const initialSocial =
    new URLSearchParams(location.search).get("social") || "";
  const [socialProvider, setSocialProvider] = useState<SocialProvider | null>(
    isSocialProvider(initialSocial) ? initialSocial : null,
  );
  const [socialConsent, setSocialConsent] = useState([false, false, false]);
  function requestSocial(provider: SocialProvider) {
    try {
      const origin = socialLoginOrigin(window.location.origin);
      if (origin !== window.location.origin) {
        window.location.assign(
          origin +
            "/login?social=" +
            provider +
            "&returnTo=" +
            encodeURIComponent(returnPath),
        );
        return;
      }
      setSocialProvider(provider);
    } catch (cause) {
      setNotice(
        cause instanceof Error ? cause.message : "로그인 설정을 확인해 주세요.",
      );
    }
  }
  const [step, setStep] = useState<Step>("entry");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agreements, setAgreements] = useState([false, false, false, false]);
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [remaining, setRemaining] = useState(180);
  const [proof, setProof] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(
    typeof location.state?.notice === "string" ? location.state.notice : "",
  );
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setRemaining(
        Math.max(0, Math.ceil((expiresAt - performance.now()) / 1000)),
      );
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  async function issueCode() {
    const issued = await sendSignupCode(email);
    setVerificationId(issued.verification_id);
    setProof("");
    setExpiresAt(performance.now() + issued.expires_in_seconds * 1000);
    setCode("");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !valid) return;
    setBusy(true);
    setError("");
    try {
      if (step === "entry") {
        const identifier = email.trim();
        if (/^01\d{8,9}$/.test(identifier.replace(/-/g, ""))) {
          navigate(
            `/signup/identity?phone=${encodeURIComponent(identifier.replace(/-/g, ""))}`,
          );
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
          throw new Error("이메일을 확인해 주세요.");
        }
        const data = await checkEmail(identifier);
        setEmail(identifier.toLowerCase());
        setStep(data.registered ? "login" : "terms");
      } else if (step === "login") {
        await establish(await login(email, password));
        navigate(returnPath, { replace: true });
      } else if (step === "terms") {
        await issueCode();
        setStep("verification");
      } else if (step === "password") {
        if (password !== confirm)
          throw new Error("비밀번호가 일치하지 않아요.");
        if (
          !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password) ||
          new TextEncoder().encode(password).length > 72
        )
          throw new Error("영문과 숫자를 포함해 8자 이상 입력해 주세요.");
        if (!proof) throw new Error("이메일 인증을 먼저 완료해 주세요.");
        await establish(await signup(email, password, proof, agreements));
        setStep("complete");
      } else if (step === "verification") {
        let token = proof;
        if (!token) {
          const verified = await confirmSignupCode(verificationId, code);
          token = verified.verification_token;
          setProof(token);
        }
        setStep("password");
      }
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const valid =
    step === "entry"
      ? !!email.trim()
      : step === "terms"
        ? agreements.slice(0, 3).every(Boolean)
        : step === "password"
          ? !!password && !!confirm
          : step === "verification"
            ? !!proof || (/^\d{6}$/.test(code) && remaining > 0)
            : !!password;
  function back() {
    if (busy) return;
    setError("");
    if (step !== "password") setProof("");
    setStep(
      step === "verification"
        ? "terms"
        : step === "password"
          ? "verification"
          : "entry",
    );
  }
  const node = {
    entry: "122:1415",
    login: "122:1437",
    terms: "118:1666",
    password: "122:1586",
    verification: "191:4661",
    complete: "122:1685",
  }[step];
  return (
    <form
      className={`screen auth-spec club-auth club-auth--${step} ${step === "entry" ? "auth-entry" : ""}`}
      onSubmit={submit}
      noValidate
      data-figma-node={node}
    >
      {step !== "entry" && step !== "complete" && (
        <ScreenHeader
          title={step === "login" ? "로그인" : "회원가입"}
          onBack={back}
        />
      )}
      {step === "entry" ? (
        <div className="auth-entry-content reference-auth">
          <button
            type="button"
            className="icon-button auth-back"
            onClick={leave}
            aria-label="뒤로가기"
          >
            <Icon name="back" size={32} />
          </button>
          <div className="auth-intro">
            <img
              className="auth-brand-mascot"
              src="/assets/design/badge-guide-f4942.png"
              alt="위피클럽 캐릭터"
            />
            <h1 className="brand-wordmark">YIPPEE CLUB</h1>
            <p>집에서도 신나게 놀이해요!</p>
          </div>
          <div className="auth-social-stack">
            {(["google", "kakao"] as const).map((provider) => (
              <button
                type="button"
                className={`button social-button social-button--${provider}`}
                key={provider}
                onClick={() => requestSocial(provider)}
              >
                <span className="social-provider-mark" aria-hidden="true">
                  {provider === "google" ? (
                    <b>G</b>
                  ) : (
                    <img
                      src="/assets/design/social-kakaotalk.svg"
                      alt=""
                    />
                  )}
                </span>
                {providerNames[provider]}로 시작하기
              </button>
            ))}
          </div>
          <div className="auth-or">
            <span>또는</span>
          </div>
          <div className="auth-entry-fields">
            <label className="wire-field">
              휴대전화 또는 이메일
              <input
                type="text"
                inputMode="email"
                required
                aria-label="휴대전화 또는 이메일"
                aria-invalid={!!error}
                aria-describedby={error ? "auth-entry-error" : undefined}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="휴대전화 번호 또는 이메일 입력"
                autoComplete="email"
              />
            </label>
            {error && (
              <p id="auth-entry-error" className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button button--primary"
              disabled={busy || !valid}
            >
              시작하기
            </button>
          </div>
        </div>
      ) : step === "complete" ? (
        <>
          <div className="screen-content screen-content--center auth-result">
            <div className="auth-result-mark" aria-hidden="true" />
            <h2>가입이 완료되었어요!</h2>
            <p>
              아이 정보를 등록하면
              <br />꼭 맞는 활동지를 추천받을 수 있어요.
            </p>
          </div>
          <div className="screen-actions">
            <Link className="button button--primary" to="/signup/child" replace>
              아이 등록하기
            </Link>
            <Link className="button" to="/" replace>
              먼저 둘러보기
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="screen-content form-stack">
            {step === "login" && (
              <>
                <label className="wire-field">
                  이메일
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>
                <PasswordField
                  label="비밀번호"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                />
                <button
                  className="text-button"
                  type="button"
                  onClick={() => navigate("/password/reset")}
                >
                  비밀번호 찾기
                </button>
              </>
            )}
            {step === "terms" && (
              <>
                <h2>약관에 동의해 주세요</h2>
                <label className="checkbox-label info-panel">
                  <input
                    type="checkbox"
                    checked={agreements.every(Boolean)}
                    onChange={(event) =>
                      setAgreements(agreements.map(() => event.target.checked))
                    }
                  />
                  <strong>전체 동의</strong>
                </label>
                {[
                  "[필수] 서비스 이용약관",
                  "[필수] 개인정보 수집·이용 동의",
                  "[필수] 만 14세 이상입니다",
                  "[선택] 혜택·이벤트 알림 수신",
                ].map((label, index) => (
                  <div className="agreement-row" key={label}>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreements[index]}
                        onChange={(event) =>
                          setAgreements(
                            agreements.map((value, key) =>
                              key === index ? event.target.checked : value,
                            ),
                          )
                        }
                      />
                      {label}
                    </label>
                    {index !== 2 && (
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`${label} 보기`}
                        onClick={() =>
                          navigate(
                            index === 0
                              ? "/policies/terms"
                              : index === 1
                                ? "/policies/privacy"
                                : "/policies/marketing",
                          )
                        }
                      >
                        <Icon name="chevron" size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
            {step === "password" && (
              <>
                <h2>비밀번호를 만들어 주세요</h2>
                <PasswordField
                  label="비밀번호"
                  placeholder="영문, 숫자 포함 8자 이상"
                  value={password}
                  onChange={setPassword}
                />
                <PasswordField
                  label="비밀번호 확인"
                  placeholder="비밀번호 다시 입력"
                  value={confirm}
                  onChange={setConfirm}
                />
              </>
            )}
            {step === "verification" && (
              <>
                <label className="wire-field">
                  인증번호
                  <input
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="6자리 숫자"
                    autoComplete="one-time-code"
                  />
                </label>
                <div className="section-heading">
                  <p className="wire-note">
                    남은 시간{" "}
                    {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                    {String(remaining % 60).padStart(2, "0")}
                  </p>
                  <button
                    className="text-button"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void issueCode()
                        .catch((cause: Error) => setError(cause.message))
                        .finally(() => setBusy(false));
                    }}
                  >
                    다시 받기
                  </button>
                </div>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="screen-actions">
            <button
              className="button button--primary"
              disabled={busy || !valid}
            >
              {busy
                ? "처리 중…"
                : step === "login"
                  ? "로그인"
                  : step === "verification"
                    ? "확인"
                    : "다음"}
            </button>
          </div>
        </>
      )}
      {socialProvider && (
        <WireDialog
          title="소셜 로그인 약관 동의"
          className="social-consent-dialog"
          onClose={() => setSocialProvider(null)}
        >
          <div className="social-consent-heading"><h2>{providerNames[socialProvider]}로 시작하기</h2><button type="button" className="social-consent-close" aria-label="약관 동의 닫기" onClick={() => setSocialProvider(null)}>×</button></div>
          <p>계속하려면 필수 약관에 동의해 주세요.</p>
          <div className="social-consents">
            {[
              "서비스 이용약관 동의",
              "개인정보 수집·이용 동의",
              "만 14세 이상입니다",
            ].map((label, index) => (
              <div className="social-consent-row" key={label}><label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={socialConsent[index]}
                  onChange={(event) =>
                    setSocialConsent((previous) =>
                      previous.map((value, key) =>
                        key === index ? event.target.checked : value,
                      ),
                    )
                  }
                />
                <span>[필수] {label}</span></label>
                {index < 2 && (
                  <Link
                    to={index === 0 ? "/policies/terms" : "/policies/privacy"}
                  >
                    보기
                  </Link>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="button button--primary"
            disabled={!socialConsent.every(Boolean)}
            onClick={() => {
              try {
                window.location.assign(
                  createSocialAuthorization(socialProvider, returnPath, {
                    terms: socialConsent[0],
                    privacy: socialConsent[1],
                    age_over_14: socialConsent[2],
                  }),
                );
              } catch (cause) {
                setSocialProvider(null);
                setNotice(
                  cause instanceof Error
                    ? cause.message
                    : "로그인을 시작하지 못했습니다.",
                );
              }
            }}
          >
            동의하고 계속하기
          </button>
        </WireDialog>
      )}
      {notice && (
        <WireDialog title="로그인 안내" onClose={() => setNotice("")}>
          <h2>안내</h2>
          <p>{notice}</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setNotice("")}
          >
            확인
          </button>
        </WireDialog>
      )}
    </form>
  );
}
