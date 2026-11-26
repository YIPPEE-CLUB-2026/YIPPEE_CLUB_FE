"use client";
import { useEffect, useState } from "react";
import { Panel, Notice, Empty } from "./AdminConsole";
import { date, errorMessage, type Page } from "../lib/admin";
import { getIssuances, getIssuance, type Issuance, type IssuanceDetail } from "../lib/reporting";
import { isUiPreview } from "../lib/api";
const rights = { active: "이용 가능", expired: "기간 만료", revoked: "환불로 회수", free: "무료" };

export default function Issuances() {
  const [filters, setFilters] = useState({code: "", user_id: "", activity_id: "", page: 1});
  const [result, setResult] = useState<Page<Issuance>>();
  const [selected, setSelected] = useState<number>();
  const [detail, setDetail] = useState<IssuanceDetail>();
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setResult(undefined); setError("");
    if (isUiPreview) { setResult({count: 0, results: []}); return; }
    const controller = new AbortController();
    getIssuances(filters, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(errorMessage(cause)); });
    return () => controller.abort();
  }, [filters, attempt]);
  useEffect(() => {
    setDetail(undefined); setDetailError("");
    if (!selected) return;
    const controller = new AbortController();
    getIssuance(selected, controller.signal).then(value => { if (!controller.signal.aborted) setDetail(value); })
      .catch(cause => { if (!controller.signal.aborted) setDetailError(errorMessage(cause)); });
    return () => controller.abort();
  }, [selected]);
  return <>
    <Panel title="PDF 발급 코드 이력" description="전체 코드 정확 일치 검색 · 소문자와 공백은 허용됩니다. 부분 검색은 지원하지 않습니다.">
      <form className="issuance-filters" onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); setFilters({code: String(form.get("code") || "").trim(), user_id: String(form.get("user_id") || ""), activity_id: String(form.get("activity_id") || ""), page: 1}); setSelected(undefined); }}>
        <label>발급 코드<input name="code" placeholder="W0007-K7WX-9M4R-Q2TV" /></label>
        <label>회원 번호<input name="user_id" type="number" min="1" step="1" /></label>
        <label>활동지 번호<input name="activity_id" type="number" min="1" step="1" /></label>
        <button className="primary">조회</button>
      </form>
      {error ? <Notice error>{error} <button onClick={() => setAttempt(value => value + 1)}>다시 조회</button></Notice> : !result ? <p role="status">발급 이력을 불러오는 중입니다…</p> : result.results.length ? <>
        <p className="panel-note">총 {result.count?.toLocaleString()}건</p>
        <div className="table-scroll"><table><thead><tr><th>발급 코드</th><th>학습지</th><th>회원 / 주문</th><th>현재 권한</th><th>다운로드</th><th>발급 시각</th></tr></thead><tbody>{result.results.map(row => <tr key={row.id}>
          <td><button className="text-link mono" onClick={() => setSelected(row.id)}>{row.issuance_code}</button></td><td>{row.activity_title}<small className="block">활동지 #{row.activity_id}</small></td><td>회원 #{row.user_id}<small className="block">{row.order_id === null ? "주문 없음" : `주문 #${row.order_id}`}</small></td><td>{rights[row.right] ?? row.right}</td><td>{row.download_count}회<small className="block">{date(row.last_downloaded_at)}</small></td><td>{date(row.issued_at)}</td>
        </tr>)}</tbody></table></div>
      </> : <Empty title="발급 이력이 없습니다" description="선택한 조건에 맞는 코드가 없습니다." />}
      <div className="pagination"><button className="secondary" disabled={filters.page === 1 || !result} onClick={() => setFilters(value => ({...value, page: value.page - 1}))}>이전</button><span>{filters.page} 페이지</span><button className="secondary" disabled={!result || filters.page * 20 >= (result.count ?? 0)} onClick={() => setFilters(value => ({...value, page: value.page + 1}))}>다음</button></div>
    </Panel>
    {selected && <Panel title="발급 상세" action={<button className="secondary" onClick={() => setSelected(undefined)}>닫기</button>}>
      {detailError ? <Notice error>{detailError}</Notice> : !detail ? <p role="status">상세 조회 중…</p> : <>
        <dl className="details"><dt>발급 코드</dt><dd className="mono">{detail.issuance_code}</dd><dt>회원</dt><dd>#{detail.user_id} · {detail.email}</dd><dt>활동지</dt><dd>{detail.activity_title}</dd><dt>발급 당시 주문</dt><dd>{detail.order_id ?? "없음"}</dd><dt>현재 이용 권한</dt><dd>{rights[detail.right] ?? detail.right}</dd><dt>발급 시각</dt><dd>{date(detail.issued_at)}</dd></dl>
        <h3>다운로드 기록 (최근 최대 100건)</h3>
        {detail.downloads.length ? <div className="table-scroll"><table><thead><tr><th>시각</th><th>IP</th><th>브라우저</th></tr></thead><tbody>{detail.downloads.map((row,index) => <tr key={index}><td>{date(row.downloaded_at)}</td><td>{row.ip_address}</td><td className="user-agent">{row.user_agent}</td></tr>)}</tbody></table></div> : <Empty title="다운로드 기록이 없습니다" />}
      </>}
    </Panel>}
  </>;
}
