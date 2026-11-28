import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export function DesktopFrame({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();
  useEffect(() => {
    viewport.current?.scrollTo(0, 0);
  }, [pathname, search]);
  return (
    <div className="desktop-frame">
      <aside className="desktop-brand" aria-label="YIPPEE CLUB 소개">
        <div className="desktop-brand__block">
          <p className="desktop-brand__slogan">어디서든 프린트 한 장으로</p>
          <img className="desktop-brand__logo" src="/assets/design/desktop-brand-logo.png" width="328" height="186" alt="YIPPEE CLUB" />
          <div className="desktop-brand__description">
            <strong>YIPPEECLUB 앱으로</strong>
            <p>간편하게 우리 아이 맞춤형 활동지를 찾아보세요.</p>
          </div>
        </div>
      </aside>
      <div className="desktop-app-region">
        <div className="desktop-app-scroll" ref={viewport}>
          {children}
        </div>
      </div>
    </div>
  );
}
