import { apiRequest } from "../lib/api";
import type { OrderSummary } from "../screens/OrderDetails";

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
  return {
    id: String(order.id),
    date: "서버에서 제공하지 않음",
    method: "토스페이먼츠",
    total: order.total_amount,
    cancelled: ["cancelled", "refunded"].includes(order.status),
    cancellable:
      ["pending", "paid"].includes(order.status) &&
      order.refund_request?.status !== "requested",
    status: order.status,
    refundRequest: order.refund_request,
    items: order.items.map((item) => ({
      id: item.activity_id,
      title: item.title,
      price: item.price,
      subtitle: item.plan === "rental" ? "7일 이용권" : "영구 소장",
      category: "",
      duration: 0,
      difficulty: "easy",
      ageYears: 0,
    })),
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
