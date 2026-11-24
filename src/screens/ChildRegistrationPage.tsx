import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { useChildren } from '../context/ChildrenContext';
import { childInputError, getChild } from '../services/children';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';
import { useBack } from '../components/NavigationHistory';
import { listCategories, type Category } from '../services/activities';

const interestGroups = [
  ['글쓰기', '미술 놀이', '만들기', '그림 그리기'],
  ['노래하고 춤추기', '대근육', '소근육'],
  ['책 읽기', '가게 놀이', '역할 놀이'],
  ['한글', '영어', '수학', '탐구', '한자'],
];
const interestCodes: Record<string, string> = {
  글쓰기: 'writing',
  '미술 놀이': 'painting',
  만들기: 'craft',
  '그림 그리기': 'drawing',
  '노래하고 춤추기': 'dance',
  대근육: 'gross_motor',
  소근육: 'fine_motor',
  '책 읽기': 'reading',
  '가게 놀이': 'shop',
  '역할 놀이': 'role',
  한글: 'korean',
  영어: 'english',
  수학: 'number',
  탐구: 'explore',
  한자: 'hanja',
};

export function ChildRegistrationPage({
  editId,
  mode = 'register',
}: {
  editId?: string;
  mode?: 'register' | 'add';
}) {
  const { save } = useChildren();
  const { isPreview } = useAuth();
  const navigate = useNavigate();
  const leaveForm = useBack(editId || mode === 'add' ? '/children' : '/');
  const original = useRef('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [interests, setInterests] = useState<number[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [leave, setLeave] = useState(false);
  const [created, setCreated] = useState(false);
  const pending = useRef(false);
  const [detailLoading, setDetailLoading] = useState(!!editId);
  const [detailError, setDetailError] = useState('');
  useEffect(() => {
    if (!editId) return;
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError('');
    if (
      !(isPreview ? /^-?\d+$/ : /^[1-9]\d*$/).test(editId) ||
      !Number.isSafeInteger(Number(editId))
    ) {
      setDetailError('아이를 찾을 수 없어요.');
      setDetailLoading(false);
      return;
    }
    getChild(Number(editId), controller.signal)
      .then((child) => {
        if (controller.signal.aborted) return;
        setName(child.name);
        setGender(child.gender);
        const [y, m, d] = child.birth_date.split('-');
        setYear(y);
        setMonth(m);
        setDay(d);
        setInterests(child.interests);
        original.current = JSON.stringify({
          name: child.name,
          gender: child.gender,
          birth_date: child.birth_date,
          interests: [...child.interests].sort((a, b) => a - b),
        });
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setDetailError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailLoading(false);
      });
    return () => controller.abort();
  }, [editId, attempt, isPreview]);
  useEffect(() => {
    const controller = new AbortController();
    setCategoryError('');
    listCategories(controller.signal)
      .then((rows) => {
        if (!controller.signal.aborted) setCategories(rows);
      })
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setCategoryError(cause.message);
      });
    return () => controller.abort();
  }, [attempt]);
  const currentYear = Number(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    }).format(new Date()),
  );
  const days =
    year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;
  const ready =
    !!name.trim() &&
    !!year &&
    !!month &&
    !!day &&
    !detailLoading &&
    !detailError;
  const dirty = editId
    ? !!original.current &&
      original.current !==
        JSON.stringify({
          name,
          gender,
          birth_date: `${year}-${month}-${day}`,
          interests: [...interests].sort((a, b) => a - b),
        })
    : !!(name || gender || year || month || day || interests.length);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current || !ready) return;
    const data = {
      name: name.trim(),
      gender,
      birth_date: `${year}-${month}-${day}`,
      interests,
    };
    const invalid = childInputError(data, !editId);
    if (invalid) {
      setError(invalid);
      return;
    }
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      await save(data, editId ? Number(editId) : undefined);
      if (editId) showToast('아이 정보를 저장했어요', '124:4004');
      if (!editId && mode === 'add') setCreated(true);
      else navigate('/children', { replace: true });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (created)
    return (
      <div className="screen child-add-result" data-figma-node="124:4059">
        <div className="screen-content screen-content--center">
          <div className="empty-circle" />
          <h2>아이를 등록했어요</h2>
          <p>이제 맞춤 놀이를 찾아볼까요?</p>
        </div>
        <div className="screen-actions">
          <Link className="button button--primary" to="/?finder=1" replace>
            맞춤 놀이 찾기
          </Link>
        </div>
      </div>
    );
  if (editId && (detailLoading || detailError))
    return (
      <div className="screen">
        <ScreenHeader title="아이 정보 수정" backTo="/children" />
        <div className="screen-content">
          <p role={detailError ? 'alert' : 'status'}>
            {detailError || '아이 정보를 불러오는 중…'}
          </p>
          {detailError && (
            <button
              className="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              다시 시도
            </button>
          )}
        </div>
      </div>
    );
  return (
    <form
      className={`screen auth-spec child-registration ${editId ? 'child-registration--edit' : ''}`}
      onSubmit={submit}
      data-figma-node={
        editId ? '124:3956' : mode === 'add' ? '117:1274' : '118:1715'
      }
    >
      <ScreenHeader
        title={
          editId ? '아이 정보 수정' : mode === 'add' ? '아이 추가' : '아이 등록'
        }
        onBack={() => {
          if (!busy) {
            if (dirty) setLeave(true);
            else leaveForm();
          }
        }}
      />
      <div className="screen-content registration-content">
        {!editId && mode === 'register' && (
          <div className="registration-intro">
            <h2>아이 정보를 알려주세요</h2>
            <p>자녀가 여러명인 경우, 나중에 추가로 등록할 수 있어요.</p>
          </div>
        )}
        {!editId && mode === 'add' && (
          <h2 className="child-add-step">1 / 2 아이 정보</h2>
        )}
        <label className="wire-field">
          <span>아이 이름{!editId && <span className="required">*</span>}</span>
          <input
            aria-label="아이 이름"
            placeholder="아이의 실명을 입력해주세요."
            maxLength={40}
            required
            disabled={busy}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <fieldset className="registration-gender">
          <legend>성별</legend>
          <div>
            {[
              ['female', '여아'],
              ['male', '남아'],
            ].map(([value, label]) => (
              <button
                className={`chip ${gender === value ? 'is-selected' : ''}`}
                type="button"
                key={value}
                aria-pressed={gender === value}
                disabled={busy}
                onClick={() => setGender(gender === value ? '' : value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="wire-field">
          <span>
            생년월일<span className="required">*</span>
          </span>
          <div className="date-selects">
            <select
              className="wire-select"
              aria-label="생년월일 연도"
              required
              disabled={busy}
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setDay('');
              }}
            >
              <option value="">연도</option>
              {[
                ...new Set([
                  ...Array.from({ length: 12 }, (_, i) => currentYear - i),
                  ...(year ? [Number(year)] : []),
                ]),
              ]
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
            </select>
            <select
              className="wire-select"
              aria-label="생년월일 월"
              required
              disabled={busy}
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setDay('');
              }}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, i) =>
                String(i + 1).padStart(2, '0'),
              ).map((m) => (
                <option key={m} value={m}>
                  {Number(m)}
                </option>
              ))}
            </select>
            <select
              className="wire-select"
              aria-label="생년월일 일"
              required
              disabled={busy}
              value={day}
              onChange={(event) => setDay(event.target.value)}
            >
              <option value="">일</option>
              {Array.from({ length: days }, (_, i) =>
                String(i + 1).padStart(2, '0'),
              ).map((d) => (
                <option key={d} value={d}>
                  {Number(d)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!editId && (
          <p className="registration-age">
            12개월(만 1세)~72개월(만 5세)까지 이용 가능
          </p>
        )}
        <fieldset className="registration-interests">
          <legend>관심있는 놀이활동</legend>
          {interestGroups.map((group, index) => (
            <div className="registration-interest-group" key={index}>
              {group.map((label) => {
                // 디자인의 관심사 이름과 실제 API 항목이 일치할 때만 ID를 저장합니다.
                const category = categories.find(
                  (c) =>
                    c.code === interestCodes[label] ||
                    c.name === interestCodes[label] ||
                    c.name.replace(/\s/g, '') === label.replace(/\s/g, ''),
                );
                const selected = !!category && interests.includes(category.id);
                return (
                  <button
                    type="button"
                    className={`chip ${selected ? 'is-selected' : ''}`}
                    key={label}
                    aria-pressed={selected}
                    disabled={busy || !category}
                    title={
                      !category ? '현재 선택할 수 없는 관심사예요' : undefined
                    }
                    onClick={() => {
                      if (category)
                        setInterests((ids) =>
                          selected
                            ? ids.filter((id) => id !== category.id)
                            : [...ids, category.id],
                        );
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </fieldset>
        {categoryError && (
          <div className="registration-category-error">
            <p className="form-error" role="alert">
              관심사를 불러오지 못했어요. 관심사 없이 저장할 수 있어요.
            </p>
            <button
              type="button"
              className="text-button"
              onClick={() => setAttempt((n) => n + 1)}
            >
              다시 불러오기
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
      </div>
      <div className="screen-actions">
        <button className="button button--primary" disabled={busy || !ready}>
          {busy
            ? '저장 중…'
            : editId
              ? '저장하기'
              : mode === 'add'
                ? '다음'
                : '저장'}
        </button>
        {!editId && mode === 'register' && (
          <Link
            className="button"
            to="/"
            replace
            aria-disabled={busy}
            onClick={(event) => {
              if (busy) event.preventDefault();
            }}
          >
            나중에 하기
          </Link>
        )}
      </div>
      {leave && (
        <WireDialog
          title="아이 입력 취소"
          className="leave-dialog"
          onClose={() => setLeave(false)}
        >
          <h2>입력을 취소하시겠어요?</h2>
          <p>
            이전 화면으로 돌아가면
            <br />
            입력 중인 아이 정보가 모두 사라져요.
          </p>
          <div className="dialog-actions">
            <button type="button" className="button" onClick={leaveForm}>
              뒤로 가기
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setLeave(false)}
            >
              계속 입력하기
            </button>
          </div>
        </WireDialog>
      )}
    </form>
  );
}
