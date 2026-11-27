import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { OneClickOverlay } from "./ReferenceScreens";
import type { Activity } from "../types";
import { trendingKeywords } from "../data/activities";

import { HorizontalRail } from "../components/HorizontalRail";
import { ActivityCard } from "../components/ActivityCard";
import { Icon } from "../components/Icon";
import { GuideViewer } from "../components/GuideViewer";
import { PlayCategoryIcon } from "../components/PlayCategoryIcon";
import { useAuth } from "../context/AuthContext";
import { useChildren } from "../context/ChildrenContext";
import { ServiceFooter } from "../components/ServiceFooter";

export interface CatalogProps {
  activities: Activity[];
  savedIds: number[];
  onToggle: (id: number) => void | Promise<void>;
}

export function TrendingKeywords({
  collapsible = true,
  onSearch,
  compact = false,
}: {
  collapsible?: boolean;
  onSearch?: (value: string) => void;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const listId = useId();

  return (
    <section className={`section ${compact ? "section--compact" : ""}`}>
      <h2>실시간 검색어</h2>
      <div className="trending-box">
        <div className="section-heading">
          {collapsible && (
            <button
              className="text-button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "접기" : "펼치기"}
            </button>
          )}
        </div>
        {expanded && (
          <ol id={listId} className="trending-list">
            {trendingKeywords.map((keyword, index) => (
              <li key={keyword}>
                {onSearch ? (
                  <button
                    className="trending-keyword"
                    type="button"
                    onClick={() => onSearch(keyword)}
                  >
                    <span>{index + 1}</span>
                    {keyword}
                  </button>
                ) : (
                  <Link to={`/search/results?q=${encodeURIComponent(keyword)}`}>
                    <span>{index + 1}</span>
                    {keyword}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

export function HomePage({ activities, savedIds, onToggle }: CatalogProps) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, ready, requestLogin } = useAuth();
  const { activeChild: child, children, select } = useChildren();
  const [selecting, setSelecting] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const popularActivities = activities;
  async function chooseChild(id: number) {
    setSelecting(true);
    setSelectionError("");
    try {
      await select(id);
    } catch (cause) {
      setSelectionError((cause as Error).message);
    } finally {
      setSelecting(false);
    }
  }
  useEffect(() => {
    if (
      ready &&
      !user &&
      sessionStorage.getItem("yippee.guest.browsing") !== "true"
    )
      requestLogin();
  }, [ready, user]);
  return (
    <div
      className="home-page"
      data-figma-node={user ? (child ? "122:1781" : "122:1891") : "168:4872"}
    >
      <header className="home-header">
        <Link
          to="/badges"
          className="avatar-placeholder"
          aria-label="만세도감"
          onClick={(event) => {
            if (!user) {
              event.preventDefault();
              requestLogin();
            }
          }}
        >
          <img src="/assets/design/badge-guide-f4942.png" alt="" />
        </Link>
        <h1>YIPPEE CLUB</h1>
        <div className="header-actions">
          <Link className="icon-button" to="/notifications" aria-label="알림">
            <Icon name="bell" />
          </Link>
          {user && (
            <Link className="icon-button" to="/cart" aria-label="장바구니">
              <Icon name="cart" />
            </Link>
          )}
        </div>
      </header>
      <div className="home-content">
        {user ? (
          <h2 className="home-greeting">
            {child ? (
              <>
                <em>{child.name}</em> 부모님,
                <br />
                오늘은 어떤 특별한 놀이를 해볼까요?
              </>
            ) : (
              <>
                {children.length ? "아이를 선택하면" : "아이를 등록하면"}
                <br />
                맞춤 놀이를 찾아드려요
              </>
            )}
          </h2>
        ) : (
          <h2 className="home-greeting">
            사랑하는 아이와 함께 집에서도,
            <br />
            지금 바로 놀이할 수 있어요!
          </h2>
        )}
        {user ? (
          !child && (
            <section className="info-panel home-child-invite">
              <strong>
                {children.length
                  ? "놀이할 아이를 선택해 주세요."
                  : "우리 아이 정보를 저장해주세요."}
              </strong>
              {children.length ? (
                <label className="wire-field">
                  놀이할 아이
                  <select
                    aria-label="놀이할 아이"
                    value=""
                    disabled={selecting}
                    onChange={(event) => {
                      if (event.target.value)
                        void chooseChild(Number(event.target.value));
                    }}
                  >
                    <option value="">아이 선택</option>
                    {children.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <Link className="button button--primary" to="/children/new">
                  아이 등록하기
                </Link>
              )}
              {selectionError && (
                <p className="form-error" role="alert">
                  {selectionError}
                </p>
              )}
            </section>
          )
        ) : (
          <>
            <section className="intro-grid" aria-label="이용방법">
              <Link
                className="intro-card"
                to="/how-to"
                onClick={(event) => {
                  event.preventDefault();
                  setParams({ guide: "how-to" });
                }}
              >
                <small>이용방법</small>
                <strong>
                  YIPPEECLUB에
                  <br />
                  처음 오셨나요?
                </strong>
                <img
                  className="intro-card__art"
                  src="/assets/design/badge-guide-f4942.png"
                  alt=""
                />
              </Link>
              <Link
                className="intro-card"
                to="/how-to/badges"
                onClick={(event) => {
                  event.preventDefault();
                  setParams({ guide: "badges" });
                }}
              >
                <small>이용방법</small>
                <strong>
                  즐겁게 놀이하면
                  <br />
                  쌓이는 활동배지
                </strong>
                <img
                  className="intro-card__art intro-card__art--badge"
                  src="/assets/design/badge-help-b62f1.png"
                  alt=""
                />
              </Link>
            </section>
            <button
              type="button"
              className="button button--primary"
              onClick={requestLogin}
            >
              오늘부터 놀이활동 시작하기
            </button>
          </>
        )}
        <section className="home-category-panel" aria-label="놀이 유형">
          <div className="home-category-grid">
            {[
              "그림/색칠",
              "만들기",
              "한글",
              "숫자",
              "역할",
              "영어",
              "음악",
              "체육",
            ].map((category) => (
              <Link
                key={category}
                to={`/activity-types?category=${encodeURIComponent(category)}`}
              >
                <PlayCategoryIcon category={category} />
              </Link>
            ))}
          </div>
          <Link
            className="button button--primary"
            to="/?finder=1"
            onClick={(event) => {
              if (!user) {
                event.preventDefault();
                requestLogin();
              }
            }}
          >
            원클릭 맞춤형 놀이 찾기
          </Link>
        </section>
        <section className="section">
          <div className="section-heading">
            <h2>
              지금 만나보는
              <br />
              활동지
            </h2>
            <Link className="text-link" to="/activities/popular">
              전체보기 <Icon name="chevron" size={16} />
            </Link>
          </div>
          <HorizontalRail
            label="인기 활동지"
            className="home-activity-track home-activity-track--examples"
          >
            {popularActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                saved={false}
                onToggle={onToggle}
                preview={!user}
                onPreview={requestLogin}
                detailTo={`/activities/${activity.id}`}
                showPreviewMeta
                showSave={!user}
              />
            ))}
          </HorizontalRail>
        </section>
        <TrendingKeywords />
        <section className="section">
          <div className="section-heading">
            <h2>엄마아빠 가이드북</h2>
            <Link className="text-link" to="/guides">
              전체보기 <Icon name="chevron" size={16} />
            </Link>
          </div>
          <HorizontalRail
            label="엄마아빠 가이드북"
            className="home-guide-track"
          >
            {["낯가리는 아이", "약속하기 연습"].map((title, index) => (
              <Link
                className="guide-row"
                to={`/guides/${index + 1}`}
                key={title}
              >
                <span className="guide-row__thumbnail guide-row__label" aria-hidden="true">가이드</span>
                <span>{title}</span>
                <Icon name="chevron" />
              </Link>
            ))}
          </HorizontalRail>
        </section>
      </div>
      <ServiceFooter />
      {["how-to", "badges"].includes(params.get("guide") || "") && (
        <GuideViewer
          kind={params.get("guide") === "badges" ? "badges" : "how-to"}
          onClose={() => setParams({}, { replace: true })}
        />
      )}
      {params.get("finder") === "1" && (
        <OneClickOverlay
          activities={activities}
          onClose={() => setParams({}, { replace: true })}
          onFind={(playFilters) => {
            if (!user) requestLogin();
            else
              navigate("/recommendations", {
                replace: true,
                state: { playFilters },
              });
          }}
        />
      )}
    </div>
  );
}
