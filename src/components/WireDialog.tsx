import { useEffect, useRef, type ReactNode } from 'react';

// 네이티브 dialog로 포커스 이동·Escape·배경 클릭을 한 곳에서 처리합니다.
export function WireDialog({
  title,
  children,
  onClose,
  sheet = false,
  draggable = false,
  dismissDisabled = false,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  sheet?: boolean;
  draggable?: boolean;
  dismissDisabled?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const drag = useRef<{ id: number; y: number; time: number; distance: number } | null>(null);
  const motion = useRef<Animation | null>(null);
  const closing = useRef(false);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function settleDrag(dismiss: boolean) {
    const dialog = ref.current;
    if (!dialog) return;
    const distance = drag.current?.distance || 0;
    drag.current = null;
    if (dismiss) closing.current = true;
    motion.current?.cancel();
    const animation = dialog.animate(
      [{ translate: `0 ${distance}px` }, { translate: dismiss ? '0 100%' : '0 0' }],
      { duration: reducedMotion() ? 0 : 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );
    motion.current = animation;
    void animation.finished.then(() => {
      if (dismiss) onClose();
      closing.current = false;
      dialog.style.translate = '';
      animation.cancel();
    }).catch(() => {});
  }
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    if (sheet && draggable && !reducedMotion()) {
      motion.current = dialog.animate(
        [{ translate: '0 100%' }, { translate: '0 0' }],
        { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
      );
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      motion.current?.cancel();
      dialog.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`${sheet ? 'wire-dialog wire-sheet' : 'wire-dialog wire-popup'} ${className}`}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      {sheet && (draggable ? <div
        className="sheet-drag-handle"
        onPointerDown={(event) => {
          if (dismissDisabled || closing.current || !event.isPrimary || event.button !== 0) return;
          motion.current?.cancel();
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { id: event.pointerId, y: event.clientY, time: performance.now(), distance: 0 };
        }}
        onPointerMove={(event) => {
          if (!drag.current || drag.current.id !== event.pointerId) return;
          drag.current.distance = Math.max(0, event.clientY - drag.current.y);
          if (ref.current) ref.current.style.translate = `0 ${drag.current.distance}px`;
        }}
        onPointerUp={(event) => {
          const gesture = drag.current;
          if (!gesture || gesture.id !== event.pointerId) return;
          const velocity = gesture.distance / Math.max(1, performance.now() - gesture.time);
          settleDrag(!dismissDisabled && (gesture.distance >= 80 || (gesture.distance >= 24 && velocity > 0.5)));
        }}
        onPointerCancel={() => { if (drag.current) settleDrag(false); }}
        onLostPointerCapture={() => { if (drag.current) settleDrag(false); }}
        aria-hidden="true"
      ><div className="sheet-handle" /></div> : <div className="sheet-handle" />)}
      {children}
    </dialog>
  );
}
