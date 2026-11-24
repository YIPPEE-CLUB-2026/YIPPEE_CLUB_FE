import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
import { OrderActivityRow } from './OrderDetails';
import type { Activity } from '../types';
import type { Coupon } from './WalletPages';
import { demoActivities } from '../data/demo-activities';

interface CheckoutWallet {
  cash: number;
  points: number;
  coupons: Coupon[];
}
interface PaymentSelection {
  activityIds: number[];
  couponId?: string;
  cash: number;
  points: number;
  method: string;
}
interface PaymentResult {
  status: 'success' | 'failed' | 'unknown';
  items: Activity[];
  total: number;
  orderId?: string;
  cash?: number;
  message?: string;
}
const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
export function CheckoutPage({
  activities,
  wallet,
  onPay,
}: {
  activities: Activity[];
  wallet?: CheckoutWallet;
  onPay?: (selection: PaymentSelection) => Promise<{ orderId: string }>;
}) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ids: number[] = Array.isArray(state?.activityIds)
    ? state.activityIds.filter((id: unknown) => typeof id === 'number')
    : [];
  const demoActivity = demoActivities.find(
    (item) => item.slug === state?.demoActivitySlug,
  );
  const items = (demoActivity ? [demoActivity] : activities).filter((item) =>
    ids.includes(item.id),
  );
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const [method, setMethod] = useState('card');
  const [agreed, setAgreed] = useState(false);
  const [sheet, setSheet] = useState<'coupon' | 'cash' | 'points' | 'method'>();
  const [couponId, setCouponId] = useState<string>();
  const [draftCoupon, setDraftCoupon] = useState<string>();
  const [requestedCash, setRequestedCash] = useState(0);
  const [requestedPoints, setRequestedPoints] = useState(0);
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const coupons = wallet?.coupons.filter((item) => !item.used) || [];
  const coupon = coupons.find((item) => item.id === couponId);
  const discount = Math.min(total, Math.max(0, coupon?.discount || 0));
  const cash = Math.max(
    0,
    Math.min(requestedCash, wallet?.cash || 0, total - discount),
  );
  const points = Math.max(
    0,
    Math.min(requestedPoints, wallet?.points || 0, total - discount - cash),
  );
  const payable = total - discount - cash - points;
  const available =
    sheet === 'cash'
      ? Math.max(0, Math.min(wallet?.cash || 0, total - discount - points))
      : Math.max(0, Math.min(wallet?.points || 0, total - discount - cash));
  function openAmount(kind: 'cash' | 'points') {
    setAmount(String(kind === 'cash' ? cash : points));
    setSheet(kind);
  }
  async function pay() {
    if (pending.current || !agreed || !items.length) return;
    if (!onPay || demoActivity) {
      setNotice(true);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const result = await onPay({
        activityIds: items.map((item) => item.id),
        couponId: coupon?.id,
        cash,
        points,
        method,
      });
      navigate('/checkout/result', {
        replace: true,
        state: {
          paymentResult: {
            status: 'success',
            items,
            total: payable,
            orderId: result.orderId,
            cash,
          } satisfies PaymentResult,
        },
      });
    } catch (cause) {
      const code =
        typeof cause === 'object' && cause && 'code' in cause
          ? String(cause.code)
          : '';
      navigate('/checkout/result', {
        replace: true,
        state: {
          paymentResult: {
            status: /TIMEOUT|NETWORK/.test(code) ? 'unknown' : 'failed',
            items,
            total: payable,
            message: cause instanceof Error ? cause.message : undefined,
          } satisfies PaymentResult,
        },
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (busy)
    return (
      <div className="screen payment-processing" data-figma-node="123:3885">
        <div className="screen-content screen-content--center" role="status">
          <img
            className="system-loading__icon"
            src="/assets/594ba.svg"
            alt=""
          />
          <h2>결제하고 있어요</h2>
          <p>화면을 닫지 말고 잠시만 기다려 주세요.</p>
        </div>
      </div>
    );
  return (
    <div
      className="screen wire-checkout"
      data-figma-node={
        cash > 0 && payable === 0 ? '123:3816' : coupon ? '123:3741' : '116:622'
      }
    >
      <ScreenHeader
        title="결제하기"
        backTo={
          demoActivity ? `/activities/examples/${demoActivity.slug}` : '/cart'
        }
      />
      <div className="screen-content">
        <h2>주문 활동지 {items.length}개</h2>
        {items.map((item) => (
          <OrderActivityRow key={item.id} item={item} />
        ))}
        {wallet && (
          <>
            <h2>할인</h2>
            <button
              className="checkout-option"
              onClick={() => {
                setDraftCoupon(couponId);
                setSheet('coupon');
              }}
            >
              <span>{coupon?.title || '쿠폰 선택'}</span>
              <span>
                {coupon ? `-${money(discount)}` : `${coupons.length}장`}
                <Icon name="chevron" size={16} />
              </span>
            </button>
            <button
              className="checkout-option"
              onClick={() => openAmount('cash')}
            >
              <span>만세 캐시</span>
              <span>
                {cash ? `-${money(cash)}` : money(wallet.cash)}
                <Icon name="chevron" size={16} />
              </span>
            </button>
            <button
              className="checkout-option"
              onClick={() => openAmount('points')}
            >
              <span>만세포인트</span>
              <span>
                {points ? `-${points}P` : `${wallet.points}P`}
                <Icon name="chevron" size={16} />
              </span>
            </button>
          </>
        )}
        {payable > 0 && (
          <>
            <div className="section-heading">
              <h2>결제 수단</h2>
              <Link className="text-button" to="/cards/new">
                새 카드 등록
              </Link>
            </div>
            <div className="chips">
              {[
                ['card', '등록 카드'],
                ['simple', '간편결제'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`chip ${method === value ? 'is-selected' : ''}`}
                  aria-pressed={method === value}
                  onClick={() => setMethod(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
        <h2>결제 금액</h2>
        <div className="order-info">
          <div>
            <span>활동지 금액</span>
            <span>{money(total)}</span>
          </div>
          {discount > 0 && (
            <div>
              <span>할인 금액</span>
              <span>-{money(discount)}</span>
            </div>
          )}
          {cash > 0 && (
            <div>
              <span>사용 캐시</span>
              <span>-{money(cash)}</span>
            </div>
          )}
          {points > 0 && (
            <div>
              <span>사용 포인트</span>
              <span>-{points}P</span>
            </div>
          )}
          <div>
            <strong>최종 결제 금액</strong>
            <strong>{money(payable)}</strong>
          </div>
        </div>
        <div className="checkout-agreement">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            주문 내용을 확인했고 결제에 동의합니다.
          </label>
          <Link className="text-button" to="/policies/terms">
            보기
          </Link>
        </div>
      </div>
      <div className="screen-actions">
        <button
          className="button button--primary"
          disabled={!agreed || !items.length}
          onClick={() => void pay()}
        >
          {money(payable)} 결제하기
        </button>
      </div>
      {sheet && (
        <WireDialog
          title={
            sheet === 'coupon'
              ? '쿠폰 선택'
              : sheet === 'cash'
                ? '만세 캐시 사용'
                : sheet === 'points'
                  ? '만세포인트 사용'
                  : '결제 수단 변경'
          }
          sheet
          className="checkout-sheet"
          onClose={() => setSheet(undefined)}
        >
          <div className="section-heading">
            <h2>
              {sheet === 'coupon'
                ? '쿠폰 선택'
                : sheet === 'cash'
                  ? '만세 캐시 사용'
                  : sheet === 'points'
                    ? '만세포인트 사용'
                    : '결제 수단 변경'}
            </h2>
            <button
              className="icon-button"
              aria-label="결제 옵션 닫기"
              onClick={() => setSheet(undefined)}
            >
              <Icon name="close" />
            </button>
          </div>
          {sheet === 'coupon' ? (
            coupons.length ? (
              <>
                <div className="sort-options">
                  <label>
                    쿠폰 적용 안 함
                    <input
                      type="radio"
                      name="checkout-coupon"
                      checked={!draftCoupon}
                      onChange={() => setDraftCoupon(undefined)}
                    />
                  </label>
                  {coupons.map((item) => (
                    <label key={item.id}>
                      {item.title}
                      <input
                        type="radio"
                        name="checkout-coupon"
                        checked={draftCoupon === item.id}
                        onChange={() => setDraftCoupon(item.id)}
                      />
                    </label>
                  ))}
                </div>
                <button
                  className="button button--primary"
                  onClick={() => {
                    setCouponId(draftCoupon);
                    setSheet(undefined);
                  }}
                >
                  적용하기
                </button>
              </>
            ) : (
              <>
                <p className="wire-note">사용할 수 있는 쿠폰이 없어요.</p>
                <button className="button" onClick={() => setSheet(undefined)}>
                  닫기
                </button>
              </>
            )
          ) : sheet === 'method' ? (
            <>
              <div className="sort-options">
                {[
                  ['card', '등록 카드'],
                  ['simple', '간편결제'],
                ].map(([value, label]) => (
                  <label key={value}>
                    {label}
                    <input
                      type="radio"
                      name="payment-method"
                      checked={method === value}
                      onChange={() => setMethod(value)}
                    />
                  </label>
                ))}
              </div>
              <button
                className="button button--primary"
                onClick={() => setSheet(undefined)}
              >
                적용하기
              </button>
            </>
          ) : (
            <>
              <p className="wire-note">
                보유 {sheet === 'cash' ? '캐시' : '포인트'}{' '}
                {sheet === 'cash'
                  ? money(wallet?.cash || 0)
                  : `${wallet?.points || 0}P`}
              </p>
              <label className="wire-field">
                {sheet === 'cash' ? '사용할 금액' : '사용할 포인트'}
                <input
                  inputMode="numeric"
                  value={amount}
                  placeholder={sheet === 'cash' ? '0원' : '0P'}
                  onChange={(event) =>
                    setAmount(event.target.value.replace(/\D/g, ''))
                  }
                />
              </label>
              <button
                className="button"
                onClick={() => setAmount(String(available))}
              >
                전액 사용
              </button>
              <button
                className="button button--primary"
                disabled={Number(amount) > available}
                onClick={() => {
                  if (sheet === 'cash') setRequestedCash(Number(amount) || 0);
                  else setRequestedPoints(Number(amount) || 0);
                  setSheet(undefined);
                }}
              >
                적용하기
              </button>
            </>
          )}
        </WireDialog>
      )}
      {notice && (
        <WireDialog
          title="결제 안내"
          className="system-feedback"
          onClose={() => setNotice(false)}
        >
          <h2>결제 기능 준비 중</h2>
          <p>결제가 진행되지 않았어요.</p>
          <button
            className="button button--primary"
            onClick={() => setNotice(false)}
          >
            확인
          </button>
        </WireDialog>
      )}
    </div>
  );
}
export function PaymentResultPage({
  result: supplied,
}: {
  result?: PaymentResult;
}) {
  const { state } = useLocation();
  const result =
    supplied || (state?.paymentResult as PaymentResult | undefined);
  if (
    !result ||
    !['success', 'failed', 'unknown'].includes(result.status) ||
    !Array.isArray(result.items) ||
    !Number.isFinite(result.total)
  )
    return <Navigate to="/orders" replace />;
  const success = result.status === 'success';
  const unknown = result.status === 'unknown';
  return (
    <div
      className="screen payment-result"
      data-figma-node={
        success
          ? result.cash
            ? '123:3917'
            : '116:701'
          : unknown
            ? '123:3909'
            : '123:3899'
      }
    >
      <div className="screen-content screen-content--center">
        <div className={success ? 'payment-result__check' : 'empty-circle'}>
          {success && <Icon name="check" size={40} />}
        </div>
        <h2>
          {success
            ? '결제가 완료되었어요'
            : unknown
              ? '결제 결과를 확인하지 못했어요'
              : '결제에 실패했어요'}
        </h2>
        <p>
          {success
            ? '구매한 활동지는 저장 탭에서 다시 볼 수 있어요.'
            : unknown
              ? '결제 내역에서 결제 여부를 먼저 확인해 주세요.'
              : '카드 정보를 확인하거나 다른 결제 수단을 선택해 주세요.'}
        </p>
        {success && (
          <>
            <div className="order-info">
              <div>
                <span>{result.cash ? '사용 캐시' : '활동지'}</span>
                <span>
                  {result.cash
                    ? money(result.cash)
                    : `${result.items.length}개`}
                </span>
              </div>
              <div>
                <strong>결제 금액</strong>
                <strong>{money(result.total)}</strong>
              </div>
            </div>
            <div className="payment-result__links">
              <Link
                className="text-button"
                to={`/orders/${result.orderId}/receipt`}
              >
                영수증 보기
              </Link>
              <Link className="text-button" to="/orders">
                결제 내역
              </Link>
            </div>
          </>
        )}
      </div>
      <div className="screen-actions">
        {success ? (
          <>
            <Link
              className="button button--primary"
              to={result.items[0] ? `/viewer/${result.items[0].id}` : '/saved'}
            >
              활동지 바로 보기
            </Link>
            <Link className="button" to="/">
              홈으로
            </Link>
          </>
        ) : unknown ? (
          <Link className="button button--primary" to="/orders">
            결제 내역 확인
          </Link>
        ) : (
          <>
            <Link
              className="button button--primary"
              to="/checkout"
              state={{ activityIds: result.items.map((item) => item.id) }}
            >
              다시 결제하기
            </Link>
            <Link className="button" to="/cards">
              결제 수단 변경
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
