import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { finishSocialLogin, isSocialProvider } from "../services/social-auth";
import { ScreenHeader } from "../components/ScreenHeader";

const messages: Record<string, string> = {
  AGREEMENTS_REQUIRED:
    "필수 약관에 동의한 뒤 소셜 로그인을 다시 시작해 주세요.",
  EMAIL_REQUIRED:
    "공급자 로그인에서 이메일 제공에 동의한 뒤 다시 시작해 주세요.",
  ALREADY_EXISTS:
    "같은 이메일로 가입한 계정이 있습니다. 이메일과 비밀번호로 로그인해 주세요.",
  RATE_LIMITED: "로그인 요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  SERVICE_UNAVAILABLE:
    "공급자 응답이 지연되거나 서버 설정을 확인해야 합니다. 잠시 후 소셜 로그인을 다시 시작해 주세요.",
};
export function SocialCallbackPage() {
  const { provider = "" } = useParams();
  const { search } = useLocation();
  const [query] = useState(search);
  const { establish } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [requestId, setRequestId] = useState("");
  useEffect(() => {
    let active = true;
    // 일회용 인가 코드는 화면 URL에 남기지 않습니다.
    window.history.replaceState(
      window.history.state,
      "",
      window.location.pathname,
    );
    if (!isSocialProvider(provider)) {
      setError("지원하지 않는 로그인 공급자입니다.");
      return;
    }
    finishSocialLogin(provider, query)
      .then(async ({ result, returnPath }) => {
        if (!active) return;
        await establish(result);
        if (active)
          navigate(result.is_new_user ? "/signup/parent" : returnPath, {
            replace: true,
          });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ApiError
            ? messages[cause.code] || cause.message
            : cause instanceof Error
              ? cause.message
              : "로그인을 완료하지 못했습니다.",
        );
        if (cause instanceof ApiError) setRequestId(cause.requestId || "");
      });
    return () => {
      active = false;
    };
  }, [provider, query]);
  return (
    <div className="screen">
      <ScreenHeader title="소셜 로그인" backTo="/login" />
      <div className="screen-content screen-content--center">
        <h2>{error ? "로그인을 완료하지 못했어요" : "로그인하고 있어요"}</h2>
        <p role={error ? "alert" : "status"}>
          {error || "잠시만 기다려 주세요."}
        </p>
        {requestId && <p className="wire-note">문의 번호: {requestId}</p>}
        {error && (
          <Link to="/login" replace className="button button--primary">
            로그인부터 다시 시작
          </Link>
        )}
      </div>
    </div>
  );
}
