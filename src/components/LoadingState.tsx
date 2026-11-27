export function LoadingState({
  label = '불러오고 있어요',
  inline = false,
}: {
  label?: string;
  inline?: boolean;
}) {
  return (
    <div
      className={`system-loading ${inline ? 'system-loading--inline' : 'screen'}`}
      data-figma-node="124:5285"
      role="status"
      aria-live="polite"
    >
      <div className="screen-content">
        <div className="loading-mascot" aria-hidden="true">
          <img src="/assets/design/badge-guide-f4942.png" alt="" />
        </div>
        <h2>{label}</h2>
        <p className="loading-caption">잠시만 기다려 주세요</p>
        <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
}
