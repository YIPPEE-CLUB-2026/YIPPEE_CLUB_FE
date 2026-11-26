import { adminRequest, type Page } from "./admin";
export type SalesUnit = "day" | "month" | "year";
export interface SalesBucket { key: number; paid_amount: number; refund_amount: number; net_amount: number }
export interface SalesReport {
  unit: SalesUnit; date: string; timezone: string; paid_amount: number; refund_amount: number;
  net_amount: number; paid_count: number; refund_count: number; buckets: SalesBucket[];
}
export interface Issuance {
  id: number; issuance_code: string; user_id: number; activity_id: number; activity_title: string;
  order_id: number | null; issued_at: string; right: "active" | "expired" | "revoked" | "free";
  download_count: number; last_downloaded_at: string | null;
}
export interface IssuanceDetail extends Issuance {
  email: string; downloads: { downloaded_at: string; ip_address: string; user_agent: string }[];
}
export const salesDate = (unit: SalesUnit, date: string) => date.slice(0, unit === "day" ? 10 : unit === "month" ? 7 : 4);
export const getSales = (unit: SalesUnit, date: string, signal?: AbortSignal) =>
  adminRequest<SalesReport>(`/sales?${new URLSearchParams({ unit, date: salesDate(unit, date) })}`, { signal });
export function getIssuances(filters: { code?: string; user_id?: string; activity_id?: string; page: number }, signal?: AbortSignal) {
  const query = new URLSearchParams({ page: String(filters.page), page_size: "20" });
  for (const key of ["code", "user_id", "activity_id"] as const) {
    const value = filters[key]?.trim(); if (value) query.set(key, value);
  }
  return adminRequest<Page<Issuance>>(`/worksheet-issuances?${query}`, { signal });
}
export const getIssuance = (id: number, signal?: AbortSignal) => adminRequest<IssuanceDetail>(`/worksheet-issuances/${id}`, { signal });
