import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { changePassword, passwordError } from '../services/profile';

export function PasswordChangePage({
  socialAccount = false,
}: {
  socialAccount?: boolean;
}) {
  const { isPreview, clearSession } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(['', '', '']);
  const [visible, setVisible] = useState([false, false, false]);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    setError('');
    if (isPreview) {
      setError(
        '미리보기에서는 비밀번호를 변경할 수 없어요. 실제 계정으로 로그인해 주세요.',
      );
      return;
    }
    const validation = passwordError(values[1], values[2]);
    if (!values[0] || validation) {
      setError(validation || '현재 비밀번호를 입력해 주세요.');
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      await changePassword(values[0], values[1]);
      setValues(['', '', '']);
      clearSession();
      navigate('/password/changed', {
        replace: true,
        state: {
          confirmed: true,
        },
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : '비밀번호를 변경하지 못했어요.',
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (socialAccount)
    return (
      <div className="screen" data-figma-node="124:4281">
        <ScreenHeader title="비밀번호 변경" backTo="/settings" />
        <div className="screen-content screen-content--center">
          <div className="empty-circle" />
          <h2>소셜 계정으로 가입했어요</h2>
          <p>비밀번호는 가입한 서비스에서 관리해 주세요.</p>
        </div>
      </div>
    );
  return (
    <form
      className="screen account-form--password"
      data-figma-node={error ? '124:4244' : '124:4216'}
      onSubmit={submit}
    >
      <ScreenHeader title="비밀번호 변경" backTo="/settings" />
      <div className="screen-content form-stack">
        {['현재 비밀번호', '새 비밀번호', '새 비밀번호 확인'].map(
          (label, index) => (
            <label className="wire-field" key={label}>
              <span>{label}</span>
              <span className="wire-field__password">
                <input
                  aria-label={label}
                  type={visible[index] ? 'text' : 'password'}
                  autoComplete={
                    index === 0 ? 'current-password' : 'new-password'
                  }
                  required
                  maxLength={128}
                  disabled={busy}
                  value={values[index]}
                  aria-invalid={!!error}
                  placeholder={index === 1 ? '영문, 숫자 포함 8자 이상' : label}
                  onChange={(event) =>
                    setValues(
                      values.map((value, key) =>
                        key === index ? event.target.value : value,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`${label} ${visible[index] ? '숨기기' : '표시'}`}
                  onClick={() =>
                    setVisible(
                      visible.map((value, key) =>
                        key === index ? !value : value,
                      ),
                    )
                  }
                >
                  <Icon name="eye" />
                </button>
              </span>
            </label>
          ),
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
          disabled={busy || values.some((value) => !value)}
        >
          {busy ? '변경 중…' : '변경하기'}
        </button>
      </div>
    </form>
  );
}

export function PasswordChangedPage() {
  const { state } = useLocation();
  if (!state?.confirmed) return <Navigate to="/login" replace />;
  return (
    <div className="screen password-change-result" data-figma-node="124:4274">
      <div className="screen-content screen-content--center">
        <div className="empty-circle" />
        <h2>비밀번호를 바꿨어요</h2>
      </div>
      <div className="screen-actions">
        <Link className="button button--primary" to="/login" replace>
          확인
        </Link>
      </div>
    </div>
  );
}
