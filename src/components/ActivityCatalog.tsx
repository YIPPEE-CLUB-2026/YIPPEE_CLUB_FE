import { scrollAppToTop } from '../lib/scroll';
import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ActivityCard } from './ActivityCard';
import {
  CatalogFilters,
  defaultFilters,
} from './CatalogFilters';
import { Icon } from './Icon';
import { PlayCategoryIcon } from './PlayCategoryIcon';
import { TrendingKeywords, type CatalogProps } from '../screens/HomePage';
import { OneClickOverlay } from '../screens/ReferenceScreens';
import { useCatalogQuery } from './useCatalogQuery';
import { LoadingState } from './LoadingState';

export const CATALOG_PAGE_SIZE = 20;
export function ActivityCatalog({
  activities,
  savedIds,
  onToggle,
}: CatalogProps) {
  const navigate = useNavigate();
  const categoryTrack = useRef<HTMLDivElement>(null);
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = params.get('category') || '전체';
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [finder, setFinder] = useState(false);
  const resource = useCatalogQuery(filters, query, category, page);
  const totalPages = Math.max(
    1,
    Math.ceil(resource.count / CATALOG_PAGE_SIZE),
  );
  const currentPage = page;
  const items = resource.results;
  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  }
  const categories = Array.from(
    new Set([
      '전체',
      '그림/색칠',
      '만들기',
      '한글',
      '숫자',
      '역할',
      '영어',
      '음악',
      '체육',
      'AI, 코딩',
      ...resource.categories.map(item => item.name),
    ]),
  );
  return (
    <div
      className="page-content reference-catalog activity-catalog wire-catalog"
      data-figma-node="117:538"
    >
      <header className="page-header">
        <h1>활동찾기</h1>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="알림"
            onClick={() => navigate('/notifications')}
          >
            <Icon name="bell" />
          </button>
          <button
            className="icon-button"
            aria-label="장바구니"
            onClick={() => navigate('/cart')}
          >
            <Icon name="cart" />
          </button>
        </div>
      </header>
      <label className="search-field">
        <input
          maxLength={255}
          aria-label="활동안 검색"
          placeholder="놀이 키워드를 입력해보세요.(자동차, 공룡)"
          value={query}
          onChange={(e) => update('q', e.target.value)}
        />
        <Icon name="search" />
      </label>
      <div className="category-scroller">
        <button
          type="button"
          className="category-scroll-button"
          aria-label="이전 카테고리 보기"
          onClick={() =>
            categoryTrack.current?.scrollBy({ left: -220, behavior: 'smooth' })
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <div
          ref={categoryTrack}
          className="experience-categories"
          aria-label="활동 카테고리"
          tabIndex={0}
        >
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={category === name}
              onClick={() => {
                update('category', name);
              }}
            >
              <span>
                <PlayCategoryIcon category={name} />
              </span>
              {name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="category-scroll-button"
          aria-label="다음 카테고리 보기"
          onClick={() =>
            categoryTrack.current?.scrollBy({ left: 220, behavior: 'smooth' })
          }
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>
      <CatalogFilters
        domainAvailable={activities.some(
          (item) => item.developmentDomains?.length,
        )}
        countLabel={resource.loading ? '조회 중…' : `활동안 ${resource.count}개`}
        filters={filters}
        onChange={(value) => {
          setFilters(value);
          setPage(1);
        }}
      />
      {category === 'AI' &&
        !activities.some((item) => typeof item.isAiGenerated === 'boolean') && (
          <p className="wire-note" role="status">
            AI 제작 여부 데이터가 아직 연결되지 않았어요. 확인된 AI 활동지만 이
            목록에 표시됩니다.
          </p>
        )}
      <div className="activity-grid">
        {items.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            saved={savedIds.includes(activity.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
      {resource.loading && <LoadingState inline label="활동지를 찾고 있어요" />}
      {!resource.loading && resource.error && <p role="alert">{resource.error} <button type="button" onClick={resource.retry}>다시 시도</button></p>}
      {!resource.loading && !resource.error && !items.length && (
        <p className="wire-empty">
          조건에 맞는 활동안이 없어요. 검색어나 필터를 바꿔 주세요.
        </p>
      )}
      {!resource.loading && !resource.error && totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="활동안 페이지">
          <button
            disabled={currentPage === 1}
            onClick={() => {
              setPage(currentPage - 1);
              scrollAppToTop();
            }}
          >
            이전
          </button>
          <span aria-live="polite">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => {
              setPage(currentPage + 1);
              scrollAppToTop();
            }}
          >
            다음
          </button>
        </nav>
      )}
      <TrendingKeywords
        collapsible={false}
        onSearch={(value) => {
          update('q', value);
          scrollAppToTop();
        }}
      />
      <button
        type="button"
        className="button button--primary"
        onClick={() => setFinder(true)}
      >
        원클릭 맞춤형 놀이 찾기
      </button>
      {finder && (
        <OneClickOverlay
          availableCategories={resource.categories.map(item => item.name)}
          activities={activities}
          onClose={() => setFinder(false)}
          onFind={(playFilters) => {
            setFinder(false);
            navigate('/recommendations', { state: { playFilters } });
          }}
        />
      )}
    </div>
  );
}
