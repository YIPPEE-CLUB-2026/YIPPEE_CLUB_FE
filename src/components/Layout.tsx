import { useEffect, useState } from 'react';
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { WireDialog } from './WireDialog';
import { useAuth } from '../context/AuthContext';
import { useChildren } from '../context/ChildrenContext';
import { childAgeLabel } from '../lib/date';
import { showToast } from './Toast';

const navigation: { path: string; label: string; icon: IconName }[] = [
  { path: '/', label: '홈', icon: 'home' },
  { path: '/activities', label: '찾기', icon: 'explore' },
  { path: '/children', label: '아이 변경', icon: 'child' },
  { path: '/saved', label: '저장', icon: 'saved' },
  { path: '/profile', label: 'MY', icon: 'profile' },
];

const tabIcons: Partial<Record<IconName, string>> = {
  home: 'fd5c9',
  explore: '7ebd6',
  saved: 'd1ee9',
  profile: 'e32c9',
};

function ChildTabIcon() {
  return (
    <span className="nav-star" aria-hidden="true">
      <img
        className="nav-star__circle"
        src="/assets/bottom-nav/5e65a.svg"
        alt=""
      />
      <img
        className="nav-star__body"
        src="/assets/bottom-nav/5203f.svg"
        alt=""
      />
      <img
        className="nav-star__eye nav-star__eye--left"
        src="/assets/bottom-nav/9b6e7.svg"
        alt=""
      />
      <img
        className="nav-star__eye nav-star__eye--right"
        src="/assets/bottom-nav/9b6e7.svg"
        alt=""
      />
      <img
        className="nav-star__mouth"
        src="/assets/bottom-nav/96dc4.svg"
        alt=""
      />
    </span>
  );
}

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loginNotice, loginPromptOpen, requestLogin, dismissLogin } =
    useAuth();
  const { children, activeChild, select } = useChildren();
  const [switching, setSwitching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function chooseChild(id: number, name: string) {
    if (busy) return;
    if (activeChild?.id === id) {
      setSwitching(false);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await select(id);
      setSwitching(false);
      showToast(`${name} 어린이로 바꿨어요`, '124:4083');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const hasNav = [
    '/',
    '/activities',
    '/activities/popular',
    '/recommendations',
    '/search',
    '/search/results',
    '/saved',
    '/profile',
    '/guide',
    '/guides',
  ].includes(pathname);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!(document.activeElement instanceof HTMLInputElement))
      document.querySelector<HTMLElement>('#main-content')?.focus();
  }, [pathname]);
  return (
    <div className={`app-shell ${!hasNav ? 'app-shell--fullscreen' : ''}`}>
      <a className="skip-link" href="#main-content">
        본문으로 이동
      </a>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      {hasNav && (
        <nav className="bottom-nav bottom-nav--figma" aria-label="주요 메뉴">
          {navigation.map(({ path, label, icon }) =>
            icon === 'child' ? (
              <button
                key={path}
                className="nav-item nav-item--child"
                aria-label="아이 변경"
                aria-expanded={switching}
                aria-haspopup="dialog"
                onClick={() => {
                  if (!user) requestLogin();
                  else {
                    setError('');
                    setSwitching(true);
                  }
                }}
              >
                <span className="nav-item__icon">
                  <ChildTabIcon />
                </span>
                <span>{label}</span>
              </button>
            ) : (
              <NavLink
                key={path}
                to={path}
                replace
                onClick={(event) => {
                  if (
                    !user &&
                    ['/activities', '/saved', '/profile'].includes(path)
                  ) {
                    event.preventDefault();
                    requestLogin();
                  }
                }}
                end={path === '/'}
                className={({ isActive }) =>
                  `nav-item ${isActive || (path === '/activities' && pathname.startsWith('/search')) ? 'is-active' : ''}`
                }
              >
                <span className="nav-item__icon">
                  <img
                    src={`/assets/bottom-nav/${tabIcons[icon]}.svg?v=2`}
                    alt=""
                  />
                </span>
                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>
      )}
      {switching && (
        <WireDialog
          title="아이 전환"
          sheet
          className="child-switch-sheet"
          onClose={() => {
            if (!busy) setSwitching(false);
          }}
        >
          <div className="section-heading">
            <h2>어떤 아이와 놀까요?</h2>
            <button
              className="icon-button"
              aria-label="아이 전환 닫기"
              disabled={busy}
              onClick={() => setSwitching(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {children.length < 2 ? (
            <>
              {children.map((child) => (
                <button
                  key={child.id}
                  className="child-switch-row"
                  aria-pressed={activeChild?.id === child.id}
                  disabled={busy}
                  onClick={() => void chooseChild(child.id, child.name)}
                >
                  <span className="child-switch-avatar" />
                  <span>
                    <strong>{child.name}</strong>
                    <small>{childAgeLabel(child.birth_date)}</small>
                  </span>
                  {activeChild?.id === child.id && <Icon name="check" />}
                </button>
              ))}
              <Link
                className="child-switch-row"
                to="/children/new"
                onClick={() => setSwitching(false)}
              >
                <span className="child-switch-avatar child-switch-avatar--add" />
                <strong>아이 추가</strong>
                <Icon name="plus" />
              </Link>
            </>
          ) : (
            <>
              <div
                className="child-switch-radios"
                role="radiogroup"
                aria-label="놀이할 아이"
              >
                {children.map((child) => (
                  <label key={child.id}>
                    <span>
                      {child.name} ·{' '}
                      {childAgeLabel(child.birth_date).split(' · ')[0]}
                    </span>
                    <input
                      type="radio"
                      name="active-child"
                      checked={activeChild?.id === child.id}
                      disabled={busy}
                      onChange={() => void chooseChild(child.id, child.name)}
                    />
                  </label>
                ))}
              </div>
              <Link
                className="button"
                to="/children/new"
                onClick={() => setSwitching(false)}
              >
                아이 추가
              </Link>
            </>
          )}
        </WireDialog>
      )}
      {loginPromptOpen && (
        <WireDialog
          title="로그인 안내"
          className="login-gate"
          onClose={dismissLogin}
        >
          <p>
            서비스 이용은 회원만 가능해요.
            <br />
            로그인/회원가입을 하시겠어요?
          </p>
          <div className="dialog-actions">
            <button type="button" className="button" onClick={dismissLogin}>
              그냥 둘러볼래요
            </button>
            <button
              type="button"
              className="button button--accent"
              onClick={() => {
                dismissLogin();
                navigate('/login');
              }}
            >
              로그인 할래요!
            </button>
          </div>
        </WireDialog>
      )}
      {user && loginNotice && pathname === '/' && (
        <div className="login-toast" role="status">
          <img src="/assets/6005d.svg" alt="" />
          로그인 되었습니다.
        </div>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  back = false,
}: {
  title: string;
  back?: boolean;
}) {
  return (
    <header className="page-header">
      {back && (
        <Link className="icon-button" to="/" aria-label="홈으로 돌아가기">
          <Icon name="back" size={32} />
        </Link>
      )}
      <h1>{title}</h1>
      <div className="header-actions">
        <Link className="icon-button" to="/notifications" aria-label="알림">
          <Icon name="bell" />
        </Link>
        <Link className="icon-button" to="/cart" aria-label="장바구니">
          <Icon name="cart" />
        </Link>
      </div>
    </header>
  );
}
