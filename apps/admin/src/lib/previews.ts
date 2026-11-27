import { apiRequest } from './api';
import { adminRequest } from './admin';
export interface ActivityPreviews { preview_urls: string[] }
export function validatePreviewFiles(files: File[]) {
  if (!files.length || files.length > 5) throw new Error('미리보기는 1~5장을 선택해 주세요.');
  for (const file of files) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('PNG·JPEG·WEBP 이미지만 올릴 수 있습니다.');
    if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('각 이미지는 비어 있지 않은 5MB 이하 파일이어야 합니다.');
  }
}
export const getActivityPreviews = (id: number, signal?: AbortSignal) => apiRequest<ActivityPreviews>(`/activities/${id}/preview`, { signal });
export function replaceActivityPreviews(id: number, files: File[]) {
  validatePreviewFiles(files);
  const body = new FormData();
  files.forEach(file => body.append('previews', file));
  return adminRequest<ActivityPreviews>(`/activities/${id}/previews`, { method: 'POST', body });
}
export const deleteActivityPreviews = (id: number) => adminRequest<ActivityPreviews>(`/activities/${id}/previews`, { method: 'DELETE' });
