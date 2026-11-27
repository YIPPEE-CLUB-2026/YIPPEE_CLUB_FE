import { useEffect, useState } from 'react';
import { getActivityPreviews } from '../services/activities';
import { WireDialog } from './WireDialog';

export function ActivitySamples({ id }: { id: number }) {
  const [urls, setUrls] = useState<string[]>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setUrls(undefined); setError(''); setOpen(false);
    getActivityPreviews(id, controller.signal)
      .then(value => { if (!controller.signal.aborted) setUrls(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [id, attempt]);
  return <section className="activity-samples" aria-label="구매 전 활동지 미리보기">
    <div className="section-heading"><h3>활동 미리보기</h3>{!!urls?.length && <button type="button" className="text-button" onClick={() => setOpen(true)}>전체보기</button>}</div>
    {error ? <p role="alert">미리보기를 불러오지 못했어요. <button type="button" onClick={() => setAttempt(value => value + 1)}>다시 시도</button></p> : !urls ? <p role="status">미리보기를 불러오는 중…</p> : urls.length ? <div className="activity-samples__images">{urls.map((url, index) => <button key={url} type="button" onClick={() => setOpen(true)} aria-label={`미리보기 ${index + 1} 크게 보기`}><img src={url} alt={`활동지 샘플 ${index + 1}`} /></button>)}</div> : <p>등록된 미리보기 이미지가 없어요.</p>}
    {open && <WireDialog title="활동 미리보기" onClose={() => setOpen(false)}><div className="activity-samples__full">{urls?.map((url, index) => <img key={url} src={url} alt={`활동지 샘플 ${index + 1}`} />)}</div><button type="button" className="button" onClick={() => setOpen(false)}>닫기</button></WireDialog>}
  </section>;
}
