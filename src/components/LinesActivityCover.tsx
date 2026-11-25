import { useEffect, useRef, useState } from 'react';

export function LinesActivityCover({
  title = '실선이랑 점선이랑',
  variant = 'lines',
}: {
  title?: string;
  variant?: 'lines' | 'puzzle' | 'transport';
}) {
  const root = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () =>
      setScale(Math.min(element.clientWidth, element.clientHeight) / 600);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  return (
    <span ref={root} className="lines-cover" aria-hidden="true">
      <span
        className="lines-cover__canvas"
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        {variant === 'puzzle' ? (
          <span className="lines-cover__oval lines-cover__oval--puzzle" />
        ) : (
          <img
            className="lines-cover__oval"
            src="/assets/lines-cover/76f16.svg"
            alt=""
          />
        )}
        <span className="lines-cover__mascot">
          <img src="/assets/design/badge-guide-f4942.png" alt="" />
        </span>
        <span className="lines-cover__title">{title}</span>
        {variant === 'lines' && (
          <span className="lines-cover__physical">
            <img src="/assets/lines-cover/c9369.svg" alt="" />
            <img
              className="lines-cover__glyph"
              src="/assets/lines-cover/bde5e.png"
              alt=""
            />
          </span>
        )}
        {variant === 'puzzle' && (
          <img
            className="lines-cover__art"
            src="/assets/design/activity-cover-art.png"
            alt=""
          />
        )}
        <span className="lines-cover__nature">
          <img src="/assets/lines-cover/8f9d5.svg" alt="" />
          <img
            className="lines-cover__glyph"
            src="/assets/lines-cover/c6265.png"
            alt=""
          />
        </span>
        <span className="lines-cover__age">
          <img src="/assets/lines-cover/d3912.svg" alt="" />
          <span>만 3세</span>
        </span>
      </span>
    </span>
  );
}
