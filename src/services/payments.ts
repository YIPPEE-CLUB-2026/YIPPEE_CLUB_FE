import { apiRequest } from "../lib/api";

export interface OrderQuote {
  subtotal: number;
  payable_amount: number;
  unavailable_activity_ids: number[];
  refund_notice: string;
}
export interface CreatedOrder {
  order_id: number;
  status: string;
  amount: number;
  payment_session_token: string | null;
}
export const quoteOrder = (activityIds: number[], signal?: AbortSignal, rentalIds: number[] = []) =>
  apiRequest<OrderQuote>("/orders/quote", {
    method: "POST",
    signal,
    body: JSON.stringify({ activity_ids: activityIds, ...(rentalIds.length ? { rental_activity_ids: rentalIds } : {}) }),
  });
export const createOrder = (activityIds: number[], refundAgreed: boolean, rentalIds: number[] = []) =>
  apiRequest<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      activity_ids: activityIds,
      ...(rentalIds.length ? { rental_activity_ids: rentalIds } : {}),
      agreed_to_payment: true,
      agreed_to_refund_notice: refundAgreed,
    }),
  });
export const confirmPayment = (
  orderId: number,
  paymentKey: string,
  pgOrderId: string,
) =>
  apiRequest<{ order_id: number; status: string; paid_amount: number }>(
    "/payments/confirm",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        pg_payment_key: paymentKey,
        pg_order_id: pgOrderId,
      }),
    },
  );

interface PaymentOptions {
  method: "CARD";
  amount: { currency: "KRW"; value: number };
  orderId: string;
  orderName: string;
  successUrl: string;
  failUrl: string;
}
type TossFactory = (key: string) => {
  payment(options: { customerKey: string }): {
    requestPayment(options: PaymentOptions): Promise<void>;
  };
};
let sdk: Promise<TossFactory> | undefined;
export function paymentClientKey() {
  const key = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  if (!key.startsWith("test_ck_"))
    throw new Error(
      "토스 테스트 클라이언트 키(NEXT_PUBLIC_TOSS_CLIENT_KEY)를 설정해 주세요.",
    );
  return key;
}
export async function loadPaymentSdk() {
  if (!sdk)
    sdk = new Promise<TossFactory>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.tosspayments.com/v2/standard";
      script.onload = () => {
        const factory = (window as unknown as { TossPayments?: TossFactory })
          .TossPayments;
        if (factory) resolve(factory);
        else reject(new Error("토스 결제창을 불러오지 못했어요."));
      };
      script.onerror = () =>
        reject(new Error("토스 결제창을 불러오지 못했어요."));
      document.head.appendChild(script);
    }).catch((cause) => {
      sdk = undefined;
      throw cause;
    });
  return sdk;
}
