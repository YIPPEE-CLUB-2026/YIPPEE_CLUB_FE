import { apiRequest } from "../lib/api";
import type { OrderSummary } from "../screens/OrderDetails";
import { getActivity } from "./activities";

interface OrderDetail {
  id: number;
  status: string;
  total_amount: number;
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
): Promise<OrderSummary> {
  if (!/^[1-9]\d*$/.test(id)) throw new Error("주문 번호를 확인해 주세요.");
  const order = await apiRequest<OrderDetail>(`/orders/${id}`, { signal });
  // 주문의 제목·가격은 구매 당시 값을 유지하고 현재 표지 이미지만 보완합니다.
  const images = new Map<number, Promise<string | undefined>>();
  const items = await Promise.all(order.items.map(async (item) => {
    if (!images.has(item.activity_id)) {
      images.set(item.activity_id, getActivity(item.activity_id, signal)
        .then(activity => activity.thumbnail)
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
    date: "서버에서 제공하지 않음",
    method: order.total_amount === 0 ? "무료 주문" : "토스페이먼츠",
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
): Promise<OrderSummary[]> {
  const orders: OrderSummary[] = [];
  for (let page = 1; ; page++) {
    const result = await apiRequest<{
      count: number;
      results: { order_id: number }[];
    }>(`/orders?page=${page}&page_size=100`, { signal });
    orders.push(
      ...(await Promise.all(
        result.results.map((item) => getOrder(String(item.order_id), signal)),
      )),
    );
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
