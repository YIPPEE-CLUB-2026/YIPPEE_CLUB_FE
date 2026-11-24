import { readPreviewSession, previewRequest } from './preview-session';

// UI 브랜치 전용 어댑터입니다. HTTP 요청이나 실제 인증을 수행하지 않습니다.
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export interface Tokens {
  access_token: string;
  refresh_token: string;
}
export function readTokens(): Tokens | null {
  return null;
}
export function saveTokens(_tokens: Tokens | null) {
  // 실제 토큰은 UI 미리보기에서 저장하지 않습니다.
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
): Promise<T> {
  if (options.signal?.aborted)
    throw new DOMException('Aborted', 'AbortError');
  const preview = readPreviewSession();
  if (preview) return previewRequest(preview, path, options) as T;
  throw new ApiError(
    501,
    'UI_PREVIEW_ONLY',
    '화면 미리보기입니다. API 연동은 준비 중이에요.',
  );
}
