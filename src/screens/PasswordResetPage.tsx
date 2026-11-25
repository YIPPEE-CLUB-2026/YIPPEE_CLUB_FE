import {
  requestPasswordReset,
  confirmPasswordReset,
  parseResetLink,
} from '../services/password-reset';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { passwordError } from '../services/profile';
import { ScreenHeader } from '../components/ScreenHeader';
import { readPreviewSession } from '../lib/preview-session';
import { PasswordField } from '../components/PasswordField';

export function PasswordResetPage() {
  const { hash } = useLocation();
  const [link, setLink] = useState<{
    mode: 'request' | 'confirm' | 'invalid';
    token: string;
  }>(() => parseResetLink(hash));
  const token = link.token;
  const setToken = (value: string) =>
    setLink((previous) => ({ ...previous, token: value }));
  const confirmMode = link.mode === 'confirm';
  const [invalid, setInvalid] = useState(link.mode === 'invalid');
  const { clearSession } = useAuth();
  const pending = useRef(false);
  useEffect(() => {
    if (hash && hash !== '#main-content') {
      const incoming = parseResetLink(hash);
      setLink(incoming);
      setInvalid(incoming.mode === 'invalid');
      setPassword('');
      setConfirm('');
      setMessage('');
      setError('');
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname + window.location.search,
      );
    }
  }, [hash]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || invalid || (confirmMode && !token)) return;
    setError('');
    setMessage('');
    if (readPreviewSession()) {
      setError('미리보기 로그아웃 후 실제 이메일로 진행해 주세요.');
      return;
    }
    const validation = confirmMode ? passwordError(password, confirm) : '';
    if (validation) {
      setError(validation);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      if (token) await confirmPasswordReset(token, password);
      else await requestPasswordReset(email);
      if (token) {
        clearSession();
        setToken('');
        setPassword('');
        setConfirm('');
      }
      setMessage(
        token
          ? '비밀번호를 재설정했어요. 다시 로그인해 주세요.'
          : '가입된 이메일이면 재설정 안내가 발송됩니다. 메일함을 확인해 주세요.',
      );
    } catch (cause) {
      if (
        confirmMode &&
        cause instanceof ApiError &&
        cause.status === 400 &&
        (cause.details?.reset_token || cause.message.includes('재설정 토큰'))
      ) {
        setInvalid(true);
        setToken('');
      }
      setError((cause as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (invalid)
    return (
      <div className="screen auth-spec" data-figma-node="191:4704">
        <div className="screen-content screen-content--center auth-result">
          <div className="auth-result-mark" aria-hidden="true" />
          <h2>재설정 링크가 만료되었어요</h2>
          <p>재설정 메일을 다시 받아 주세요.</p>
        </div>
        <div className="screen-actions">
          <Link className="button button--primary" to="/password/reset">
            재설정 메일 다시 받기
          </Link>
        </div>
      </div>
    );
  if (message && confirmMode)
    return (
      <div className="screen auth-spec">
        <div className="screen-content screen-content--center auth-result">
          <div className="auth-result-mark" aria-hidden="true" />
          <h2>비밀번호를 변경했어요</h2>
          <p role="status">다시 로그인해 주세요.</p>
        </div>
        <div className="screen-actions">
          <Link className="button button--primary" to="/login">
            로그인하기
          </Link>
        </div>
      </div>
    );
  return (
    <form
      className="screen auth-spec account-form--reset"
      onSubmit={submit}
      data-figma-node={confirmMode ? '122:1640' : '122:1611'}
    >
      <ScreenHeader
        title={confirmMode ? '비밀번호 재설정' : '비밀번호 찾기'}
        backTo="/login"
        hideBack={confirmMode}
      />
      <div className="screen-content form-stack">
        {confirmMode ? (
          <>
            <PasswordField
              label="새 비밀번호"
              value={password}
              onChange={setPassword}
              placeholder="영문, 숫자 포함 8자 이상"
              disabled={busy}
            />
            <PasswordField
              label="새 비밀번호 확인"
              value={confirm}
              onChange={setConfirm}
              placeholder="비밀번호 다시 입력"
              disabled={busy}
            />
          </>
        ) : (
          <>
            <h2>가입한 이메일을 입력해 주세요</h2>
            <label className="wire-field">
              이메일
              <input
                type="email"
                autoComplete="email"
                placeholder="example@email.com"
                required
                disabled={busy}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
      </div>
      <div className="screen-actions">
        <button
          className="button button--primary"
          disabled={
            busy || (confirmMode ? !password || !confirm : !email.trim())
          }
        >
          {busy ? '처리 중…' : confirmMode ? '변경하기' : '재설정 링크 받기'}
        </button>
      </div>
    </form>
  );
}
