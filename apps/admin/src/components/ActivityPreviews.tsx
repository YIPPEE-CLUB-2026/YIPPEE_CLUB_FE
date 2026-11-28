"use client";
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/api';
import { AdminMedia } from './AdminMedia';
import { errorMessage } from '../lib/admin';
import { deleteActivityPreviews, getActivityPreviews, replaceActivityPreviews, validatePreviewFiles } from '../lib/previews';

export default function ActivityPreviews({ id }: { id: number }) {
  const [urls, setUrls] = useState<string[]>();
  const [files, setFiles] = useState<File[]>([]);
  const [localUrls, setLocalUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<'replace' | 'delete'>();
  const [attempt, setAttempt] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setUrls(undefined); setError(''); setMessage('');
    getActivityPreviews(id, controller.signal)
      .then(result => { if (!controller.signal.aborted) setUrls(result.preview_urls); })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof ApiError && cause.status === 404
          ? '학습지를 찾을 수 없습니다. 학습지 ID를 확인해 주세요.'
          : errorMessage(cause));
      }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, attempt]);
  useEffect(() => {
    const next = files.map(file => URL.createObjectURL(file));
    setLocalUrls(next);
    return () => next.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  async function apply() {
    if (pending.current || !confirmation) return;
    pending.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (confirmation === 'delete') await deleteActivityPreviews(id);
      else await replaceActivityPreviews(id, files);
      setAttempt(value => value + 1); setFiles([]);
      if (input.current) input.current.value = '';
      setMessage(confirmation === 'delete' ? '미리보기를 모두 삭제했습니다.' : '미리보기를 저장했습니다.');
      setConfirmation(undefined);
    } catch (cause) { setError(errorMessage(cause)); }
    finally { pending.current = false; setBusy(false); }
  }
  return <section className="activity-previews" aria-labelledby="activity-previews-title">
    <h3 id="activity-previews-title">구매 전 미리보기 이미지</h3>
    <p>원본 PDF·표지와 별도로 저장합니다. PNG·JPEG·WEBP, 최대 5장, 각 5MB 이하입니다. 공개 학습지의 미리보기는 구매 전에도 볼 수 있습니다.</p>
    {loading ? <p role="status">기존 미리보기를 불러오는 중…</p> : urls && (urls.length ? <ol className="preview-image-list">{urls.map((url, index) => <li key={url}><AdminMedia path={url} alt={`현재 미리보기 ${index + 1}`} /><span>{index + 1}번</span></li>)}</ol> : <p>등록된 미리보기가 없습니다.</p>)}
    {error && <p className="notice error" role="alert">{error} <button type="button" disabled={busy} onClick={() => setAttempt(value => value + 1)}>다시 조회</button></p>}
    {message && <p role="status">{message}</p>}
    <fieldset disabled={busy}>
      <legend>등록·교체할 이미지</legend>
      <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp" aria-label="미리보기 이미지 선택" onChange={event => {
        setConfirmation(undefined); setMessage(''); setError('');
        const next = Array.from(event.target.files || []);
        if (!next.length) { setFiles([]); return; }
        try { validatePreviewFiles(next); setFiles(next); }
        catch (cause) { setFiles([]); event.target.value = ''; setError(errorMessage(cause)); }
      }} />
      {!!files.length && <><p>아래 순서로 저장됩니다. 저장하면 기존 미리보기 전체가 교체됩니다.</p><ol className="preview-image-list">{files.map((file, index) => <li key={`${file.name}-${index}`}>
        {localUrls[index] && <img src={localUrls[index]} alt={`선택한 미리보기 ${index + 1}`} />}<span>{index + 1}. {file.name}</span>
        <div><button type="button" disabled={!index} onClick={() => { setConfirmation(undefined); setFiles(rows => { const next = [...rows]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; }); }}>앞으로</button>{' '}<button type="button" onClick={() => { setConfirmation(undefined); setFiles(rows => rows.filter((_, position) => position !== index)); }}>선택 취소</button></div>
      </li>)}</ol></>}
      <div className="actions"><button type="button" className="primary" disabled={!files.length || loading} onClick={() => setConfirmation('replace')}>미리보기 등록·교체</button><button type="button" className="danger" disabled={loading || urls?.length === 0} onClick={() => setConfirmation('delete')}>기존 미리보기 전체 삭제</button></div>
    </fieldset>
    {confirmation && <div className="notice" role="group" aria-label="미리보기 변경 확인"><p>{confirmation === 'delete' ? `학습지 #${id}의 기존 미리보기를 모두 삭제할까요? 원본 PDF와 표지는 유지됩니다.` : `학습지 #${id}의 기존 미리보기를 선택한 ${files.length}장으로 전부 교체할까요?`}</p><div className="actions"><button type="button" disabled={busy} onClick={() => setConfirmation(undefined)}>취소</button><button type="button" className={confirmation === 'delete' ? 'danger' : 'primary'} disabled={busy} onClick={() => void apply()}>{busy ? '처리 중…' : '확인 후 실행'}</button></div></div>}
  </section>;
}
