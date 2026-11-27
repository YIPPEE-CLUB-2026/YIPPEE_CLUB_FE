import { listPurchases } from "../services/activities";
import type { Activity } from "../types";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ActivityCard } from "../components/ActivityCard";
import { Icon } from "../components/Icon";
import { ScreenHeader } from "../components/ScreenHeader";
import { WireDialog } from "../components/WireDialog";
import type { CatalogProps } from "./HomePage";
import { useAuth } from "../context/AuthContext";
import { useChildren } from "../context/ChildrenContext";
import { LoginPrompt } from "./ConnectedPages";

export function SavedPage({ activities, savedIds, onToggle }: CatalogProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState("favorites");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const saved = activities.filter((activity) => savedIds.includes(activity.id));
  const [purchases, setPurchases] = useState<Activity[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    setPurchases([]);
    if (user && tab === "purchases")
      listPurchases(controller.signal)
        .then(setPurchases)
        .catch((cause: Error) => {
          if (!controller.signal.aborted) setError(cause.message);
        });
    return () => controller.abort();
  }, [user?.id, tab]);
  const items = tab === "favorites" ? saved : purchases;
  return (
    <div
      className={`page-content ${editing ? "saved-page--editing" : ""}`}
      data-figma-node={
        editing ? "133:4786" : items.length ? "117:999" : "117:1098"
      }
    >
      <header className="page-header">
        <h1>저장</h1>
        <div className="header-actions">
          {saved.length > 0 && tab === "favorites" && (
            <button
              className="text-button"
              onClick={() => {
                setSelected(saved.map((item) => item.id));
                setEditing(!editing);
              }}
            >
              {editing ? "완료" : "편집"}
            </button>
          )}
          <Link className="icon-button" to="/cart" aria-label="장바구니">
            <Icon name="cart" />
          </Link>
        </div>
      </header>
      <div className="tabs" aria-label="저장 목록 종류">
        {[
          ["favorites", "저장한 활동지"],
          ["purchases", "구매한 활동지"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? "is-selected" : ""}
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value);
              setEditing(false);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {items.length ? (
        <div className="activity-grid">
          {items.map((activity) => (
            <div className="saved-card-wrap" key={activity.id}>
              <ActivityCard
                activity={activity}
                saved={savedIds.includes(activity.id)}
                onToggle={onToggle}
                showSave={!editing}
              />
              {tab === "purchases" && (
                <div className="purchase-card-actions">
                  <Link
                    className="button button--small"
                    aria-disabled={activity.expired || undefined}
                    onClick={(event) => {
                      if (activity.expired) event.preventDefault();
                    }}
                    to={`/viewer/${activity.id}`}
                  >
                    {activity.expired ? "이용 기간 종료" : "활동지 보기"}
                  </Link>
                  <Link
                    className="button button--small"
                    to={`/activities/${activity.id}/record`}
                  >
                    활동 인증하기
                  </Link>
                  <Link
                    className="text-button"
                    to={`/activities/${activity.id}/reviews/new`}
                  >
                    리뷰 쓰기
                  </Link>
                </div>
              )}
              {editing && (
                <input
                  className="saved-card-check"
                  aria-label={`${activity.title} 선택`}
                  type="checkbox"
                  checked={selected.includes(activity.id)}
                  onChange={(event) =>
                    setSelected(
                      event.target.checked
                        ? [...selected, activity.id]
                        : selected.filter((id) => id !== activity.id),
                    )
                  }
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="wire-empty wire-empty--search">
          <div className="empty-circle" />
          <h2>
            {tab === "favorites"
              ? "저장한 활동지가 없어요"
              : "구매한 활동지가 없어요"}
          </h2>
          <p>
            {tab === "favorites"
              ? "마음에 드는 활동지의 하트를 눌러보세요."
              : "구매한 활동지는 이곳에서 확인할 수 있어요."}
          </p>
        </div>
      )}
      {editing && (
        <div className="saved-edit-actions">
          <button
            className="button"
            onClick={() => setSelected(saved.map((item) => item.id))}
          >
            전체 선택
          </button>
          <button
            className="button button--primary"
            disabled={!selected.length}
            onClick={() => setRemoveConfirm(true)}
          >
            {selected.length}개 빼기
          </button>
        </div>
      )}
      {removeConfirm && (
        <WireDialog
          title="저장 해제"
          onClose={() => {
            if (!busy) setRemoveConfirm(false);
          }}
        >
          <h2>저장을 해제할까요?</h2>
          <div className="dialog-actions">
            <button
              className="button"
              disabled={busy}
              onClick={() => setRemoveConfirm(false)}
            >
              취소
            </button>
            <button
              className="button button--primary"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void (async () => {
                  for (const id of selected) await onToggle(id);
                  setRemoveConfirm(false);
                  setEditing(false);
                })()
                  .catch((cause: Error) => setError(cause.message))
                  .finally(() => setBusy(false));
              }}
            >
              해제
            </button>
          </div>
        </WireDialog>
      )}
    </div>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  const { activeChild: child } = useChildren();
  return (
    <div className="profile-page" data-figma-node="118:1014">
      <div className="profile-top">
        <header className="page-header">
          <h1>내 정보</h1>
          <div className="header-actions">
            <Link className="icon-button" to="/notifications" aria-label="알림">
              <Icon name="bell" />
            </Link>
            <Link className="icon-button" to="/settings" aria-label="설정">
              <Icon name="settings" />
            </Link>
          </div>
        </header>
        <div className="profile-summary">
          <div className="profile-avatar">
            <img src="/assets/01e9f.svg" alt="" />
          </div>
          <div>
            <div className="profile-summary__identity">
              <h2>{user ? user.name || "회원" : "로그인해 주세요"}</h2>
              {user?.nickname && (
                <p className="profile-summary__nickname">{user.nickname}</p>
              )}
            </div>
            <Link className="button" to={user ? "/profile/edit" : "/login"}>
              {user && <Icon name="edit" size={16} />}
              {user ? "프로필 편집하기" : "로그인"}
            </Link>
          </div>
        </div>
        <div className="profile-balances">
          <Link to="/cash">
            <span>만세 캐시</span>
            <strong>0원</strong>
          </Link>
          <Link to="/coupons">
            <span>쿠폰함</span>
            <strong>0장</strong>
          </Link>
          <Link to="/points">
            <span>만세포인트</span>
            <strong>0P</strong>
          </Link>
        </div>
      </div>
      <Link
        className="profile-badge-link"
        to="/badges"
        aria-label={`${child?.name || "우리 아이"}의 만세도감 보러가기`}
      >
        <img src="/assets/design/badge-help-b62f1.png" alt="" />
        <span>
          <strong>우리 아이 만세도감</strong>
          <small>놀이하며 모은 배지를 확인해요</small>
        </span>
        <Icon name="chevron" size={20} />
      </Link>
      <div className="profile-menu">
        {[
          ["/children", "나의 아이 정보"],
          ["/orders", "결제 내역"],
          ["/cards", "결제 카드 관리"],
          ["/support/faq", "자주 묻는 질문"],
        ].map(([path, label]) => (
          <Link className="menu-row" key={path} to={path}>
            {label}
            <Icon name="chevron" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProfileEditPage() {
  const { user, saveProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [salutation, setSalutation] = useState(user?.nickname || "");
  const supportsNickname = user?.nickname !== undefined;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(false);
  const [photoNotice, setPhotoNotice] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true);
    setError("");
    try {
      await saveProfile(name, supportsNickname ? salutation : undefined);
      navigate("/profile", { replace: true });
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="screen" onSubmit={save} data-figma-node="118:1112">
      <ScreenHeader title="프로필 편집" backTo="/profile" />
      {!user ? (
        <LoginPrompt />
      ) : (
        <>
          <div className="screen-content form-stack">
            <div className="profile-edit-photo">
              <div className="profile-avatar" />
              <button
                className="text-button"
                type="button"
                onClick={() => setPhoto(true)}
              >
                사진 변경
              </button>
            </div>
            <label className="wire-field">
              이름
              <input
                required
                disabled={busy}
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {supportsNickname && (
              <>
                <h2 className="wire-subtitle">호칭</h2>
                <div className="chips">
                  {["어머님", "아버님", "보호자"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`chip ${salutation === value ? "is-selected" : ""}`}
                      aria-pressed={salutation === value}
                      onClick={() => setSalutation(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="screen-actions">
            <button
              className="button button--primary"
              disabled={busy || !name.trim()}
            >
              {busy ? "저장 중…" : "저장하기"}
            </button>
          </div>
        </>
      )}
      {photo && (
        <WireDialog
          title="프로필 사진 변경"
          sheet
          onClose={() => setPhoto(false)}
        >
          <div className="section-heading">
            <h2>프로필 사진</h2>
            <button
              type="button"
              className="icon-button"
              aria-label="프로필 사진 닫기"
              onClick={() => setPhoto(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          {["사진 찍기", "앨범에서 고르기", "기본 이미지로 변경"].map(
            (label) => (
              <button
                key={label}
                type="button"
                className="button"
                onClick={() => {
                  setPhoto(false);
                  setPhotoNotice(true);
                }}
              >
                {label}
              </button>
            ),
          )}
        </WireDialog>
      )}
      {photoNotice && (
        <WireDialog
          title="프로필 사진 안내"
          onClose={() => setPhotoNotice(false)}
        >
          <p>프로필 사진 변경 기능을 준비하고 있어요.</p>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setPhotoNotice(false)}
          >
            확인
          </button>
        </WireDialog>
      )}
    </form>
  );
}

export { BadgesPage } from "./BadgeBookPage";
