import { useState } from 'react';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
import { showToast } from '../components/Toast';

export interface ClubNotification {
  id: string;
  tab: '공지' | '이벤트';
  category: string;
  title: string;
  read?: boolean;
}
export function NotificationsPage({
  notifications = [],
  onReadAll,
  onDelete,
}: {
  notifications?: ClubNotification[];
  onReadAll?: () => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<'공지' | '이벤트'>('공지');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rows = notifications.filter(
    (item) => item.tab === tab && !removed.includes(item.id),
  );
  const unread = rows.filter(
    (item) => !item.read && !readIds.includes(item.id),
  ).length;
  async function readAll() {
    if (!onReadAll) {
      setError('알림을 읽음으로 변경할 수 없어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onReadAll();
      setReadIds(notifications.map((item) => item.id));
      showToast('모든 알림을 읽었어요', '124:4960');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!onDelete) {
      setError('알림을 삭제할 수 없어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      for (const id of deleting) {
        await onDelete(id);
        setRemoved((current) => [...current, id]);
      }
      setDeleting([]);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="screen notification-center"
      data-figma-node={
        !rows.length ? '118:1603' : tab === '이벤트' ? '124:4938' : '118:1582'
      }
    >
      <ScreenHeader
        title="알림센터"
        backTo="/profile"
        right={
          rows.length > 1 ? (
            <button
              className="icon-button"
              aria-label="알림 전체 삭제"
              onClick={() => setDeleting(rows.map((item) => item.id))}
            >
              <Icon name="trash" />
            </button>
          ) : undefined
        }
      />
      <div className="screen-content">
        <div className="tabs" role="tablist" aria-label="알림 종류">
          {(['공지', '이벤트'] as const).map((value) => (
            <button
              key={value}
              role="tab"
              aria-selected={tab === value}
              className={tab === value ? 'is-selected' : ''}
              onClick={() => setTab(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {rows.length ? (
          <div
            role="tabpanel"
            aria-label={`${tab} 알림`}
            className="notification-center__list"
          >
            {unread > 0 && (
              <div className="section-heading">
                <small>새 알림 {unread}개</small>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => void readAll()}
                >
                  전체 읽음
                </button>
              </div>
            )}
            {rows.map((item) => (
              <article className="notification-card" key={item.id}>
                <div className="section-heading">
                  <small>{item.category}</small>
                  <button
                    className="icon-button"
                    disabled={busy}
                    aria-label={`${item.title} 알림 삭제`}
                    onClick={() => setDeleting([item.id])}
                  >
                    <Icon name="close" />
                  </button>
                </div>
                <p>{item.title}</p>
              </article>
            ))}
          </div>
        ) : (
          <div
            role="tabpanel"
            aria-label={`${tab} 알림`}
            className="notification-empty"
          >
            <div className="empty-circle" />
            <h2>새로운 알림이 없어요</h2>
          </div>
        )}
        {error && !deleting.length && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      {deleting.length > 0 && (
        <WireDialog
          title="알림 삭제"
          className="system-feedback"
          onClose={() => {
            if (!busy) setDeleting([]);
          }}
        >
          <h2>
            {deleting.length === rows.length
              ? '알림을 모두 지울까요?'
              : '알림을 지울까요?'}
          </h2>
          <p>삭제한 알림은 되돌릴 수 없어요.</p>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setDeleting([])}
            >
              취소
            </button>
            <button
              className="button button--primary"
              disabled={busy}
              onClick={() => void remove()}
            >
              삭제하기
            </button>
          </div>
        </WireDialog>
      )}
    </div>
  );
}
