import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { useAuth } from '../context/AuthContext';
import { useChildren } from '../context/ChildrenContext';
import { showToast } from '../components/Toast';
import { badgeExample } from '../lib/badge-examples';

const asset = (file: string) => `/assets/design/${file}`;
const badges = [
  '첫걸음',
  '만세왕',
  '반가워요',
  '단골손님',
  '대단해요',
  '골고루 요정',
  '센스쟁이',
  '내꺼야',
  '만세파티',
  '만세홀릭',
  '응원해요',
  '잘했어요',
  '명예가족',
  '둘러보기',
  '만세전파',
];
const sparkles = new Set([1, 5, 12]);
// 배지 이미지는 도감 목록에만 사용하며 실제 획득 이력으로 취급하지 않습니다.
const badgeArtwork: Record<number, string> = {
  0: 'badge-help-9561a.png',
  1: 'badge-help-b62f1.png',
  2: 'badge-help-865ab.png',
  3: 'badge-catalogue-4.png',
  4: 'badge-catalogue-5.png',
  5: 'badge-catalogue-6.png',
  6: 'badge-catalogue-7.png',
  7: 'badge-catalogue-8.png',
  8: 'badge-catalogue-9.png',
  9: 'badge-catalogue-10.png',
  10: 'badge-catalogue-11.png',
  11: 'badge-catalogue-12.png',
  12: 'badge-catalogue-13.png',
  13: 'badge-catalogue-14.png',
  14: 'badge-catalogue-15.png',
};
const badgeConditions = [
  '놀이활동 리뷰 1개 작성',
  '놀이활동 리뷰 10개 작성',
  '회원가입 완료',
  '7일 연속 앱 접속',
  '상 난이도 놀이활동 리뷰 3개 작성',
  '발달영역 5개 각각 놀이하고 리뷰 1개씩 작성',
  '첫 사진 리뷰 작성',
  '놀이활동 10개 이상 저장',
  '유료 활동안 첫 구매',
  '유료 활동안 5개 이상 구매',
  '하 난이도 놀이활동 리뷰 3개 작성',
  '중 난이도 놀이활동 리뷰 3개 작성',
  '회원가입 6개월 후 재접속',
  '포스팅 10회 이상 조회',
  '포스팅 5회 이상 공유',
];
function badgeDescription(index: number) {
  return `획득 조건: ${badgeConditions[index]}`;
}

export function BadgesPage() {
  const { user } = useAuth();
  const { activeChild, children } = useChildren();
  const example = badgeExample(activeChild, children);
  const earnedArtwork: Record<number, string> = Object.fromEntries(
    example.earned.map((index) => [index, badgeArtwork[index]]),
  );
  const earnedCount = example.earned.length;
  const [help, setHelp] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [representatives, setRepresentatives] = useState<
    Record<string, number>
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem('yippee.badge.representatives') || '{}',
      );
    } catch {
      return {};
    }
  });
  const representativeKey = `${user?.id ?? 'guest'}:${activeChild?.id ?? 'none'}`;
  const savedRepresentative =
    representatives[representativeKey] ?? example.representative;
  const representative =
    sparkles.has(savedRepresentative) && earnedArtwork[savedRepresentative]
      ? savedRepresentative
      : undefined;
  function setRepresentative(index: number) {
    if (!sparkles.has(index) || !earnedArtwork[index]) return;
    const next = { ...representatives, [representativeKey]: index };
    setRepresentatives(next);
    try {
      localStorage.setItem(
        'yippee.badge.representatives',
        JSON.stringify(next),
      );
    } catch {
      /* The current screen still reflects the selection. */
    }
    setSelected(null);
    showToast('대표배지로 설정했어요');
  }
  return (
    <div
      className="screen club-badge-book"
      data-figma-node={activeChild ? '413:7866' : '413:7946'}
    >
      <ScreenHeader
        title="만세도감"
        backTo="/profile"
        right={
          activeChild && (
            <button
              type="button"
              className="icon-button"
              aria-label="도감 안내"
              onClick={() => setHelp(true)}
            >
              <img src={asset('badge-book-0bf1a.svg')} alt="" />
            </button>
          )
        }
      />
      {activeChild ? (
        <div className="club-badge-content">
          <section className="club-play-record" aria-label="배지 획득 현황">
            <div className="record-decoration" aria-hidden="true">
              <img src={asset('badge-book-4858e.svg')} alt="" />
              <img src={asset('badge-book-587c4.svg')} alt="" />
              <img src={asset('badge-book-5ff60.svg')} alt="" />
            </div>
            <img
              className="record-star record-star--one"
              src={asset('badge-book-c39b7.svg')}
              alt=""
            />
            <img
              className="record-star record-star--two"
              src={asset('badge-book-e27d1.svg')}
              alt=""
            />
            <small>놀이할수록 쌓이는 즐거움</small>
            <h2>우리 가족의 놀이 기록</h2>
            <div className="record-summary">
              <div className="record-count">
                <span>획득한 배지</span>
                <strong>{earnedCount}</strong>
                <b>/ 15</b>
              </div>
              <progress
                max={15}
                value={earnedCount}
                aria-label={`획득한 배지 ${earnedCount}개, 전체 15개`}
              />
            </div>
          </section>
          <section className="club-representative">
            <div>
              <h2>나의 대표 배지</h2>
              <span className="badge-pill">
                <img src={asset('badge-book-f64e8.svg')} alt="" />
                반짝배지 전용
              </span>
            </div>
            <img
              className="representative-lock"
              src={asset(
                representative === undefined
                  ? 'representative-padlock.svg'
                  : earnedArtwork[representative],
              )}
              alt={
                representative === undefined
                  ? '잠긴 대표 배지'
                  : `${badges[representative]} 대표 배지`
              }
            />
            <p>
              {representative === undefined
                ? '반짝배지를 획득하면 대표로 설정할 수 있어요'
                : `${badges[representative]} · 나의 대표 배지`}
            </p>
          </section>
          <section className="club-badge-collection">
            <header>
              <div>
                <h2>
                  나의 배지 <span>{earnedCount}</span>
                </h2>
                <span className="badge-pill">{earnedCount} / 15 획득</span>
              </div>
              <p>놀이할수록 하나씩 채워지는 우리만의 도감</p>
            </header>
            <div className="club-badge-grid">
              {badges.map((name, index) => (
                <button
                  type="button"
                  className={`club-badge-tile ${sparkles.has(index) ? 'club-badge-tile--sparkle' : ''} ${earnedArtwork[index] ? 'club-badge-tile--earned' : ''}`}
                  key={name}
                  aria-label={`${name}${sparkles.has(index) ? ' 반짝배지' : ' 배지'}, ${earnedArtwork[index] ? '획득' : '잠김'}. 상세 보기`}
                  onClick={() => setSelected(index)}
                >
                  <img
                    className="tile-lock"
                    src={asset(
                      earnedArtwork[index] ||
                        (sparkles.has(index)
                          ? 'badge-book-da186.svg'
                          : 'badge-book-00f3e.svg'),
                    )}
                    alt=""
                  />
                  <span>{name}</span>
                  {earnedArtwork[index] && (
                    <img
                      className="tile-earned-check"
                      src={asset('badge-earned-check.svg')}
                      alt=""
                    />
                  )}
                  {sparkles.has(index) && (
                    <img
                      className="tile-star"
                      src={asset('badge-book-c2d61.svg')}
                      alt=""
                    />
                  )}
                </button>
              ))}
            </div>
            <p className="badge-collection-hint">
              잠긴 배지를 눌러 획득 조건을 확인해요
            </p>
          </section>
        </div>
      ) : (
        <>
          <div className="club-badge-empty">
            <img src={asset('badge-book-00f3e.svg')} alt="잠긴 도감" />
            <h2>아이를 등록하면 도감이 열려요</h2>
            <p>아이 정보를 등록하면 놀이 기록과 배지가 차곡차곡 쌓여요</p>
          </div>
          <div className="screen-actions">
            <Link
              className="button button--primary"
              to={user ? '/children/new' : '/login'}
            >
              아이 등록하기
            </Link>
          </div>
        </>
      )}
      {help && (
        <WireDialog
          title="만세도감 안내"
          className="club-badge-popup club-badge-popup--help"
          onClose={() => setHelp(false)}
        >
          <div className="badge-help-examples">
            {['9561a', 'b62f1', '865ab'].map((file) => (
              <img src={asset(`badge-help-${file}.png`)} alt="" key={file} />
            ))}
          </div>
          <h2>만세도감이 뭐예요?</h2>
          <p>
            놀이활동 리뷰를 쓰고 꾸준히 놀면 배지가 하나씩 모여요.
            <br />
            만세배지 12종 · 반짝배지 3종, ‘반짝배지’만 대표배지로 설정할 수
            있어요.
          </p>
          <button
            className="button button--primary"
            onClick={() => setHelp(false)}
          >
            확인
          </button>
        </WireDialog>
      )}
      {selected !== null && (
        <WireDialog
          title={`${badges[selected]} 배지`}
          className="club-badge-popup"
          onClose={() => setSelected(null)}
        >
          <img
            className="badge-popup-lock"
            src={asset(
              earnedArtwork[selected] ||
                (sparkles.has(selected)
                  ? 'badge-book-da186.svg'
                  : 'badge-book-00f3e.svg'),
            )}
            alt=""
          />
          <h2>
            {earnedArtwork[selected] ? badges[selected] : '아직 잠겨 있어요'}
          </h2>
          <p>{badgeDescription(selected)}</p>
          {earnedArtwork[selected] && sparkles.has(selected) ? (
            <button
              className="button button--primary"
              disabled={representative === selected}
              onClick={() => setRepresentative(selected)}
            >
              {representative === selected
                ? '현재 대표배지'
                : '대표배지로 설정'}
            </button>
          ) : (
            <Link className="button button--primary" to="/activities">
              활동지 보러가기
            </Link>
          )}
          <button className="button" onClick={() => setSelected(null)}>
            닫기
          </button>
        </WireDialog>
      )}
    </div>
  );
}
