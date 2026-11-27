import { apiRequest } from "./api";
export interface Page<T> {
  count?: number;
  results: T[];
}
export interface Category {
  id: number;
  name: string;
}
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  rental_price: number | null;
  age_min_months: number;
  age_max_months: number;
  difficulty: "easy" | "normal" | "hard";
  duration_min: number;
  duration_max: number;
  categories: number[];
  image: string;
  pdf: string;
  is_public?: boolean;
}
export interface Download {
  activity_id: number;
  title: string;
  plan: string;
  download_count: number;
  first_downloaded_at: string | null;
  last_downloaded_at: string | null;
}
export interface Order {
  order_id: number;
  user_id: number;
  status: string;
  amount: number;
  pg_order_id: string | null;
  confirm_started_at: string | null;
  created_at: string;
  paid_at?: string | null;
  refund_notice_agreed_at?: string | null;
  downloads?: Download[];
}
export interface Refund {
  id: number;
  order_id: number;
  user_id: number;
  email: string;
  reason: string;
  status: string;
  admin_note: string | null;
  amount: number;
  created_at: string;
  paid_at: string;
  refund_notice_agreed_at: string;
  decided_at: string | null;
  downloads: Download[];
}
export interface User {
  id: number;
  email: string;
  name: string | null;
  nickname: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}
export const adminRequest = <T>(path: string, options?: RequestInit) =>
  apiRequest<T>(`/admin${path}`, options);
export const post = <T>(path: string, body?: unknown) =>
  adminRequest<T>(path, {
    method: "POST",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
export const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
export const date = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
export const statusLabel: Record<string, string> = {
  paid: "결제 완료",
  pending: "결제 대기",
  processing: "결제 확인 중",
  cancelled: "취소",
  refunded: "환불 완료",
  failed: "결제 실패",
  review: "확인 필요",
  requested: "검토 대기",
  approved: "승인",
  rejected: "반려",
};
export const errorMessage = (cause: unknown) =>
  cause instanceof Error ? cause.message : "요청을 처리하지 못했습니다.";
