import { apiRequest, resolveApiFileUrl } from "../lib/api";
import type { OrderSummary } from "../screens/OrderDetails";
import { formatServerDateTime } from '../lib/date';

interface OrderDetail {
  id: number;
  status: string;
  total_amount: number;
  created_at?: string;
  paid_at?: string | null;
  refunded_at?: string | null;
  payment_method?: 'free' | 'toss' | null;
  items: { activity_id: number; title: string; price: number; plan: string }[];
  refund_request: {
    status: string;
    reason: string;
    admin_note: string | null;
  } | null;
}
export async function getOrder(
  id: string,
  signal?: AbortSignal,
  images = new Map<number, Promise<string | undefined>>(),
): Promise<OrderSummary> {
  if (!/^[1-9]\d*$/.test(id)) throw new Error("주문 번호를 확인해 주세요.");
  const order = await apiRequest<OrderDetail>(`/orders/${id}`, { signal });
  // 주문의 제목·가격은 구매 당시 값을 유지하고 현재 표지 이미지만 보완합니다.
  const items = await Promise.all(order.items.map(async (item) => {
    if (!images.has(item.activity_id)) {
      images.set(item.activity_id, apiRequest<{ image: string }>(`/activities/${item.activity_id}`, { signal })
        .then(activity => activity.image ? resolveApiFileUrl(activity.image) : undefined)
        .catch(cause => { if (signal?.aborted) throw cause; return undefined; }));
    }
    return {
      id: item.activity_id, title: item.title, price: item.price,
      thumbnail: await images.get(item.activity_id),
      subtitle: item.plan === "rental" ? "7일 이용권" : "영구 소장",
      category: "", duration: 0, difficulty: "easy" as const, ageYears: 0,
    };
  }));
  return {
    id: String(order.id),
    date: order.paid_at ? formatServerDateTime(order.paid_at) : '결제 전',
    createdAt: order.created_at,
    paidAt: order.paid_at,
    refundedAt: order.refunded_at,
    method: order.payment_method === 'free' ? '무료 주문' : order.payment_method === 'toss' ? '토스페이먼츠' : '결제 전',
    total: order.total_amount,
    cancelled: ["cancelled", "refunded"].includes(order.status),
    cancellable:
      ["pending", "paid"].includes(order.status) &&
      order.refund_request?.status !== "requested",
    status: order.status,
    refundRequest: order.refund_request,
    items,
  };
}
export async function listOrders(
  signal?: AbortSignal,
  since?: string,
): Promise<OrderSummary[]> {
  const orders: OrderSummary[] = [];
  const images = new Map<number, Promise<string | undefined>>();
  for (let page = 1; ; page++) {
    const result = await apiRequest<{
      count: number;
      results: { order_id: number }[];
    }>(`/orders?page=${page}&page_size=100${since ? `&since=${encodeURIComponent(since)}` : ''}`, { signal });
    for (let start = 0; start < result.results.length; start += 5) {
      orders.push(...await Promise.all(result.results.slice(start, start + 5).map(item => getOrder(String(item.order_id), signal, images))));
    }
    if (!result.results.length || orders.length >= result.count) return orders;
  }
}
export const cancelOrder = (id: string, reason: string) =>
  apiRequest(`/orders/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
export const getReceipt = (id: string) =>
  apiRequest<{ receipt_url: string; order_id: number }>(
    `/orders/${id}/receipt`,
  );
