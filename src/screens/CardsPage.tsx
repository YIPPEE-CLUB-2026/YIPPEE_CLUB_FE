import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';

export interface PaymentCard {
  id: string;
  last4: string;
  isDefault?: boolean;
}
export function CardsPage({
  cards = [],
  onDelete,
  onSetDefault,
}: {
  cards?: PaymentCard[];
  onDelete?: (id: string) => Promise<void>;
  onSetDefault?: (id: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function update(
    action: ((id: string) => Promise<void>) | undefined,
    id: string,
  ) {
    if (!action) {
      setError('카드 정보를 변경할 수 없어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await action(id);
      setDeleting(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="screen wire-cards"
      data-figma-node={cards.length ? '118:1342' : '124:4546'}
    >
      <ScreenHeader title="결제 카드 관리" backTo="/profile" />
      {cards.length ? (
        <div className="screen-content">
          {cards.map((card) => (
            <article className="payment-card" key={card.id}>
              <div className="section-heading">
                <div>
                  <Icon name="card" />
                  <strong>등록 카드 •••• {card.last4}</strong>
                </div>
                {card.isDefault ? (
                  <span className="tag">기본</span>
                ) : (
                  <button
                    className="icon-button"
                    disabled={busy}
                    aria-label={`${card.last4} 카드 삭제`}
                    onClick={() => setDeleting(card.id)}
                  >
                    <Icon name="trash" />
                  </button>
                )}
              </div>
              {!card.isDefault && (
                <button
                  className="button button--small"
                  disabled={busy}
                  onClick={() => void update(onSetDefault, card.id)}
                >
                  기본 카드로 설정
                </button>
              )}
            </article>
          ))}
          <Link className="card-add-row" to="/cards/new">
            <Icon name="plus" />
            카드 추가
          </Link>
          <aside className="card-notes">
            <h2>안내 사항</h2>
            <ul>
              <li>결제 예정 내역이 있는 카드는 삭제할 수 없어요.</li>
              <li>기본 카드는 원클릭 결제에 사용돼요.</li>
            </ul>
          </aside>
          {error && !deleting && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="screen-content screen-content--center">
            <div className="empty-circle" />
            <h2>등록된 카드가 없어요</h2>
          </div>
          <div className="screen-actions">
            <Link className="button button--primary" to="/cards/new">
              카드 추가
            </Link>
          </div>
        </>
      )}
      {deleting && (
        <WireDialog
          title="카드 삭제"
          className="system-feedback"
          onClose={() => {
            if (!busy) setDeleting(undefined);
          }}
        >
          <h2>카드를 삭제할까요?</h2>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setDeleting(undefined)}
            >
              취소
            </button>
            <button
              className="button button--primary"
              disabled={busy}
              onClick={() => void update(onDelete, deleting)}
            >
              삭제하기
            </button>
          </div>
        </WireDialog>
      )}
    </div>
  );
}
