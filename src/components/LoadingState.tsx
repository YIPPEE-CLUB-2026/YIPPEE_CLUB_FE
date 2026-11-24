export function LoadingState({
  label = '불러오고 있어요',
}: {
  label?: string;
}) {
  return (
    <div
      className="screen system-loading"
      data-figma-node="124:5285"
      role="status"
      aria-live="polite"
    >
      <div className="screen-content">
        <img className="system-loading__icon" src="/assets/594ba.svg" alt="" />
        <h2>{label}</h2>
      </div>
    </div>
  );
}
