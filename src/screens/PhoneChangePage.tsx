import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';

interface Challenge {
  id: string;
  expiresInSeconds: number;
}
export function PhoneChangePage({
  onSend,
  onConfirm,
}: {
  onSend?: (phone: string) => Promise<Challenge>;
  onConfirm?: (
    challengeId: string,
    code: string,
    phone: string,
  ) => Promise<void>;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<Challenge>();
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(false);
  useEffect(() => {
    if (!deadline) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [deadline]);
  async function send() {
    if (!onSend) {
      setNotice(true);
      return;
    }
    setBusy(true);
    setError('');
    setCode('');
    setChallenge(undefined);
    setDeadline(0);
    try {
      const next = await onSend(phone);
      setChallenge(next);
      setDeadline(Date.now() + next.expiresInSeconds * 1000);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirm() {
    if (!onConfirm || !challenge) {
      setNotice(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onConfirm(challenge.id, code, phone);
      navigate('/settings');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="screen wire-phone-change"
      data-figma-node={challenge ? '124:4193' : '124:4169'}
      onSubmit={(event) => {
        event.preventDefault();
        void (challenge ? confirm() : send());
      }}
    >
      <ScreenHeader
        title="휴대전화 번호 변경"
        backTo="/settings"
        onBack={
          challenge
            ? () => {
                setChallenge(undefined);
                setDeadline(0);
                setCode('');
                setError('');
              }
            : undefined
        }
      />
      <div className="screen-content">
        {challenge ? (
          <>
            <label className="wire-field">
              인증번호
              <input
                value={code}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="6자리 숫자"
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ''))
                }
              />
            </label>
            <div className="section-heading">
              <small className="wire-note">
                남은 시간 {String(Math.floor(remaining / 60)).padStart(2, '0')}:
                {String(remaining % 60).padStart(2, '0')}
              </small>
              <button
                className="text-button"
                type="button"
                disabled={busy}
                onClick={() => void send()}
              >
                다시 받기
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="wire-field">
              현재 번호
              <input
                type="tel"
                readOnly
                value={user?.phone || ''}
                placeholder="등록된 휴대전화 번호가 없어요"
              />
            </label>
            <label className="wire-field">
              새 번호
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={phone}
                maxLength={11}
                placeholder="010-0000-0000"
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, ''))
                }
              />
            </label>
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
          disabled={
            busy ||
            (challenge
              ? code.length !== 6 || remaining === 0
              : !/^010\d{8}$/.test(phone))
          }
        >
          {busy ? '확인 중…' : challenge ? '변경하기' : '인증번호 받기'}
        </button>
      </div>
      {notice && (
        <WireDialog
          title="휴대전화 번호 변경 안내"
          onClose={() => setNotice(false)}
        >
          <p>휴대전화 번호 변경 기능을 준비하고 있어요.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setNotice(false)}
          >
            확인
          </button>
        </WireDialog>
      )}
    </form>
  );
}
