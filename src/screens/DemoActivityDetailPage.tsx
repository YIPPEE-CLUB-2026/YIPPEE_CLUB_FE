import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ActivityDesignHeader,
  ActivityDesignIcon,
} from '../components/ActivityDesign';
import { ActivityThumbnail } from '../components/ActivityThumbnail';
import { ActivityCard } from '../components/ActivityCard';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
import { demoActivities, demoActivityGuide } from '../data/demo-activities';
import { useAuth } from '../context/AuthContext';
import { useDemoActivityState } from '../lib/demo-activity-state';
import { showToast } from '../components/Toast';

export function DemoActivityDetailPage() {
  const { exampleSlug } = useParams();
  const navigate = useNavigate();
  const activity = demoActivities.find((item) => item.slug === exampleSlug);
  const { user, requestLogin } = useAuth();
  const { state, update } = useDemoActivityState(user?.id);
  const [dialog, setDialog] = useState<
    'share' | 'reviews' | 'cart' | 'purchase' | null
  >(null);
  const [copyError, setCopyError] = useState('');
  const reviewRows = [
    {
      name: '도영이네',
      text:
        activity?.slug === 'lines'
          ? '선을 따라 그리고 접어 보면서 실선과 점선의 차이를 재미있게 익혔어요.'
          : activity?.slug === 'transport'
            ? '아이가 정말 좋아했어요. 탈것 이야기를 한참 나눴어요.'
            : '직접 그린 그림으로 퍼즐을 만드니 더 즐거워했어요.',
    },
    { name: '율도네', text: '아이와 함께 짧은 시간에도 즐겁게 놀이했어요.' },
  ];
  function save(slug: string) {
    if (!user) {
      requestLogin();
      return;
    }
    const saved = !state(slug).saved;
    update(slug, { saved });
    showToast(
      saved ? '예시 활동지를 저장했어요' : '예시 활동지 저장을 해제했어요',
    );
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setDialog(null);
      showToast('링크를 복사했어요');
    } catch {
      setCopyError('링크를 복사하지 못했어요. 다시 시도해 주세요.');
    }
  }
  return (
    <div
      className="screen wire-details demo-activity-detail activity-design"
      data-figma-node="413:6450"
    >
      <ActivityDesignHeader
        title="활동지 상세"
        backTo="/"
        right={
          <button aria-label="예시 장바구니" onClick={() => setDialog('cart')}>
            <ActivityDesignIcon name="cart" />
          </button>
        }
      />
      {activity ? (
        <>
          <div className="detail-hero">
            <ActivityThumbnail activity={activity} />
          </div>
          <div className="detail-content">
            <div className="detail-tags">
              <span className="tag">
                {activity.durationMin === activity.durationMax
                  ? `${activity.duration}분`
                  : `${activity.durationMin}-${activity.durationMax}분`}
              </span>
              <span className="tag">만 {activity.ageYears}세</span>
              <span className="tag">
                난이도 {activity.difficultyLabel ?? '하'}
              </span>
            </div>
            <div className="demo-detail-title">
              <h2>
                [{activity.subtitle}] {activity.title}
              </h2>
              <div className="section-heading">
                <strong>{activity.price.toLocaleString('ko-KR')}원</strong>
                <button
                  className="activity-design-button"
                  aria-label="활동지 공유"
                  onClick={() => {
                    setCopyError('');
                    setDialog('share');
                  }}
                >
                  <ActivityDesignIcon name="share" />
                </button>
              </div>
            </div>
            <p>{activity.description}</p>
            <h3>발달 영역</h3>
            <div className="chips">
              {activity.developmentDomains?.map((name) => (
                <span className="chip" key={name}>
                  {name}
                </span>
              ))}
            </div>
            <h3>준비물</h3>
            <p>{activity.materials?.join(', ')}</p>
            <div className="section-heading">
              <h3>활동 미리보기</h3>
            </div>
            <div className="detail-previews" aria-label="활동지 미리보기">
              <span>
                {activity.previewImages ? (
                  <img
                    src={activity.previewImages[0]}
                    alt={`${activity.title} 활동안 미리보기`}
                  />
                ) : (
                  <small>활동지 PDF 준비 중</small>
                )}
              </span>
              <span>
                {activity.previewImages ? (
                  <img
                    src={activity.previewImages[1]}
                    alt={`${activity.title} 활동 가이드 미리보기`}
                  />
                ) : (
                  <small>활동 가이드</small>
                )}
              </span>
            </div>
            <h3>엄마아빠 가이드</h3>
            <ol className="detail-parent-guide">
              {demoActivityGuide(activity.slug).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="section-heading">
              <h2>리뷰 2개</h2>
              <button
                className="demo-detail-link"
                onClick={() => setDialog('reviews')}
              >
                전체보기 <ActivityDesignIcon name="chevron" />
              </button>
            </div>
            <div className="detail-review-preview">
              <div className="section-heading">
                <span>{reviewRows[0].name}</span>
                <small aria-label="별점 5점">★★★★★</small>
              </div>
              <p>{reviewRows[0].text}</p>
            </div>
            <div className="section-heading">
              <h2>이런 활동지는 어때요</h2>
              <Link className="demo-detail-link" to="/activities">
                전체보기 <ActivityDesignIcon name="chevron" />
              </Link>
            </div>
            <div className="activity-grid">
              {demoActivities
                .filter((item) => item.slug !== activity.slug)
                .map((item) => (
                  <ActivityCard
                    key={item.id}
                    activity={item}
                    saved={!!state(item.slug).saved}
                    onToggle={() => save(item.slug)}
                    detailTo={`/activities/examples/${item.slug}`}
                    saveIcon={<ActivityDesignIcon name="heart" />}
                  />
                ))}
            </div>
            <p className="demo-detail-note">
              {activity.previewImages
                ? '리뷰와 구매 기능은 화면 확인용 예시입니다.'
                : '화면 확인용 예시 활동지와 리뷰입니다.'}
            </p>
          </div>
          <div className="screen-actions">
            <div className="detail-buy-row">
              <button
                className={`activity-design-button ${state(activity.slug).saved ? 'is-saved' : ''}`}
                aria-label={
                  state(activity.slug).saved
                    ? '활동지 저장 해제'
                    : '활동지 저장'
                }
                aria-pressed={!!state(activity.slug).saved}
                onClick={() => save(activity.slug)}
              >
                <ActivityDesignIcon name="heart" />
              </button>
              <button
                className="button"
                onClick={() => {
                  if (!user) {
                    requestLogin();
                    return;
                  }
                  update(activity.slug, { cart: true });
                  showToast('예시 장바구니에 담았어요');
                }}
              >
                장바구니
              </button>
              <button
                className="button button--primary"
                onClick={() => {
                  if (!user) requestLogin();
                  else
                    navigate('/checkout', {
                      state: {
                        activityIds: [activity.id],
                        demoActivitySlug: activity.slug,
                      },
                    });
                }}
              >
                바로 구매
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="screen-content screen-content--center">
          <h2>활동지를 찾을 수 없어요</h2>
          <Link className="button" to="/">
            홈으로
          </Link>
        </div>
      )}
      {dialog && (
        <WireDialog
          title={
            dialog === 'share'
              ? '공유하기'
              : dialog === 'reviews'
                ? '리뷰 2개'
                : dialog === 'cart'
                  ? '예시 장바구니'
                  : '구매 안내'
          }
          sheet={dialog === 'share'}
          className="activity-design-dialog"
          onClose={() => setDialog(null)}
        >
          <div className="section-heading">
            <h2>
              {dialog === 'share'
                ? '공유하기'
                : dialog === 'reviews'
                  ? '리뷰 2개'
                  : dialog === 'cart'
                    ? '예시 장바구니'
                    : '구매 안내'}
            </h2>
            <button
              className="icon-button"
              aria-label="닫기"
              onClick={() => setDialog(null)}
            >
              <Icon name="close" />
            </button>
          </div>
          {dialog === 'share' ? (
            <>
              <button className="button" onClick={() => void copyLink()}>
                링크 복사
              </button>
              {copyError && <p role="alert">{copyError}</p>}
            </>
          ) : dialog === 'reviews' ? (
            <>
              {reviewRows.map((review) => (
                <article className="detail-review-preview" key={review.name}>
                  <div className="section-heading">
                    <strong>{review.name}</strong>
                    <small>★★★★★</small>
                  </div>
                  <p>{review.text}</p>
                </article>
              ))}
              <small>화면 확인용 예시 리뷰입니다.</small>
            </>
          ) : dialog === 'cart' ? (
            <>
              {demoActivities.filter((item) => state(item.slug).cart).length ? (
                demoActivities
                  .filter((item) => state(item.slug).cart)
                  .map((item) => (
                    <div className="section-heading" key={item.slug}>
                      <Link
                        to={`/activities/examples/${item.slug}`}
                        onClick={() => setDialog(null)}
                      >
                        {item.title}
                      </Link>
                      <button
                        className="text-button"
                        onClick={() => update(item.slug, { cart: false })}
                      >
                        삭제
                      </button>
                    </div>
                  ))
              ) : (
                <p>예시 장바구니가 비어 있어요.</p>
              )}
            </>
          ) : (
            <p>구매 기능은 화면 확인용 예시로 실제 결제는 진행되지 않아요.</p>
          )}
        </WireDialog>
      )}
    </div>
  );
}
