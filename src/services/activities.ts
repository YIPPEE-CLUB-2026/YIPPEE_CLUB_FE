import { sampleActivities } from '../data/activities';
import { apiRequest } from '../lib/api';
import type { Activity } from '../types';

// 기존 화면 모양을 확인하기 위한 로컬 샘플만 제공합니다.
export interface Category {
  id: number;
  name: string;
  code?: string;
}
export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  return (
    await apiRequest<{ results: Category[] }>('/activity-categories', { signal })
  ).results;
}
export async function listActivities(signal: AbortSignal): Promise<Activity[]> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return sampleActivities;
}
export async function getActivity(id: number, signal?: AbortSignal): Promise<Activity> {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const item = sampleActivities.find((activity) => activity.id === id);
  if (!item) throw new Error('활동지를 찾을 수 없어요.');
  return item;
}
export async function listCart(signal?: AbortSignal): Promise<Activity[]> {
  return (await apiRequest<{ items: Activity[] }>('/cart', { signal })).items;
}
