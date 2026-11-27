import { listOrders } from "../services/orders";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { ScreenHeader } from "../components/ScreenHeader";
import { Link } from "react-router-dom";
import type { OrderSummary } from "./OrderDetails";
import { LoadingState } from "../components/LoadingState";

export function OrdersPage({ orders: supplied }: { orders?: OrderSummary[] }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<OrderSummary[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!supplied);
  useEffect(() => {
    const controller = new AbortController();
    setRows([]);
    setError("");
    setLoading(Boolean(user && !supplied));
    if (user && !supplied)
      listOrders(controller.signal)
        .then((rows) => { if (!controller.signal.aborted) setRows(rows); })
        .catch((cause: Error) => {
          if (!controller.signal.aborted) setError(cause.message);
        })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.id, supplied]);
  const orders = supplied || rows;
  const period = '전체';
  const [status, setStatus] = useState("전체");
  const filtered = orders.filter(
    (order) =>
      status === "전체" ||
      (status === "취소" ? order.cancelled : order.status === "paid"),
  );
  return (
    <div
      className="screen wire-orders"
      data-figma-node={filtered.length ? "118:1255" : "118:1282"}
    >
      <ScreenHeader title="결제 내역" backTo="/profile" />
      <div className="screen-content">
        {error && <p role="alert">{error}</p>}
        <div className="section-heading">
          <span>{period}</span>
          <span className="wire-note">주문 날짜가 제공되면 기간별 조회를 이용할 수 있어요.</span>
        </div>
        <div className="chips" aria-label="결제 상태">
          {["전체", "결제 완료", "취소"].map((value) => (
            <button
              key={value}
              className={`chip ${status === value ? "is-selected" : ""}`}
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {loading && <LoadingState inline label="결제 내역을 불러오고 있어요" />}
        {!loading && !error && filtered.map((order) => (
          <article className="order-summary" key={order.id}>
            <p className="order-number-label">주문번호 <strong>{order.id}</strong></p>
            <div className="section-heading">
              <small>{order.date}</small>
              <span className="tag">
                {(
                  {
                    pending: "결제 대기",
                    paid: "결제 완료",
                    processing: "결제 확인 중",
                    cancelled: "취소",
                    failed: "결제 실패",
                    payment_failed: "결제 실패",
                    refunded: "환불 완료",
                    review: "결제 확인 필요",
                  } as Record<string, string>
                )[order.status || ""] || order.status}
              </span>
            </div>
            <p>
              {order.items[0]?.title}
              {order.items.length > 1 ? ` 외 ${order.items.length - 1}개` : ""}
            </p>
            <strong>{order.total.toLocaleString("ko-KR")}원</strong>
            <div className="order-summary__links">
              <Link
                className="button button--small"
                to={`/orders/${encodeURIComponent(order.id)}/receipt`}
                state={{ order }}
              >
                영수증
              </Link>
              <Link
                className="button button--small"
                to={`/orders/${encodeURIComponent(order.id)}`}
                state={{ order }}
              >
                상세 보기
              </Link>
            </div>
            {!order.cancelled && order.items[0] && (
              <Link
                className="button button--primary"
                to={`/activities/${order.items[0].id}/reviews/new`}
              >
                리뷰 쓰기
              </Link>
            )}
          </article>
        ))}
        {!loading && !error && !filtered.length && (
          <div className="wire-orders__empty">
            <div className="empty-circle" />
            <h2>아직 결제 내역이 없어요</h2>
            <p>결제한 활동지가 여기에 표시돼요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
