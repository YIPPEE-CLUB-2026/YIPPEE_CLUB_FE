import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { withdrawAccount } from '../services/profile';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  return (
    <div
      className="screen"
      data-figma-node={['122:1389', '122:1398', '122:1407'][step]}
    >
      <div className="onboarding-content">
        <Link className="text-button onboarding-skip" to="/login">
          건너뛰기
        </Link>
        <div className="onboarding-hero" />
        <h1>
          {step === 0 ? (
            <>
              우리 아이 맞춤 놀이를
              <br />
              원클릭으로 찾아요
            </>
          ) : step === 1 ? (
            <>
              프린트 한 장이면
              <br />
              놀이 준비 끝
            </>
          ) : (
            <>
              놀이 후 리뷰를 쓰면
              <br />
              배지를 획득해요
            </>
          )}
        </h1>
        <div className="onboarding-dots" aria-label={`${step + 1} / 3`}>
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              aria-label={`${index + 1}번 안내`}
              className={step === index ? 'is-selected' : ''}
              onClick={() => setStep(index)}
            />
          ))}
        </div>
      </div>
      <div className="screen-actions">
        {step === 2 ? (
          <Link className="button button--primary" to="/login">
            시작하기
          </Link>
        ) : (
          <button
            className="button button--primary"
            onClick={() => setStep(step + 1)}
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}

export function VersionPage() {
  return (
    <div className="screen" data-figma-node="124:4988">
      <ScreenHeader title="버전 정보" backTo="/settings" />
      <div className="screen-content version-content">
        <p>YIPPEE CLUB 웹 서비스</p>
        <p className="wire-note">웹사이트를 새로고침하면 배포된 화면을 확인할 수 있어요.</p>
      </div>
      <div className="screen-actions">
        <button className="button button--primary" disabled>
          최신 버전으로 업데이트
        </button>
      </div>
    </div>
  );
}

export function LicensesPage() {
  const [params, setParams] = useSearchParams();
  const selected = params.get('library') || '';
  return (
    <div
      className="screen"
      data-figma-node={selected ? '124:5041' : '124:5003'}
    >
      <ScreenHeader
        title={selected || '오픈소스 라이선스'}
        backTo="/settings"
        onBack={selected ? () => setParams({}) : undefined}
      />
      {!selected && (
        <div className="screen-content support-rows">
          {[
            'React',
            'React Router',
            'Pretendard',
            'HS집토끼체 Black',
            'Lalezar',
          ].map((name) => (
            <button
              className="menu-row"
              key={name}
              onClick={() => setParams({ library: name })}
            >
              {name}
              <Icon name="chevron" />
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="screen-content">
          <p>
            {selected === 'Lalezar' || selected === 'Pretendard'
              ? 'SIL Open Font License 1.1'
              : selected === 'HS집토끼체 Black'
                ? '제작자 배포 조건'
                : 'MIT License'}
          </p>
          {selected === 'Pretendard' && (
            <a
              className="text-link"
              href="/fonts/Pretendard-LICENSE.txt"
              target="_blank"
              rel="noreferrer"
            >
              라이선스 전문 보기
            </a>
          )}
          {selected === 'HS집토끼체 Black' && (
            <a
              className="text-link"
              href="https://blog.naver.com/hp0/222895286224"
              target="_blank"
              rel="noreferrer"
            >
              제작자 배포 안내
            </a>
          )}
          {selected === 'Lalezar' && (
            <a
              className="text-link"
              href="/assets/Lalezar-OFL.txt"
              target="_blank"
              rel="noreferrer"
            >
              라이선스 전문 보기
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function WithdrawPage() {
  const { clearSession } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(false);
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState(false);
  async function withdraw() {
    if (pending.current || !agreed) return;
    pending.current = true; setBusy(true); setError('');
    try { await withdrawAccount(); clearSession(); navigate('/login', { replace: true }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '탈퇴하지 못했어요. 다시 시도해 주세요.'); }
    finally { pending.current = false; setBusy(false); }
  }
  return (
    <div className="screen" data-figma-node="124:4593">
      <ScreenHeader title="회원탈퇴" backTo="/settings" />
      <div className="screen-content">
        <h2>탈퇴 전에 확인해 주세요</h2>
            <div className="info-panel">탈퇴하면 계정을 다시 사용할 수 없으며 구매한 활동지 이용 권한도 종료됩니다. 법령상 보존이 필요한 거래 기록은 해당 기간 동안 별도 보관됩니다.</div>
            <p className="body-copy">
              탈퇴하면 구매한 활동지와 기록을 더 볼 수 없어요.
            </p>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              위 내용을 확인했어요.
            </label>
      </div>
      <div className="screen-actions">
        <button
          className="button button--primary"
          disabled={busy || !agreed}
          onClick={() => setNotice(true)}
        >
          탈퇴하기
        </button>
      </div>
      {notice && (
        <WireDialog title="회원탈퇴 최종 확인" onClose={() => { if (!busy) setNotice(false); }}>
          <p>정말 탈퇴할까요? 계정과 이용 권한을 되돌릴 수 없습니다.</p>
          {error && <p role="alert">{error}</p>}
          <button
            className="button button--primary"
            disabled={busy}
            onClick={() => void withdraw()}
          >
            {busy ? '탈퇴 처리 중…' : '확인 후 탈퇴'}
          </button>
          <button className="button" disabled={busy} onClick={() => setNotice(false)}>취소</button>
        </WireDialog>
      )}
    </div>
  );
}

export function ReviewsPage() {
  const { activityId } = useParams();
  const [sort, setSort] = useState('최신순');
  const [notice, setNotice] = useState('');
  return (
    <div className="screen" data-figma-node="123:2888">
      <ScreenHeader title="리뷰" backTo={`/activities/${activityId}`} />
      <div className="screen-content">
        <div className="info-panel">
          <h1 style={{ fontWeight: 600 }}>★ 0.0</h1>
          <p className="wire-note" style={{ marginTop: 8 }}>
            리뷰 0개
          </p>
        </div>
        <div className="section-heading">
          <button className="filter-chip">
            사진 리뷰만
            <Icon name="down" size={16} />
          </button>
          <button
            className="filter-chip"
            onClick={() => setSort(sort === '최신순' ? '인기순' : '최신순')}
          >
            {sort}
            <Icon name="down" size={16} />
          </button>
        </div>
        {['도영이네', '내 리뷰'].map((name) => (
          <div className="section" key={name}>
            <div className="section-heading">
              <strong>{name}</strong>
              <small style={{ color: '#747474' }}>★★★★★</small>
            </div>
            <span className="skeleton-line" />
            <span className="skeleton-line" />
            <div className="section-heading">
              <button
                className="text-button"
                onClick={() => setNotice('리뷰 API가 아직 연결되지 않았어요.')}
              >
                {name === '내 리뷰' ? '삭제' : '신고'}
              </button>
              <button
                className="button button--small"
                onClick={() => setNotice('리뷰 API가 아직 연결되지 않았어요.')}
              >
                도움돼요 0
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="screen-actions">
        <Link
          className="button button--primary"
          to={`/activities/${activityId}/reviews/new`}
        >
          리뷰 쓰기
        </Link>
      </div>
      {notice && (
        <WireDialog title="리뷰 안내" onClose={() => setNotice('')}>
          <p>{notice}</p>
          <button className="button" onClick={() => setNotice('')}>
            확인
          </button>
        </WireDialog>
      )}
    </div>
  );
}
