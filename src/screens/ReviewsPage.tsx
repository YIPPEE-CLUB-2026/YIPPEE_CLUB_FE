import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
export interface ClubReview {
  id: string;
  author: string;
  rating: number;
  content: string;
  date?: string;
  photos?: string[];
  own?: boolean;
  helpful: number;
}
export function ReviewsPage({
  reviews = [],
  onDelete,
  onHelpful,
}: {
  reviews?: ClubReview[];
  onDelete?: (id: string) => Promise<void>;
  onHelpful?: (id: string) => Promise<number>;
}) {
  const { activityId } = useParams();
  const [photosOnly, setPhotosOnly] = useState(false);
  const [sort, setSort] = useState('최신순');
  const [removed, setRemoved] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [deleting, setDeleting] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const all = reviews.filter((item) => !removed.includes(item.id));
  const rows = all
    .filter((item) => !photosOnly || !!item.photos?.length)
    .sort((a, b) =>
      sort === '인기순'
        ? (counts[b.id] ?? b.helpful) - (counts[a.id] ?? a.helpful)
        : (Date.parse(b.date || '') || 0) - (Date.parse(a.date || '') || 0),
    );
  async function remove() {
    if (!deleting) return;
    if (!onDelete) {
      setError('리뷰를 삭제할 수 없어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onDelete(deleting);
      setRemoved((current) => [...current, deleting]);
      setDeleting(undefined);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function helpful(id: string) {
    if (!onHelpful) {
      setError('도움돼요 기능을 준비하고 있어요.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const count = await onHelpful(id);
      setCounts((current) => ({ ...current, [id]: count }));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="screen wire-reviews"
      data-figma-node={all.length ? '123:2888' : '123:2921'}
    >
      <ScreenHeader title="리뷰" backTo={`/activities/${activityId}`} />
      {all.length ? (
        <div className="screen-content">
          <div className="review-summary">
            <strong>
              ★{' '}
              {(
                all.reduce((sum, item) => sum + item.rating, 0) / all.length
              ).toFixed(1)}
            </strong>
            <small>리뷰 {all.length}개</small>
          </div>
          <div className="section-heading">
            <button
              className="filter-chip"
              aria-pressed={photosOnly}
              onClick={() => setPhotosOnly((value) => !value)}
            >
              사진 리뷰만
              <Icon name="down" size={16} />
            </button>
            <button
              className="filter-chip"
              onClick={() => setSort(sort === '최신순' ? '인기순' : '최신순')}
            >
              {sort}
              <Icon name="down" size={16} />
            </button>
          </div>
          {rows.map((item) => (
            <article className="club-review" key={item.id}>
              <div className="section-heading">
                <strong>{item.own ? '내 리뷰' : item.author}</strong>
                <small aria-label={`별점 ${item.rating}점`}>
                  {'★'.repeat(
                    Math.max(0, Math.min(5, Math.round(item.rating))),
                  )}
                </small>
              </div>
              <p>{item.content}</p>
              {!!item.photos?.length && (
                <div className="club-review__photos">
                  {item.photos.map((src, index) => (
                    <img key={src} src={src} alt={`리뷰 사진 ${index + 1}`} />
                  ))}
                </div>
              )}
              <div className="section-heading">
                {item.own ? (
                  <button
                    className="text-button"
                    onClick={() => {
                      setError('');
                      setDeleting(item.id);
                    }}
                  >
                    삭제
                  </button>
                ) : (
                  <Link
                    className="text-button"
                    to="/support/inquiries/new"
                    state={{ reviewId: item.id }}
                  >
                    신고
                  </Link>
                )}
                <button
                  className="button button--small"
                  disabled={busy}
                  onClick={() => void helpful(item.id)}
                >
                  도움돼요 {counts[item.id] ?? item.helpful}
                </button>
              </div>
            </article>
          ))}
          {!rows.length && <p className="wire-note">사진 리뷰가 없어요.</p>}
          {error && !deleting && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="screen-content screen-content--center">
          <div className="empty-circle" />
          <h2>리뷰 기능을 준비 중이에요</h2>
          <p>
            아이와 놀이 후<br />첫 번째 리뷰를 남겨 주세요.
          </p>
        </div>
      )}
      <div className="screen-actions">
        <Link
          className="button button--primary"
          to={
            all.length
              ? `/activities/${activityId}/reviews/new`
              : `/activities/${activityId}`
          }
        >
          {all.length ? '리뷰 쓰기' : '목록으로'}
        </Link>
      </div>
      {deleting && (
        <WireDialog
          title="리뷰 삭제"
          className="system-feedback"
          onClose={() => {
            if (!busy) setDeleting(undefined);
          }}
        >
          <h2>리뷰를 삭제할까요?</h2>
          <p className="form-error">리뷰를 삭제하면 활동배지도 사라져요.</p>
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
