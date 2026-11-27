import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { useAuth } from "../context/AuthContext";

export function ParentRegistrationPage() {
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const hydrated = useRef<number | null>(null);
  const submitting = useRef(false);
  useEffect(() => {
    if (user && hydrated.current !== user.id) {
      setName(user.name || ""); setNickname(user.nickname || ""); hydrated.current = user.id;
    }
  }, [user]);
  const valid = !!name.trim() && /^[가-힣A-Za-z0-9 ]{2,10}$/.test(nickname.trim());
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    try {
      await saveProfile(name.trim(), nickname.trim());
      navigate("/signup/child", { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "정보를 저장하지 못했어요. 다시 시도해 주세요."); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <form className="screen auth-spec signup-profile parent-registration" onSubmit={submit} data-figma-node="860:5500">
    <ScreenHeader title="회원가입" hideBack />
    <div className="screen-content registration-content">
      <div className="registration-intro"><h2>부모님 정보를 알려주세요</h2><p>아이에게 맞는 놀이를 추천하고, 앱에서 부를 호칭으로 써요.</p></div>
      <label className="wire-field"><span>이름<span className="required">*</span></span><input autoComplete="name" required maxLength={100} value={name} disabled={busy} placeholder="이름을 입력해 주세요" onChange={event => setName(event.target.value)} /></label>
      <label className="wire-field"><span>닉네임<span className="required">*</span></span><input autoComplete="nickname" required minLength={2} maxLength={10} value={nickname} disabled={busy} placeholder="앱에서 불릴 이름을 입력해 주세요" aria-describedby="parent-nickname-help" onChange={event => setNickname(event.target.value)} /><small id="parent-nickname-help">2~10자, 한글·영문·숫자와 띄어쓰기</small></label>
      <label className="wire-field"><span>이메일</span><input type="email" readOnly value={user?.email || ""} autoComplete="email" /><small>가입한 계정의 이메일이 자동으로 들어가요.</small></label>
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
    <div className="screen-actions"><button className="button button--primary" disabled={busy || !valid || !user}>{busy ? "저장 중…" : "다음"}</button></div>
  </form>;
}
