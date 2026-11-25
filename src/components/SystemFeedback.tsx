import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WireDialog } from './WireDialog';
import { Icon } from './Icon';

export function SystemFeedback() {
  const { sessionError, clearSession } = useAuth();
  const [offline, setOffline] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('offline', update);
    window.addEventListener('online', update);
    return () => {
      window.removeEventListener('offline', update);
      window.removeEventListener('online', update);
    };
  }, []);
  const expired = sessionError.includes('만료');
  const returnToLogin = () => {
    clearSession();
    navigate('/login', { replace: true, state: location.state });
  };
  return (
    <>
      {offline && (
        <div
          className="feedback-toast"
          data-figma-node="124:5214"
          role="status"
        >
          <Icon name="check" />
          오프라인 상태예요
        </div>
      )}
      {expired && (
        <WireDialog
          title="세션 만료"
          className="system-feedback"
          onClose={returnToLogin}
        >
          <h2>다시 로그인해 주세요</h2>
          <p>로그인 시간이 지났어요.</p>
          <button className="button button--primary" onClick={returnToLogin}>
            로그인
          </button>
        </WireDialog>
      )}
    </>
  );
}
