import { apiRequest, ApiError, resolveApiFileUrl } from "../lib/api";

import type { Activity, Paginated } from "../types";

export interface Category {
  id: number;
  name: string;
  code?: string;
}
export interface ActivityResponse {
  id: number;
  title: string;
  price: number;
  description: string;
  age_min_months: number;
  age_max_months: number;
  duration_min: number;
  duration_max: number;
  difficulty: "easy" | "normal" | "hard";
  categories: number[];
  image: string;
  pdf: string;
  rental_price?: number | null;
  rental_days?: number;
}
export function toActivity(
  item: ActivityResponse,
  categories: Category[],
): Activity {
  if (
    !Number.isInteger(item.id) ||
    typeof item.title !== "string" ||
    typeof item.price !== "number" ||
    !Array.isArray(item.categories) ||
    ![
      item.age_min_months,
      item.age_max_months,
      item.duration_min,
      item.duration_max,
    ].every(Number.isFinite) ||
    !["easy", "normal", "hard"].includes(item.difficulty) ||
    typeof item.description !== "string" ||
    typeof item.image !== "string" ||
    typeof item.pdf !== "string"
  ) {
    throw new Error("활동지 응답 형식이 맞지 않아요.");
  }
  const names = item.categories.map(
    (id) => categories.find((c) => c.id === id)?.name ?? `카테고리 ${id}`,
  );
  return {
    id: item.id,
    title: item.title,
    price: item.price,
    subtitle: names.join(" · ") || "미분류",
    category: names[0] || "미분류",
    categoryIds: item.categories,
    categoryNames: names,
    description: item.description,
    thumbnail: resolveApiFileUrl(item.image),
    pdf: resolveApiFileUrl(item.pdf),
    rentalPrice: item.rental_price,
    rentalDays: item.rental_days,
    ageYears: Math.floor(item.age_min_months / 12),
    ageMinMonths: item.age_min_months,
    ageMaxMonths: item.age_max_months,
    duration: item.duration_max,
    durationMin: item.duration_min,
    durationMax: item.duration_max,
    difficulty: item.difficulty,
  };
}
export async function listCategories(
  signal?: AbortSignal,
): Promise<Category[]> {
  return (
    await apiRequest<{ results: Category[] }>("/activity-categories", {
      signal,
    })
  ).results;
}
export async function listActivities(signal: AbortSignal): Promise<Activity[]> {
  const categories = await listCategories(signal);
  const items: Activity[] = [];
  for (let number = 1; ; number++) {
    const page = await apiRequest<Paginated<ActivityResponse>>(
      `/activities?page_size=100&page=${number}`,
      { signal },
    );
    if (!Array.isArray(page.results))
      throw new Error("활동지 목록 응답 형식이 맞지 않아요.");
    items.push(...page.results.map((item) => toActivity(item, categories)));
    if (!page.next) return items;
  }
}
export async function getActivity(
  id: number,
  signal?: AbortSignal,
): Promise<Activity> {
  if (!Number.isSafeInteger(id) || id < 1)
    throw new Error("활동지 ID를 확인해 주세요.");
  const [item, categories] = await Promise.all([
    apiRequest<ActivityResponse>(`/activities/${id}`, { signal }),
    listCategories(signal),
  ]);
  return toActivity(item, categories);
}
export async function listCart(signal?: AbortSignal): Promise<Activity[]> {
  const [cart, categories] = await Promise.all([
    apiRequest<{ items: ActivityResponse[] }>("/cart", { signal }),
    listCategories(signal),
  ]);
  return cart.items.map((item) => toActivity(item, categories));
}

export interface PurchasedActivityResponse extends ActivityResponse {
  plan: "permanent" | "rental";
  expires_at: string | null;
  expired: boolean;
}
export async function listPurchases(signal?: AbortSignal): Promise<Activity[]> {
  const categories = await listCategories(signal);
  const items: Activity[] = [];
  for (let page = 1; ; page++) {
    const result = await apiRequest<{
      count: number;
      results: PurchasedActivityResponse[];
    }>(`/purchases/activities?page=${page}&page_size=100`, { signal });
    items.push(
      ...result.results.map((item) => ({
        ...toActivity(item, categories),
        plan: item.plan,
        expiresAt: item.expires_at,
        expired: item.expired,
      })),
    );
    if (!result.results.length || items.length >= result.count) return items;
  }
}
export async function getDownload(id: number, signal?: AbortSignal) {
  try {
  return await apiRequest<{
    download_url: string;
    expires_at: string;
    file_name: string;
    issuance_code: string;
  }>(`/activities/${id}/download`, { method: "POST", signal });
  } catch (cause) {
    if (cause instanceof ApiError && cause.code === "PDF_GENERATION_FAILED") {
      cause.message = "고유코드가 포함된 PDF를 만들지 못했어요. 잠시 후 다시 시도해 주세요.";
    }
    throw cause;
  }
}
export async function getActivityPreviews(id: number, signal?: AbortSignal) {
  const result = await apiRequest<{ preview_urls: string[] }>(`/activities/${id}/preview`, { signal });
  return result.preview_urls.map(resolveApiFileUrl);
}
