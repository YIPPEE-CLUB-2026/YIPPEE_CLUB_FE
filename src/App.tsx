import { SocialCallbackPage } from "./screens/SocialCallbackPage";
import { FeatureNotice, UnavailablePage } from './components/FeatureNotice';
import { ParentRegistrationPage } from "./screens/ParentRegistrationPage";
import { useEffect, useState } from "react";
import { showToast } from "./components/Toast";
import {
  CheckoutPage,
  PaymentResultPage,
  PaymentCallbackPage,
} from "./screens/CheckoutPage";
import { ChildRegistrationPage } from "./screens/ChildRegistrationPage";
import { ReviewsPage } from "./screens/ReviewsPage";
import { PhoneChangePage } from "./screens/PhoneChangePage";
import { NotificationsPage } from "./screens/NotificationsPage";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./screens/HomePage";
import { ActivitiesPage } from "./screens/ActivitiesPage";
import { OrdersPage } from "./screens/OrdersPage";
import {
  OrderDetailPage,
  OrderCancelPage,
  ReceiptPage,
} from "./screens/OrderDetails";
import { ViewerPage } from "./screens/ViewerPage";
import { LoadingState } from "./components/LoadingState";
import { SystemFeedback } from "./components/SystemFeedback";
import { GrowthReportPage } from "./screens/GrowthReportPage";
import { InquiryDetailPage } from "./screens/InquiryDetailPage";
import {
  WalletPage,
  CouponsPage,
  CouponDetailPage,
  CashChargePage,
} from "./screens/WalletPages";
import { PopularPage } from "./screens/PopularPage";
import { BadgeGuidePage } from "./screens/BadgeGuidePage";
import { IdentityPage } from "./screens/IdentityPage";
import { ActivityWritePage } from "./screens/ActivityWritePage";
import {
  ReferenceRecommendationsPage as RecommendationsPage,
} from "./screens/ReferenceScreens";
import {
  BadgesPage,
  ProfilePage,
  ProfileEditPage,
  SavedPage,
} from "./screens/AccountPages";
import { listActivities } from "./services/activities";
import type { Activity } from "./types";
import { useAuth } from "./context/AuthContext";
import { apiRequest, readTokens } from "./lib/api";
import type { Paginated } from "./types";
import {
  PasswordChangePage,
  PasswordChangedPage,
} from "./screens/PasswordChangePage";
import { PasswordResetPage } from "./screens/PasswordResetPage";
import { AuthPage } from "./screens/AuthPage";
import { SearchPage } from "./screens/SearchPage";
import {
  FAQPage,
  InquiryPage,
  InquiryHistoryPage,
  NoticesPage,
  TextDocumentPage,
} from "./screens/SupportSubPages";
import {
  OnboardingPage,
  VersionPage,
  LicensesPage,
  WithdrawPage,
} from "./screens/MoreScreens";
import { CartPage, ActivityDetailPage } from "./screens/ConnectedPages";
import { DemoActivityDetailPage } from "./screens/DemoActivityDetailPage";
import { DemoActivityViewerPage } from "./screens/DemoActivityViewerPage";
import { ChildrenPage, ChildFormPage } from "./screens/ChildrenPages";
import {
  GuidesPage,
  GuideDetailPage,
  HowToPage,
  ActivityTypesPage,
  EmptyScreen,
  SettingsPage,
  NotificationSettingsPage,
  SupportPage,
} from "./screens/AdditionalPages";

export function App() {
  const { user, ready, requestLogin, isPreview, sessionError, reload } =
    useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  // 로그인한 사용자의 찜은 서버에 저장하며 사용자 변경 시 다시 조회합니다.
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const location = useLocation();
  const { pathname } = location;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    listActivities(controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setActivities(items);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "활동지를 불러오지 못했어요.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt, isPreview]);

  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setSavedIds([]);
    if (user)
      apiRequest<Paginated<Activity>>("/favorites?page_size=100", {
        signal: controller.signal,
      })
        .then((page) => {
          if (!controller.signal.aborted)
            setSavedIds(page.results.map((item) => item.id));
        })
        .catch((cause: Error) => {
          if (!controller.signal.aborted) setError(cause.message);
        });
    return () => controller.abort();
  }, [user?.id]);

  async function toggleSaved(id: number) {
    if (!user) {
      requestLogin();
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const saved = savedIds.includes(id);
      await apiRequest(saved ? `/favorites/${id}` : "/favorites", {
        method: saved ? "DELETE" : "POST",
        ...(saved ? {} : { body: JSON.stringify({ activity_id: id }) }),
      });
      setSavedIds((previous) =>
        saved ? previous.filter((item) => item !== id) : [...previous, id],
      );
      showToast(
        saved ? "찜을 해제했어요" : "찜 했어요",
        saved ? "123:2585" : "123:2540",
      );
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const catalogProps = { activities, savedIds, onToggle: toggleSaved };
  const needsCatalog =
    pathname === "/" ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/search") ||
    pathname === "/saved";

  if (!ready) return <LoadingState />;
  if (needsCatalog && loading) return <LoadingState label="활동지를 불러오는 중…" />;

  const privatePath =
    /^\/(?:orders|viewer|children|signup\/(?:parent|child)|saved|cart|checkout|profile\/edit|settings\/(?:password|withdraw)|activities\/[^/]+\/(?:record|reviews\/new))(?:\/|$)/.test(
      pathname,
    );
  if (!user && sessionError && readTokens() && privatePath)
    return (
      <main className="screen-content" role="alert">
        <p>{sessionError}</p>
        <button
          type="button"
          onClick={() => {
            void reload().catch(() => {});
          }}
        >
          다시 시도
        </button>
        <a href="/login">로그인하기</a>
      </main>
    );
  if (!user && privatePath)
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: pathname + location.search }}
      />
    );

  return (
    <>
      {needsCatalog && loading && (
        <div className="status-banner" role="status">
          활동지를 불러오고 있어요…
        </div>
      )}
      {needsCatalog && error && (
        <div className="status-banner status-banner--error" role="alert">
          {error}
          <button onClick={() => setAttempt((value) => value + 1)}>
            다시 시도
          </button>
        </div>
      )}
      {sessionError && !sessionError.includes("만료") && (
        <div className="info-panel" role="alert">
          <p>{sessionError}</p>
          <button
            type="button"
            onClick={() => {
              void reload().catch(() => requestLogin());
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      <SystemFeedback />
      {(/^\/(?:cash|points|coupons)(?:\/|$)/.test(pathname)) && <FeatureNotice message="캐시·쿠폰·포인트 기능은 준비 중이에요. 현재 표시된 잔액·내역은 실제 조회 결과가 아니며 충전·지급·사용은 처리되지 않아요." />}
      {(/^\/support\/inquiries(?:\/|$)/.test(pathname)) && <FeatureNotice message="사이트 내 문의 접수·답변 기능을 준비 중이에요. 문의는 yip2e2club.official@gmail.com으로 보내 주세요." />}
      {pathname === '/notifications' && <FeatureNotice message="알림 조회·읽음·삭제 기능을 준비 중이에요. 현재 알림 목록은 실제 수신 내역이 아니에요." />}
      {/^\/activities\/[^/]+\/(?:record|reviews(?:\/new)?)$/.test(pathname) && <FeatureNotice message="리뷰·활동 인증 저장과 조회는 준비 중이에요. 입력한 내용과 사진은 서버에 등록되지 않아요." />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage {...catalogProps} />} />
          <Route
            path="activities/popular"
            element={<PopularPage {...catalogProps} />}
          />
          <Route path="how-to/badges" element={<BadgeGuidePage />} />
          <Route path="signup/identity" element={<IdentityPage />} />
          <Route
            path="activities/:activityId/reviews/new"
            element={<ActivityWritePage activities={activities} />}
          />
          <Route
            path="activities/:activityId/record"
            element={<ActivityWritePage activities={activities} record />}
          />
          <Route
            path="activities"
            element={<ActivitiesPage {...catalogProps} />}
          />
          <Route
            path="activities/examples/:exampleSlug"
            element={<Navigate to="/activities" replace />}
          />
          <Route
            path="viewer/examples/:exampleSlug"
            element={<Navigate to="/activities" replace />}
          />
          <Route
            path="activities/:activityId"
            element={<ActivityDetailPage {...catalogProps} />}
          />
          <Route path="saved" element={<SavedPage {...catalogProps} />} />
          <Route
            path="search"
            element={
              <SearchPage
                key={`input-${user?.id || "guest"}`}
                {...catalogProps}
              />
            }
          />
          <Route
            path="search/results"
            element={
              <SearchPage
                key={`results-${user?.id || "guest"}`}
                {...catalogProps}
              />
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/edit" element={<ProfileEditPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="login" element={<AuthPage />} />
          <Route
            path="auth/callback/:provider"
            element={<SocialCallbackPage />}
          />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="version" element={<VersionPage />} />
          <Route path="licenses" element={<LicensesPage />} />
          <Route path="settings/withdraw" element={<WithdrawPage />} />
          <Route
            path="activities/:activityId/reviews"
            element={<ReviewsPage />}
          />
          <Route path="children" element={<ChildrenPage />} />
          <Route path="children/new" element={<ChildFormPage key="new" />} />
          <Route path="signup/parent" element={<ParentRegistrationPage />} />
          <Route path="signup/child" element={<ChildRegistrationPage onboarding />} />
          <Route
            path="children/:childId/edit"
            element={<ChildFormPage key={pathname} />}
          />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={<CheckoutPage activities={activities} />}
          />
          <Route
            path="checkout/payment"
            element={<Navigate to="/checkout" replace />}
          />
          <Route path="checkout/success" element={<PaymentCallbackPage />} />
          <Route path="checkout/fail" element={<PaymentCallbackPage />} />
          <Route path="checkout/result" element={<PaymentResultPage />} />
          <Route
            path="recommendations"
            element={<RecommendationsPage {...catalogProps} />}
          />
          <Route path="activity-types" element={<ActivityTypesPage />} />
          <Route path="guide" element={<GuidesPage />} />
          <Route path="guides" element={<GuidesPage />} />
          <Route path="guides/:guideId" element={<GuideDetailPage />} />
          <Route path="how-to" element={<HowToPage />} />
          <Route path="viewer/:activityId" element={<ViewerPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="orders/:orderId/cancel" element={<OrderCancelPage />} />
          <Route path="orders/:orderId/receipt" element={<ReceiptPage />} />
          <Route path="records" element={<UnavailablePage title="활동 기록" message="활동 인증·기록 저장 기능을 준비 중이에요. 현재는 활동을 완료해도 기록이 쌓이지 않아요." />} />
          <Route path="reports/growth" element={<GrowthReportPage />} />
          <Route path="cards" element={<UnavailablePage title="결제 카드 관리" message="카드 저장·기본 카드 설정은 준비 중이에요. 활동지 결제 시 토스 결제창에서 결제 수단을 선택해 주세요." />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="coupons/:couponId" element={<CouponDetailPage />} />
          <Route path="cash" element={<WalletPage kind="cash" />} />
          <Route path="cash/charge" element={<CashChargePage />} />
          <Route path="points" element={<WalletPage kind="points" />} />
          <Route
            path="settings/bank-account"
            element={<UnavailablePage title="계좌 정보" message="계좌 정보 등록·조회 기능을 준비 중이에요. 고객센터로 문의해 주세요." />}
          />
          <Route
            path="settings/contracts"
            element={<UnavailablePage title="계약 정보" message="계약 정보 조회 기능을 준비 중이에요. 고객센터로 문의해 주세요." />}
          />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="settings/notifications"
            element={<NotificationSettingsPage />}
          />
          <Route path="support" element={<SupportPage />} />
          <Route path="support/faq" element={<FAQPage />} />
          <Route path="support/inquiries/new" element={<InquiryPage />} />
          <Route path="support/inquiries" element={<InquiryHistoryPage />} />
          <Route
            path="support/inquiries/:inquiryId"
            element={<InquiryDetailPage />}
          />
          <Route path="notices" element={<NoticesPage />} />
          <Route path="notices/:noticeId" element={<TextDocumentPage />} />
          <Route path="policies/:type" element={<TextDocumentPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="cards/new" element={<UnavailablePage title="카드 추가" message="카드 등록 기능은 준비 중이며 카드 정보를 입력받지 않아요. 실제 결제는 토스 결제창에서 진행해 주세요." />} />
          <Route path="settings/password" element={<PasswordChangePage />} />
          <Route path="password/changed" element={<PasswordChangedPage />} />
          <Route path="settings/phone" element={<PhoneChangePage />} />
          <Route
            path="password/reset"
            element={<PasswordResetPage key={location.key} />}
          />
          <Route
            path="system/network"
            element={<EmptyScreen kind="network" />}
          />
          <Route path="system/loading" element={<LoadingState />} />
          <Route path="system/server" element={<EmptyScreen kind="server" />} />
          <Route
            path="system/maintenance"
            element={<EmptyScreen kind="maintenance" />}
          />
          <Route path="*" element={<EmptyScreen kind="missing" />} />
        </Route>
      </Routes>
    </>
  );
}
