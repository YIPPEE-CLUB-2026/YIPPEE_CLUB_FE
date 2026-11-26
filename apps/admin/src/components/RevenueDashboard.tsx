"use client";

import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { isUiPreview } from "../lib/api";
import { money, errorMessage } from "../lib/admin";
import { getSales, type SalesReport } from "../lib/reporting";

type Period = "day" | "month" | "year";
const periods = { day: "일 매출", month: "월 매출", year: "년 매출" };
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date());
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

// 서버 통계가 아닌 UI 확인 전용 값입니다. 실제 모드에서는 사용하지 않습니다.
function previewSeries(period: Period, date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const count = period === "day" ? 24 : period === "month" ? new Date(year, month, 0).getDate() : 12;
  return Array.from({ length: count }, (_, index) => ({
    label: period === "day" ? `${index}시` : period === "month" ? `${index + 1}일` : `${index + 1}월`,
    amount: ((index * 7 + (day || month || year)) % 13 + 2) * (period === "day" ? 1900 : period === "month" ? 19000 : 570000),
  }));
}

export default function RevenueDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [selected, setSelected] = useState(today);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [report, setReport] = useState<SalesReport>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const currentReport = report?.unit === period && report?.date === selected.slice(0, period === "day" ? 10 : period === "month" ? 7 : 4) ? report : undefined;
  const rows = isUiPreview ? previewSeries(period, selected) : (currentReport?.buckets.map(row => ({label: `${row.key}${period === "day" ? "시" : period === "month" ? "일" : "월"}`, amount: row.net_amount })) ?? []);
  const total = isUiPreview ? sum(rows.map(row => row.amount)) : currentReport?.net_amount;
  const title = period === "day" ? selected : period === "month" ? selected.slice(0, 7) : selected.slice(0, 4);
  useEffect(() => {
    setReport(undefined); setError("");
    if (isUiPreview) return;
    const controller = new AbortController();
    getSales(period, selected, controller.signal).then(value => { if (!controller.signal.aborted) setReport(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(errorMessage(cause)); });
    return () => controller.abort();
  }, [period, selected, attempt]);

  useEffect(() => {
    if (!canvas.current || (!isUiPreview && !currentReport)) return;
    const data = isUiPreview ? previewSeries(period, selected) : currentReport!.buckets.map(row => ({ label: `${row.key}${period === "day" ? "시" : period === "month" ? "일" : "월"}`, amount: row.net_amount }));
    const chart = new Chart(canvas.current, {
      type: "bar",
      data: { labels: data.map(row => row.label), datasets: isUiPreview ? [{ label: "순순매출", data: data.map(row => row.amount), backgroundColor: "#e8ba47" }] : ([ ["paid_amount", "결제액", "#c5972d"], ["refund_amount", "환불액", "#c87562"], ["net_amount", "순매출", "#52846a"] ] as const).map(([key,label,color]) => ({ label, data: currentReport!.buckets.map(row => row[key]), backgroundColor: color, maxBarThickness: 24 })) },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? false : { duration: 200 },
        plugins: { legend: { display: true, labels: { font: { size: 15 } } }, tooltip: { titleFont: { size: 16 }, bodyFont: { size: 16 }, callbacks: { label: context => `${context.dataset.label}: ${money(Number(context.raw))}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#65584b", font: { size: 15 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
          y: { beginAtZero: true, border: { display: false }, grid: { color: "#eee9df" }, ticks: { color: "#65584b", font: { size: 15 }, callback: value => Number(value) >= 10000 ? `${Number(value) / 10000}만` : Number(value).toLocaleString() } },
        },
      },
    });
    return () => chart.destroy();
  }, [period, selected, currentReport]);

  return <section className="revenue-section" aria-labelledby="revenue-title">
    <div className="revenue-heading"><div><h2 id="revenue-title">매출 현황</h2><p>{isUiPreview ? "예시 데이터 · 실제 매출이 아닙니다" : "결제일·환불 확정일 기준 집계"} · 한국 시간 기준</p></div>
      <div className="revenue-controls"><div className="period-options" aria-label="매출 집계 단위">{(Object.keys(periods) as Period[]).map(key => <button key={key} aria-pressed={period === key} onClick={() => setPeriod(key)}>{periods[key]}</button>)}</div>
        <label className="revenue-date">조회 기간{period === "year" ? <select value={selected.slice(0, 4)} onChange={event => setSelected(`${event.target.value}-01-01`)}>{Array.from({length: 21}, (_, index) => String(Number(today.slice(0, 4)) - index)).map(year => <option key={year}>{year}</option>)}</select> : <input type={period === "day" ? "date" : "month"} value={period === "day" ? selected : selected.slice(0, 7)} onChange={event => { if (event.target.value) setSelected(period === "day" ? event.target.value : `${event.target.value}-01`); }} />}</label>
      </div></div>
    <div className="revenue-summary"><div><span>{title} 순매출</span><strong>{total === undefined ? "—" : money(total)}</strong></div><p>{isUiPreview ? `${rows.length}개 구간 합계 · 화면 확인용` : currentReport ? `결제액 ${money(currentReport.paid_amount)} (${currentReport.paid_count}건) · 환불액 ${money(currentReport.refund_amount)} (${currentReport.refund_count}건)` : "매출 조회 중"}</p></div>
    {error && <p className="notice error" role="alert">{error} <button onClick={() => setAttempt(value => value + 1)}>다시 조회</button></p>}
    {!isUiPreview && !currentReport && !error && <p role="status">매출을 불러오는 중입니다…</p>}
    {(isUiPreview || currentReport) ? <><div className="revenue-chart"><canvas ref={canvas} role="img" aria-label={`${title} ${periods[period]} 차트. 합계 ${money(total ?? 0)}. 아래 표에서 구간별 금액을 확인할 수 있습니다.`} /></div><details className="revenue-details"><summary>구간별 매출 표 보기</summary><div className="table-scroll"><table><thead><tr><th>기간</th><th>순매출</th></tr></thead><tbody>{rows.map(row => <tr key={row.label}><td>{row.label}</td><td>{money(row.amount)}</td></tr>)}</tbody><tfoot><tr><th>합계</th><td>{money(total ?? 0)}</td></tr></tfoot></table></div></details></> : <div className="empty"><p>기간을 선택해 매출을 조회하세요.</p></div>}
  </section>;
}
