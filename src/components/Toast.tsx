import { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ToastMessage {
  message: string;
  nodeId?: string;
  key: number;
}
export function showToast(message: string, nodeId?: string) {
  if (typeof window !== 'undefined')
    window.dispatchEvent(
      new CustomEvent('yippee:toast', { detail: { message, nodeId } }),
    );
}
export function ToastHost() {
  const [toast, setToast] = useState<ToastMessage>();
  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (typeof detail?.message === 'string')
        setToast({
          message: detail.message.slice(0, 200),
          nodeId: typeof detail.nodeId === 'string' ? detail.nodeId : undefined,
          key: Date.now(),
        });
    };
    window.addEventListener('yippee:toast', receive);
    return () => window.removeEventListener('yippee:toast', receive);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(undefined), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return toast ? (
    <div
      className="feedback-toast"
      role="status"
      aria-live="polite"
      data-figma-node={toast.nodeId}
    >
      <Icon name="check" />
      {toast.message}
    </div>
  ) : null;
}
