import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useChildren } from '../context/ChildrenContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from '../components/Icon';
import { WireDialog } from '../components/WireDialog';
import { LoginPrompt } from './ConnectedPages';
import { childAgeLabel } from '../lib/date';
import { ChildRegistrationPage } from './ChildRegistrationPage';
import { ScreenHeader } from '../components/ScreenHeader';

export function ChildrenPage() {
  const { user } = useAuth();
  const { children, loading, error, reload, remove } = useChildren();
  const [deleting, setDeleting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  return (
    <div
      className="screen wire-children"
      data-figma-node={
        children.length > 1
          ? '124:3891'
          : children.length
            ? '117:1240'
            : '124:3937'
      }
    >
      <ScreenHeader title="아이 정보" backTo="/profile" />
      {!user ? (
        <LoginPrompt />
      ) : loading ? (
        <div className="screen-content">
          <p role="status">불러오는 중…</p>
        </div>
      ) : error ? (
        <div className="screen-content">
          <p role="alert">{error}</p>
          <button type="button" onClick={() => void reload()}>
            다시 시도
          </button>
        </div>
      ) : children.length ? (
        <div className="screen-content">
          {children.map((child) => (
            <article className="child-info-card" key={child.id}>
              <div>
                <strong>{child.name}</strong>
                <small>{childAgeLabel(child.birth_date)}</small>
              </div>
              <Link
                className="icon-button"
                to={`/children/${child.id}/edit`}
                aria-label={`${child.name} 정보 수정`}
              >
                <Icon name="edit" />
              </Link>
              <button
                className="icon-button"
                aria-label={`${child.name} 삭제`}
                onClick={() => setDeleting(child.id)}
              >
                <Icon name="trash" />
              </button>
            </article>
          ))}
          <Link className="child-info-card" to="/children/new">
            <Icon name="plus" />
            <strong>아이 추가</strong>
          </Link>
          {children.length === 1 && (
            <section className="child-info-notes">
              <h2>안내 사항</h2>
              <p>12개월(만 1세)~72개월(만 5세)까지 이용할 수 있어요.</p>
            </section>
          )}
          {(failure || error) && (
            <p className="form-error" role="alert">
              {failure || error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="screen-content screen-content--center">
            <div className="empty-circle" />
            <h2>등록된 아이가 없어요</h2>
            <p>아이를 등록하면 맞춤 놀이를 찾아드려요.</p>
            {error && <p role="alert">{error}</p>}
          </div>
          <div className="screen-actions">
            <Link className="button button--primary" to="/children/new">
              아이 추가
            </Link>
          </div>
        </>
      )}
      {deleting !== null && (
        <WireDialog
          title="아이 삭제"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <h2>
            {children.find((child) => child.id === deleting)?.name} 정보를
            삭제할까요?
          </h2>
          <p>삭제하면 만세도감 기록도 함께 사라져요.</p>
          {failure && (
            <p className="form-error" role="alert">
              {failure}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              취소
            </button>
            <button
              className="button button--primary"
              disabled={busy}
              onClick={() => {
                if (busy) return;
                setBusy(true);
                setFailure('');
                void remove(deleting)
                  .then(() => setDeleting(null))
                  .catch((cause: Error) => setFailure(cause.message))
                  .finally(() => setBusy(false));
              }}
            >
              삭제
            </button>
          </div>
        </WireDialog>
      )}
    </div>
  );
}

export function ChildFormPage() {
  const { childId } = useParams();
  return <ChildRegistrationPage editId={childId} mode="add" />;
}
