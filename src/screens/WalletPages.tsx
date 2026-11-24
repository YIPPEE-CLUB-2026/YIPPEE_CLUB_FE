import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';

export interface WalletTransaction {
  id: string;
  title: string;
  date: string;
  amount: number;
}
export interface Coupon {
  id: string;
  title: string;
  expires: string;
  discount: number;
  used?: boolean;
  usedAt?: string;
  notes?: string[];
}
export function WalletPage({
  kind,
  balance = 0,
  transactions = [],
}: {
  kind: 'cash' | 'points';
  balance?: number;
  transactions?: WalletTransaction[];
}) {
  const cash = kind === 'cash';
  const [filter, setFilter] = useState('전체');
  const rows = transactions.filter(
    (item) =>
      filter === '전체' ||
      (filter === '사용' ? item.amount < 0 : item.amount > 0),
  );
  return (
    <div
      className="screen wire-wallet"
      data-figma-node={
        transactions.length
          ? cash
            ? '124:4416'
            : '124:4449'
          : cash
            ? '118:1184'
            : '118:1237'
      }
    >
      <ScreenHeader
        title={cash ? '만세 캐시' : '만세포인트'}
        backTo="/profile"
      />
      <div className="screen-content">
        <section className="wire-wallet__balance">
          <small>{cash ? '보유 캐시' : '보유 포인트'}</small>
          <strong>
            {balance.toLocaleString('ko-KR')}
            {cash ? '원' : 'P'}
          </strong>
        </section>
        {transactions.length ? (
          <>
            <div className="chips">
              {['전체', '적립·충전', '사용'].map((value) => (
                <button
                  key={value}
                  className={`chip ${filter === value ? 'is-selected' : ''}`}
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            {rows.map((item) => (
              <div className="wallet-transaction" key={item.id}>
                <div>
                  <p>{item.title}</p>
                  <small>{item.date}</small>
                </div>
                <strong>
                  {item.amount > 0 ? '+' : ''}
                  {item.amount.toLocaleString('ko-KR')}
                  {cash ? '원' : 'P'}
                </strong>
              </div>
            ))}
          </>
        ) : (
          <>
            <h2>{cash ? '이용 내역' : '적립·사용 내역'}</h2>
            <p className="wire-note">
              {cash ? '이용 내역이 없어요.' : '내역이 없어요.'}
            </p>
          </>
        )}
      </div>
      {cash && !transactions.length && (
        <div className="screen-actions">
          <Link className="button button--primary" to="/cash/charge">
            충전하기
          </Link>
        </div>
      )}
    </div>
  );
}

export function CouponsPage({
  coupons = [],
  onRegister,
}: {
  coupons?: Coupon[];
  onRegister?: (code: string) => Promise<Coupon>;
}) {
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState(false);
  const [used, setUsed] = useState(false);
  const [issued, setIssued] = useState<Coupon[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);
  useEffect(() => {
    if (!registered) return;
    const timer = window.setTimeout(() => setRegistered(false), 3000);
    return () => window.clearTimeout(timer);
  }, [registered]);
  const all = [
    ...issued,
    ...coupons.filter((item) => !issued.some((row) => row.id === item.id)),
  ];
  const rows = all.filter((item) => !!item.used === used);
  async function register() {
    if (!onRegister) {
      setNotice(true);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const coupon = await onRegister(code.trim());
      setIssued((current) => [
        coupon,
        ...current.filter((item) => item.id !== coupon.id),
      ]);
      setCode('');
      setRegistered(true);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="screen wire-wallet"
      data-figma-node={
        error
          ? '124:4347'
          : registered
            ? '124:4395'
            : used
              ? '124:4326'
              : rows.length
                ? '118:1147'
                : '118:1169'
      }
    >
      <ScreenHeader title="쿠폰함" backTo="/profile" />
      <div className="screen-content">
        {all.some((item) => item.used) && (
          <div className="tabs" aria-label="쿠폰 종류">
            {[
              ['available', '사용 가능'],
              ['used', '사용·만료'],
            ].map(([value, label]) => (
              <button
                key={value}
                className={used === (value === 'used') ? 'is-selected' : ''}
                aria-pressed={used === (value === 'used')}
                onClick={() => setUsed(value === 'used')}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {!used && (
          <form
            className="wire-coupon-form"
            onSubmit={(event) => {
              event.preventDefault();
              void register();
            }}
          >
            <label className="wire-field" htmlFor="coupon-code">
              쿠폰 등록
            </label>
            <div>
              <input
                id="coupon-code"
                value={code}
                maxLength={64}
                aria-invalid={!!error}
                aria-describedby={error ? 'coupon-error' : undefined}
                placeholder="쿠폰 번호를 입력해 주세요"
                onChange={(event) => setCode(event.target.value)}
              />
              <button className="button" disabled={!code.trim() || busy}>
                등록
              </button>
            </div>
            {error && (
              <p id="coupon-error" className="form-error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
        {rows.map((coupon) => (
          <article
            className={`coupon-card ${used ? 'coupon-card--used' : ''}`}
            key={coupon.id}
          >
            <Link
              to={`/coupons/${encodeURIComponent(coupon.id)}`}
              state={{ coupon }}
            >
              <h3>{coupon.title}</h3>
            </Link>
            <small>
              {used
                ? `사용 완료 ${coupon.usedAt || coupon.expires}`
                : `사용 기한 ${coupon.expires}까지`}
            </small>
            {!used && (
              <Link className="button button--primary" to="/activities">
                사용하기
              </Link>
            )}
          </article>
        ))}
        {!rows.length && (
          <div className="wire-wallet__empty">
            <div className="empty-circle" />
            <h2>사용 가능한 쿠폰이 없어요</h2>
          </div>
        )}
        {registered && (
          <div className="feedback-toast" role="status">
            <Icon name="check" /> 쿠폰을 등록했어요
            <button className="sr-only" onClick={() => setRegistered(false)}>
              닫기
            </button>
          </div>
        )}
      </div>
      {notice && (
        <WireDialog title="쿠폰 등록 안내" onClose={() => setNotice(false)}>
          <p>쿠폰 등록 기능을 준비하고 있어요.</p>
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

export function CouponDetailPage() {
  const { state } = useLocation();
  const value: unknown = state?.coupon;
  const coupon =
    value &&
    typeof value === 'object' &&
    typeof (value as Coupon).title === 'string' &&
    Number.isFinite((value as Coupon).discount)
      ? (value as Coupon)
      : undefined;
  return (
    <div className="screen wire-wallet" data-figma-node="124:4367">
      <ScreenHeader title="쿠폰 상세" backTo="/coupons" />
      <div className="screen-content">
        {coupon ? (
          <>
            <h2>{coupon.title}</h2>
            <div className="order-info">
              <div>
                <span>할인 금액</span>
                <span>{coupon.discount.toLocaleString('ko-KR')}원</span>
              </div>
              <div>
                <span>사용 기한</span>
                <span>{coupon.expires}</span>
              </div>
            </div>
            <h3 className="wire-subtitle">유의사항</h3>
            {coupon.notes?.map((note) => (
              <p className="body-copy" key={note}>
                {note}
              </p>
            ))}
          </>
        ) : (
          <p>쿠폰 정보를 찾을 수 없어요.</p>
        )}
      </div>
      <div className="screen-actions">
        <Link className="button button--primary" to="/activities">
          활동지 보러가기
        </Link>
      </div>
    </div>
  );
}

export function CashChargePage({
  onCharge,
}: {
  onCharge?: (amount: number, method: string) => Promise<{ balance: number }>;
}) {
  const [amount, setAmount] = useState('10000');
  const [method, setMethod] = useState('등록 카드');
  const [custom, setCustom] = useState('');
  const [notice, setNotice] = useState(false);
  const [result, setResult] = useState<{ balance: number } | 'failed'>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const total = amount === 'custom' ? Number(custom) : Number(amount);
  async function charge() {
    if (pending.current) return;
    if (!onCharge) {
      setNotice(true);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      setResult(await onCharge(total, method));
    } catch {
      setResult('failed');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (result)
    return (
      <CashChargeResult
        amount={total}
        balance={result === 'failed' ? undefined : result.balance}
        failed={result === 'failed'}
        onRetry={() => setResult(undefined)}
      />
    );
  return (
    <div className="screen wire-wallet" data-figma-node="118:1205">
      <ScreenHeader title="캐시 충전" backTo="/cash" />
      <div className="screen-content">
        <h2>충전 금액</h2>
        <div className="chips wire-charge-options">
          {[
            ['5000', '5,000원'],
            ['10000', '10,000원'],
            ['30000', '30,000원'],
            ['custom', '직접 입력'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`chip ${amount === value ? 'is-selected' : ''}`}
              aria-pressed={amount === value}
              onClick={() => setAmount(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {amount === 'custom' && (
          <label className="wire-field">
            충전할 금액
            <input
              type="number"
              inputMode="numeric"
              min="1000"
              step="1000"
              value={custom}
              placeholder="금액을 입력해 주세요"
              onChange={(event) => setCustom(event.target.value)}
            />
          </label>
        )}
        <h2>결제 수단</h2>
        <div className="chips wire-charge-options">
          {['등록 카드', '간편결제'].map((value) => (
            <button
              key={value}
              className={`chip ${method === value ? 'is-selected' : ''}`}
              aria-pressed={method === value}
              onClick={() => setMethod(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="screen-actions">
        <button
          className="button button--primary"
          disabled={busy || !Number.isFinite(total) || total < 1000}
          onClick={() => void charge()}
        >
          {Number.isFinite(total) ? total.toLocaleString('ko-KR') : '0'}원
          충전하기
        </button>
      </div>
      {notice && (
        <WireDialog title="캐시 충전 안내" onClose={() => setNotice(false)}>
          <p>캐시 충전 기능을 준비하고 있어요. 결제는 진행되지 않았어요.</p>
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

export function CashChargeResult({
  amount,
  balance,
  failed = false,
  onRetry,
}: {
  amount: number;
  balance?: number;
  failed?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div
      className="screen cash-charge-result"
      data-figma-node={failed ? '123:3941' : '123:3933'}
    >
      <div className="screen-content screen-content--center">
        <div className="empty-circle" />
        <h2>
          {failed
            ? '충전에 실패했어요'
            : `${amount.toLocaleString('ko-KR')}원을 충전했어요`}
        </h2>
        <p>
          {failed
            ? '결제 수단을 확인해 주세요.'
            : `보유 캐시 ${(balance ?? 0).toLocaleString('ko-KR')}원`}
        </p>
      </div>
      <div className="screen-actions">
        {failed ? (
          <button className="button button--primary" onClick={onRetry}>
            다시 시도
          </button>
        ) : (
          <Link className="button button--primary" to="/cash">
            확인
          </Link>
        )}
      </div>
    </div>
  );
}
