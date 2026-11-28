"use client";
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { errorMessage } from '../lib/admin';

export function adminMediaPath(value: string) {
  const path = new URL(value, 'https://api.yippeclub.com').pathname;
  const relative = path.replace(/^\/api\/v1/, '');
  if (!/^\/admin\/activities\/[1-9]\d*\/(?:files\/(?:image|pdf)|previews\/[1-9]\d*)$/.test(relative))
    throw new Error('관리자 파일 주소를 확인해 주세요.');
  return relative;
}

export function AdminMedia({ path, alt = '', pdf = false }: { path: string; alt?: string; pdf?: boolean }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    setUrl(''); setError('');
    Promise.resolve().then(() => apiRequest<Blob>(adminMediaPath(path), { responseType: 'blob', signal: controller.signal, cache: 'no-store' }))
      .then(blob => { if (!controller.signal.aborted) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); } })
      .catch(cause => { if (!controller.signal.aborted) setError(errorMessage(cause)); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path, attempt]);
  if (error) return <span role="alert">{error} <button type="button" onClick={() => setAttempt(v => v + 1)}>재시도</button></span>;
  if (!url) return <span role="status">파일 불러오는 중…</span>;
  return pdf ? <a className="text-link" href={url} target="_blank" rel="noopener noreferrer">원본 PDF 열기 ↗</a> : <img src={url} alt={alt} />;
}
