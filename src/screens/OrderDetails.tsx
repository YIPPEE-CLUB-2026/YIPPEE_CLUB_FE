import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
import type { Activity } from '../types';
import { ActivityThumbnail } from '../components/ActivityThumbnail';

export interface OrderSummary {
  id: string;
  date: string;
  method: string;
  total: number;
  items: Activity[];
  cancelled?: boolean;
  cancellable?: boolean;
}
function useOrder(provided?: OrderSummary) {
  const { state } = useLocation();
  const value: unknown = provided || state?.order;
  if (!value || typeof value !== 'object') return undefined;
  const order = value as OrderSummary;
  if (
    typeof order.id !== 'string' ||
    typeof order.date !== 'string' ||
    typeof order.method !== 'string' ||
    !Number.isFinite(order.total) ||
    !Array.isArray(order.items) ||
    !order.items.every(
      (item) =>
        Number.isInteger(item.id) &&
        typeof item.title === 'string' &&
        Number.isFinite(item.price),
    )
  )
    return undefined;
  return order;
}
const money = (value: number) => `${value.toLocaleString('ko-KR')}원`;
function OrderMissing() {
  return (
    <div className="screen">
      <ScreenHeader title="결제 내역" backTo="/orders" />
      <div className="screen-content screen-content--center">
        <div className="empty-circle" />
        <h2>결제 내역을 찾을 수 없어요</h2>
        <p>결제 내역에서 다시 확인해 주세요.</p>
      </div>
      <div className="screen-actions">
        <Link className="button button--primary" to="/orders">
          결제 내역 보기
        </Link>
      </div>
    </div>
  );
}
export function OrderActivityRow({ item }: { item: Activity }) {
  return (
    <div className="order-activity">
      <div className="order-activity__thumb">
        <ActivityThumbnail activity={item} />
      </div>
      <div>
        <p>
          [{item.subtitle}]<br />
          {item.title}
        </p>
        <strong>{money(item.price)}</strong>
      </div>
    </div>
  );
}
export function OrderDetailPage({ order: supplied }: { order?: OrderSummary }) {
  const order = useOrder(supplied);
  if (!order) return <OrderMissing />;
  return (
    <div
      className="screen wire-order-detail"
      data-figma-node={order.cancellable ? '123:3965' : '118:1298'}
    >
      <ScreenHeader title="결제 상세" backTo="/orders" />
      <div className="screen-content">
        <h2>주문 활동지 {order.items.length}개</h2>
        {order.items.map((item) => (
          <section className="order-activity-group" key={item.id}>
            <OrderActivityRow item={item} />
            <Link
              className="button button--small"
              to={`/activities/${item.id}/reviews/new`}
            >
              리뷰 쓰기
            </Link>
          </section>
        ))}
        <h2>결제 정보</h2>
        <div className="order-info">
          <div>
            <span>결제일</span>
            <span>{order.date}</span>
          </div>
          <div>
            <span>결제 수단</span>
            <span>{order.method}</span>
          </div>
          <div>
            <span>활동지 금액</span>
            <span>
              {money(order.items.reduce((sum, item) => sum + item.price, 0))}
            </span>
          </div>
          <div>
            <strong>최종 결제 금액</strong>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
      </div>
      <div className="screen-actions">
        <Link
          className="button button--primary"
          to={order.items[0] ? `/viewer/${order.items[0].id}` : '/saved'}
        >
          활동지 보기
        </Link>
        {order.cancellable && (
          <Link
            className="button"
            to={`/orders/${order.id}/cancel`}
            state={{ order }}
          >
            결제 취소
          </Link>
        )}
      </div>
    </div>
  );
}
export function OrderCancelPage({ order: supplied }: { order?: OrderSummary }) {
  const order = useOrder(supplied);
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState(false);
  if (!order) return <OrderMissing />;
  return (
    <div
      className="screen wire-order-cancel"
      data-figma-node={confirm ? '123:4029' : '123:4000'}
    >
      <ScreenHeader
        title="결제 취소"
        backTo={`/orders/${order.id}`}
        onBack={confirm ? () => setConfirm(false) : undefined}
      />
      <div className="screen-content">
        <h2>
          {confirm ? '취소 내용을 확인해 주세요' : '취소 사유를 골라주세요'}
        </h2>
        {confirm ? (
          <>
            {order.items.map((item) => (
              <OrderActivityRow key={item.id} item={item} />
            ))}
            <div className="order-info">
              <div>
                <strong>환불 금액</strong>
                <strong>{money(order.total)}</strong>
              </div>
              <div>
                <span>환불 수단</span>
                <span>{order.method}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="sort-options">
            {[
              '잘못 구매했어요',
              '아이 나이에 맞지 않아요',
              '활동지가 기대와 달라요',
              '기타',
            ].map((value) => (
              <label key={value}>
                {value}
                <input
                  type="radio"
                  name="cancel-reason"
                  checked={reason === value}
                  onChange={() => setReason(value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="screen-actions">
        <button
          className="button button--primary"
          disabled={!reason}
          onClick={() => (confirm ? setNotice(true) : setConfirm(true))}
        >
          {confirm ? '취소하기' : '다음'}
        </button>
      </div>
      {notice && (
        <WireDialog title="결제 취소 안내" onClose={() => setNotice(false)}>
          <h2>결제 취소를 진행할 수 없어요</h2>
          <p>고객센터로 문의해 주세요.</p>
          <Link className="button button--primary" to="/support/inquiries/new">
            문의하기
          </Link>
          <button className="text-button" onClick={() => setNotice(false)}>
            닫기
          </button>
        </WireDialog>
      )}
    </div>
  );
}
export function ReceiptPage({ order: supplied }: { order?: OrderSummary }) {
  const order = useOrder(supplied);
  const { orderId } = useParams();
  const [copied, setCopied] = useState(false);
  if (!order) return <OrderMissing />;
  return (
    <div className="screen wire-receipt" data-figma-node="123:4105">
      <ScreenHeader
        title="영수증"
        backTo={`/orders/${orderId || order.id}`}
        right={
          <button
            className="icon-button"
            aria-label="영수증 공유"
            onClick={() => {
              void navigator.clipboard
                .writeText(
                  `주문 번호 ${order.id}\n결제일 ${order.date}\n결제 수단 ${order.method}\n결제 금액 ${money(order.total)}`,
                )
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          >
            <Icon name="share" />
          </button>
        }
      />
      <div className="screen-content">
        <div className="order-info">
          <div>
            <span>주문 번호</span>
            <span>{order.id}</span>
          </div>
          <div>
            <span>결제일</span>
            <span>{order.date}</span>
          </div>
          <div>
            <span>결제 수단</span>
            <span>{order.method}</span>
          </div>
          <div>
            <strong>결제 금액</strong>
            <strong>{money(order.total)}</strong>
          </div>
        </div>
        {copied && <p role="status">영수증 정보를 복사했어요.</p>}
      </div>
    </div>
  );
}
