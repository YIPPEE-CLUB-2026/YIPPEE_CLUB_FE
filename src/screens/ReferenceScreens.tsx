import { useBack } from '../components/NavigationHistory';
import { useChildren } from '../context/ChildrenContext';
import {
  filterRecommendations,
  recommendActivities,
  type PlayFilters,
} from '../lib/recommendations';
import { ActivityCatalog } from '../components/ActivityCatalog';
import { useState } from 'react';
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from 'react-router-dom';
import { Icon } from '../components/Icon';
import { ReferenceHeader } from '../components/ReferenceHeader';
import { WireDialog } from '../components/WireDialog';
import { ActivityCard } from '../components/ActivityCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { type CatalogProps } from './HomePage';
import type { Activity } from '../types';
import { apiRequest } from '../lib/api';

export function OneClickOverlay({
  onClose,
  onFind,
  activities = [],
  availableCategories,
}: {
  onClose: () => void;
  onFind: (filters: PlayFilters) => void;
  activities?: Activity[];
  availableCategories?: string[];
}) {
  const { activeChild, children } = useChildren();
  const [childId, setChildId] = useState(activeChild?.id);
  const child = children.find((item) => item.id === childId);
  const navigate = useNavigate();
  const [filters, setFilters] = useState<PlayFilters>({
    name: child?.name || '',
    age: '',
    materials: [],
    categories: [],
    domains: [],
  });
  const categories = Array.from(
    new Set(
      availableCategories || activities.flatMap((item) => item.categoryNames || [item.category]),
    ),
  );
  function toggle(key: 'materials' | 'categories' | 'domains', value: string) {
    setFilters((previous) => ({
      ...previous,
      [key]: previous[key].includes(value)
        ? previous[key].filter((item) => item !== value)
        : [...previous[key], value],
    }));
  }
  function group(
    key: 'materials' | 'categories' | 'domains',
    title: string,
    options: string[],
  ) {
    const available = key === 'categories' || activities.some(item => key === 'materials' ? !!item.materials?.length : !!item.developmentDomains?.length);
    return (
      <fieldset className="finder-fieldset" disabled={!available}>
        <legend>{title}</legend>
        {!available && <small>이 조건으로 찾을 수 있는 정보가 아직 등록되지 않았어요.</small>}
        <div className="chips">
          {options.map((value) => (
            <button
              type="button"
              className={`chip ${filters[key].includes(value) ? 'is-selected' : ''}`}
              aria-pressed={filters[key].includes(value)}
              key={value}
              onClick={() => toggle(key, value)}
            >
              {value}
            </button>
          ))}
        </div>
      </fieldset>
    );
  }
  return (
    <WireDialog
      title="어떤 놀이를 찾을까요?"
      className="oneclick-modal oneclick-modal--filters wire-finder"
      onClose={onClose}
    >
      <div className="finder-header">
        <h2>어떤 놀이를 찾을까요?</h2>
        <button
          type="button"
          className="oneclick-modal__close"
          aria-label="맞춤 놀이 닫기"
          onClick={onClose}
        >
          <span className="finder-close-glyph" aria-hidden="true" />
        </button>
      </div>
      <form
        className="finder-form"
        onSubmit={(event) => {
          event.preventDefault();
          onFind({
            ...filters,
            name: child?.name || '',
            childId: child?.id,
            age: '',
          });
        }}
      >
        <div className="finder-fields">
          <fieldset className="finder-fieldset">
            <legend>누구와 놀까요?</legend>
            <div className="chips">
              {children.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`chip ${item.id === childId ? 'is-selected' : ''}`}
                  aria-pressed={item.id === childId}
                  onClick={() => setChildId(item.id)}
                >
                  {item.name}
                </button>
              ))}
              <button
                type="button"
                className="chip"
                onClick={() => navigate('/children/new')}
              >
                + 아이 추가
              </button>
            </div>
          </fieldset>
          {group(
            'categories',
            '놀이 유형',
            categories.length
              ? categories
              : [
                  '그림/색칠',
                  '만들기',
                  '한글',
                  '숫자',
                  '역할',
                  '영어',
                  '음악',
                  '체육',
                ],
          )}
          <fieldset className="finder-fieldset">
            <legend>소요 시간</legend>
            <div className="chips">
              {[
                ['5-10', '5~10분'],
                ['10-20', '10~20분'],
                ['20+', '20분 이상'],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`chip ${filters.duration === value ? 'is-selected' : ''}`}
                  aria-pressed={filters.duration === value}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      duration: filters.duration === value ? '' : value,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="finder-fieldset" disabled={!activities.some(item => !!item.location)}>
            <legend>장소</legend>
            {!activities.some(item => !!item.location) && <small>장소 정보가 등록되면 선택할 수 있어요.</small>}
            <div className="chips">
              {['집 안', '집 밖'].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={`chip ${filters.place === value ? 'is-selected' : ''}`}
                  aria-pressed={filters.place === value}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      place: filters.place === value ? '' : value,
                    })
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          {group('materials', '준비물', [
            '연필',
            '지우개',
            '색연필',
            '사인펜',
            '가위',
            '풀',
          ])}
        </div>
        <div className="finder-submit">
          <button
            type="button"
            className="button"
            onClick={() => {
              setChildId(activeChild?.id);
              setFilters({
                name: '',
                age: '',
                materials: [],
                categories: [],
                domains: [],
              });
            }}
          >
            초기화
          </button>
          <button type="submit" className="button button--primary">
            활동안 찾기
          </button>
        </div>
      </form>
    </WireDialog>
  );
}

export function ReferenceRecommendationsPage(props: CatalogProps) {
  const navigate = useNavigate();
  const { user, requestLogin } = useAuth();
  const back = useBack('/activities');
  const { activeChild, children } = useChildren();
  const { state } = useLocation();
  const filters = state?.playFilters as PlayFilters | undefined;
  const child = filters?.childId
    ? children.find((item) => item.id === filters.childId)
    : activeChild;
  const items = filters
    ? filterRecommendations(
        filters.age
          ? props.activities
          : recommendActivities(props.activities, child),
        filters,
      ).slice(0, 20)
    : recommendActivities(props.activities, child);
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const total = items
    .filter((item) => selected.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  async function addSelected() {
    if (!user) {
      requestLogin();
      return;
    }
    setBusy(true);
    setError('');
    try {
      for (const id of selected)
        await apiRequest('/cart/items', {
          method: 'POST',
          body: JSON.stringify({ activity_id: id }),
        });
      navigate('/cart');
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="reference-results wire-results" data-figma-node="116:386">
      <div className="screen-content">
        <h1>원클릭 활동안 찾기 결과</h1>
        <p>
          바로시작할 수 있는 놀이활동 <strong>{items.length}개</strong> 있어요
        </p>
        <p className="recommendation-context">
          {filters
            ? `${filters.name || child?.name || '아이'}의 선택한 조건으로 골랐어요.`
            : child
              ? `${child.name}의 월령과 관심사를 기준으로 골랐어요.`
              : '아이를 등록하면 월령과 관심사에 맞춰 골라드려요.'}
        </p>
        {filters &&
          (filters.materials.length > 0 || filters.domains.length > 0) && (
            <p className="recommendation-context">
              준비물·발달 영역 정보가 등록된 활동안만 해당 조건에 표시됩니다.
            </p>
          )}
        <div className="activity-grid">
          {items.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              saved={props.savedIds.includes(activity.id)}
              onToggle={props.onToggle}
              selected={selected.includes(activity.id)}
              onSelect={(id) =>
                setSelected((ids) =>
                  ids.includes(id)
                    ? ids.filter((value) => value !== id)
                    : [...ids, id],
                )
              }
            />
          ))}
        </div>
        {!items.length && <p>조건에 맞는 활동지가 없어요.</p>}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="reference-results__actions">
        <div className="cart-total">
          <span>총 {selected.length}개 선택</span>
          <strong>{total.toLocaleString('ko-KR')}원</strong>
        </div>
        <button type="button" className="button button--primary" onClick={back}>
          뒤로가기
        </button>
        <button
          type="button"
          className="button button--primary"
          disabled={!selected.length || busy}
          onClick={() => void addSelected()}
        >
          {busy ? '담는 중…' : '장바구니 담기'}
        </button>
      </div>
    </div>
  );
}

export function ReferenceAccountInfoPage({
  contract = false,
}: {
  contract?: boolean;
}) {
  const { user } = useAuth();
  return (
    <div className="screen">
      <ReferenceHeader
        title={contract ? '계약서 조회' : '계좌정보 조회'}
        backTo="/settings"
      />
      <div className="screen-content">
        <p>
          {contract
            ? '등록된 계약서가 없습니다.'
            : '등록된 계좌정보가 없습니다.'}
        </p>
        {!user && (
          <Link className="button button--accent" to="/login">
            로그인 할래요!
          </Link>
        )}
      </div>
    </div>
  );
}

export function ReferenceCatalogPage(
  props: CatalogProps & { items: Activity[] },
) {
  return <ActivityCatalog {...props} activities={props.items} />;
}
