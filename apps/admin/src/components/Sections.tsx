"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { apiRequest, ApiError } from "../lib/api";
import ActivityPreviews from './ActivityPreviews';
import { AdminMedia } from './AdminMedia';
import {
  adminRequest,
  post,
  money,
  date,
  statusLabel,
  errorMessage,
  type Page,
  type Product,
  type Category,
  type Order,
  type Refund,
  type User,
  type Download,
} from "../lib/admin";
import { Panel, Notice, Empty } from "./AdminConsole";
import RevenueDashboard from "./RevenueDashboard";
import Issuances from "./Issuances";

function useResource<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setData(undefined);
    setError("");
    apiRequest<T>(path, { signal: controller.signal })
      .then((value) => {
        if (!controller.signal.aborted) setData(value);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, attempt]);
  return { data, error, loading, reload: () => setAttempt((v) => v + 1) };
}
function State({ loading, error }: { loading: boolean; error: string }) {
  return error ? (
    <Notice error>{error}</Notice>
  ) : loading ? (
    <div className="loading" role="status">
      <span />
      데이터를 불러오는 중입니다…
    </div>
  ) : null;
}
function Badge({ status }: { status: string }) {
  return (
    <span className={`status status-${status}`}>
      {statusLabel[status] || status}
    </span>
  );
}
function Pagination({
  page,
  next,
  onChange,
}: {
  page: number;
  next: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="pagination">
      <span>{page} 페이지</span>
      <button
        className="secondary compact"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        이전
      </button>
      <button
        className="secondary compact"
        disabled={!next}
        onClick={() => onChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}
function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      className={`modal ${wide ? "wide" : ""}`}
      ref={ref}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-header">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label="닫기" onClick={onClose}>
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Dashboard({
  navigate,
}: {
  navigate: (value: "orders" | "refunds" | "products" | "challenges") => void;
}) {
  const orders = useResource<Page<Order>>("/admin/orders?page=1&page_size=5");
  const review = useResource<Page<Order>>(
    "/admin/orders?status=review&page=1&page_size=1",
  );
  const refunds = useResource<Page<Refund>>(
    "/admin/orders/refund-requests?status=requested&page=1&page_size=1",
  );
  const products = useResource<Page<Product>>("/activities?page=1&page_size=1");
  const stats = [
    ["결제 확인 필요", review.data?.count, "확인이 필요한 주문", "orders", "↻"],
    [
      "환불 검토 대기",
      refunds.data?.count,
      "고객의 요청을 확인해 주세요",
      "refunds",
      "↶",
    ],
    [
      "공개 학습지",
      products.data?.count,
      "고객에게 공개된 콘텐츠",
      "products",
      "▤",
    ],
  ] as const;
  return (
    <>
      <RevenueDashboard />
      <div className="stats-grid">
        {stats.map(([title, count, description, target, icon]) => (
          <button
            className="stat-card"
            key={title}
            onClick={() => navigate(target)}
          >
            <div>
              <span>{title}</span>
              <i>{icon}</i>
            </div>
            <strong>
              {count === undefined ? "—" : count.toLocaleString()}
              <small>건</small>
            </strong>
            <p>
              {description}
              <span>→</span>
            </p>
          </button>
        ))}
      </div>
      {[orders, review, refunds, products].some((r) => r.error) && (
        <Notice error>
          {[orders, review, refunds, products].find((r) => r.error)?.error}
        </Notice>
      )}
      <div className="dashboard-grid">
        <Panel
          title="먼저 확인할 일"
          description="현재 API에서 확인할 수 있는 운영 업무"
          action={<span className="subtle-pill">TO-DO</span>}
        >
          <button className="todo" onClick={() => navigate("refunds")}>
            <span className="todo-icon">↶</span>
            <div>
              <strong>환불 요청 검토</strong>
              <p>다운로드 기록과 환불 고지 동의를 확인하세요.</p>
            </div>
            <b>{refunds.data?.count ?? "—"}</b>
            <span>→</span>
          </button>
          <button className="todo" onClick={() => navigate("orders")}>
            <span className="todo-icon">↻</span>
            <div>
              <strong>결제 상태 확인</strong>
              <p>확인이 필요한 주문을 결제사와 다시 대조하세요.</p>
            </div>
            <b>{review.data?.count ?? "—"}</b>
            <span>→</span>
          </button>
          <button className="todo" onClick={() => navigate("challenges")}>
            <span className="todo-icon soft">◎</span>
            <div>
              <strong>사진 인증 검수</strong>
              <p>인증 접수·AI 판독 API 연결이 필요합니다.</p>
            </div>
            <span className="status">미연동</span>
          </button>
        </Panel>
        <Panel
          title="서비스 지표"
          description="실제 집계 API가 연결되면 표시됩니다."
          action={<span className="subtle-pill">INSIGHTS</span>}
        >
          <div className="pending-metrics">
            {[
              "전체 다운로드 수",
              "도전과제 달성률",
              "AI 자동 판정 비율",
            ].map((label) => (
              <div key={label}>
                <span>{label}</span>
                <b>집계 API 미연동</b>
              </div>
            ))}
          </div>
          <p className="panel-note">
            일부 주문만으로 전체 매출이나 다운로드 수를 추정하지 않습니다.
          </p>
        </Panel>
      </div>
      <Panel
        title="최근 주문"
        description="최근 생성된 주문부터 표시합니다."
        action={
          <button className="text-link" onClick={() => navigate("orders")}>
            전체 보기 →
          </button>
        }
      >
        <State {...orders} />
        {orders.data &&
          (orders.data.results.length ? (
            <OrderTable rows={orders.data.results} />
          ) : (
            <Empty
              title="아직 주문이 없습니다"
              description="첫 주문이 접수되면 실제 주문 내역이 표시됩니다."
            />
          ))}
      </Panel>
    </>
  );
}
function OrderTable({
  rows,
  select,
}: {
  rows: Order[];
  select?: (id: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>주문 번호</th>
            <th>회원 ID</th>
            <th>결제 금액</th>
            <th>상태</th>
            <th>주문 시각</th>
            {select && <th>상세</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.order_id}>
              <td className="mono">#{row.order_id}</td>
              <td>회원 {row.user_id}</td>
              <td>
                <strong>{money(row.amount)}</strong>
              </td>
              <td>
                <Badge status={row.status} />
              </td>
              <td>{date(row.created_at)}</td>
              {select && (
                <td>
                  <button
                    className="text-link"
                    onClick={() => select(row.order_id)}
                  >
                    열기 ↗
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Orders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number>();
  const resource = useResource<Page<Order>>(
    `/admin/orders?page=${page}&page_size=20${status ? `&status=${status}` : ""}`,
  );
  return (
    <Panel
      title="주문 목록"
      description="결제 확인 필요 주문과 환불 상태를 관리합니다."
      action={
        <select
          aria-label="주문 상태"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">모든 상태</option>
          {["pending", "paid", "payment_failed", "cancelled", "refunded", "review"].map(
            (value) => (
              <option key={value} value={value}>
                {statusLabel[value]}
              </option>
            ),
          )}
        </select>
      }
    >
      <State {...resource} />
      {resource.data &&
        (resource.data.results.length ? (
          <OrderTable rows={resource.data.results} select={setSelected} />
        ) : (
          <Empty />
        ))}
      <Pagination
        page={page}
        next={
          resource.data?.count !== undefined
            ? page * 20 < resource.data.count
            : resource.data?.results.length === 20
        }
        onChange={setPage}
      />
      {selected && (
        <Modal
          title={`주문 #${selected}`}
          wide
          onClose={() => {
            setSelected(undefined);
            resource.reload();
          }}
        >
          <OrderDetail id={selected} />
        </Modal>
      )}
    </Panel>
  );
}
function DownloadTable({ rows }: { rows: Download[] }) {
  return rows.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>학습지</th>
            <th>이용권</th>
            <th>다운로드</th>
            <th>마지막 다운로드</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.activity_id}>
              <td>
                {row.title}
                <small className="block">ID {row.activity_id}</small>
              </td>
              <td>{row.plan === "rental" ? "7일 이용권" : "영구 소장"}</td>
              <td>{row.download_count}회</td>
              <td>{date(row.last_downloaded_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="다운로드 기록이 없습니다"
      description="이 주문의 다운로드 기록이 있으면 여기에 표시됩니다."
    />
  );
}
function OrderDetail({ id }: { id: number }) {
  const resource = useResource<Order>(`/admin/orders/${id}`);
  const [action, setAction] = useState<"refund" | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function reconcile() {
    setBusy(true);
    setMessage("");
    try {
      await post(`/orders/${id}/reconcile`);
      resource.reload();
      setMessage("서버에서 결제 상태를 다시 확인했습니다.");
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <State {...resource} />
      {resource.data && (
        <>
          <div className="detail-summary">
            <Badge status={resource.data.status} />
            <strong>{money(resource.data.amount)}</strong>
          </div>
          <dl className="details">
            <dt>회원 ID</dt>
            <dd>{resource.data.user_id}</dd>
            <dt>결제사 주문 번호</dt>
            <dd className="mono">{resource.data.pg_order_id || "—"}</dd>
            <dt>결제 시각</dt>
            <dd>{date(resource.data.paid_at)}</dd>
            <dt>환불 고지 동의</dt>
            <dd>{date(resource.data.refund_notice_agreed_at)}</dd>
          </dl>
          <h3>다운로드 이력</h3>
          <DownloadTable rows={resource.data.downloads || []} />
          <div className="actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void reconcile()}
            >
              결제사 상태 재확인
            </button>
            <button
              className="danger"
              disabled={busy || resource.data.status !== "paid"}
              onClick={() => setAction("refund")}
            >
              전액 환불 요청
            </button>
          </div>
          {message && <Notice>{message}</Notice>}
          {action && (
            <ActionForm
              title="전액 환불 확인"
              description={`주문 #${id}의 ${money(resource.data.amount)}을 전액 환불합니다. 사유를 확인하고 진행하세요.`}
              label="환불 사유"
              maxLength={200}
              submitLabel="전액 환불 실행"
              onClose={() => setAction(null)}
              onSubmit={async (reason) => {
                await post(`/orders/${id}/refund`, { reason });
                resource.reload();
              }}
            />
          )}
        </>
      )}
    </>
  );
}
function ActionForm({
  title,
  description,
  label,
  maxLength = 500,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  label: string;
  maxLength?: number;
  submitLabel: string;
  onSubmit: (value: string) => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const value = String(new FormData(e.currentTarget).get("reason")).trim();
    if (!value) return;
    setBusy(true);
    try {
      await onSubmit(value);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status === 503
          ? "외부 서비스 확인이 지연되고 있습니다. 처리 완료로 간주하지 말고 목록 또는 주문 상태를 다시 확인하세요."
          : errorMessage(cause),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <p className="modal-description">{description}</p>
      <form onSubmit={submit}>
        <label>
          {label}
          <textarea name="reason" required maxLength={maxLength} rows={3} />
        </label>
        {error && <Notice error>{error}</Notice>}
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            닫기
          </button>
          <button className="danger" disabled={busy}>
            {busy ? "처리 중…" : submitLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function Refunds() {
  const [status, setStatus] = useState("requested");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Refund>();
  const [action, setAction] = useState<"approve" | "reject">();
  const resource = useResource<Page<Refund>>(
    `/admin/orders/refund-requests?status=${status}&page=${page}&page_size=20`,
  );
  return (
    <Panel
      title="환불 요청 검토"
      description="동의 시각과 다운로드 기록을 확인한 뒤 처리합니다."
      action={
        <select
          aria-label="환불 상태"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {["requested", "approved", "rejected"].map((value) => (
            <option value={value} key={value}>
              {statusLabel[value]}
            </option>
          ))}
        </select>
      }
    >
      <State {...resource} />
      {resource.data &&
        (resource.data.results.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>요청 / 주문</th>
                  <th>회원</th>
                  <th>환불 금액</th>
                  <th>사유</th>
                  <th>접수 시각</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {resource.data.results.map((row) => (
                  <tr key={row.id}>
                    <td>
                      #{row.id}
                      <small className="block">주문 #{row.order_id}</small>
                    </td>
                    <td>{row.email}</td>
                    <td>{money(row.amount)}</td>
                    <td className="truncate">{row.reason}</td>
                    <td>{date(row.created_at)}</td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelected(row)}
                      >
                        검토 ↗
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="해당 상태의 환불 요청이 없습니다" />
        ))}
      <Pagination
        page={page}
        next={
          resource.data?.count !== undefined
            ? page * 20 < resource.data.count
            : resource.data?.results.length === 20
        }
        onChange={setPage}
      />
      {selected && (
        <Modal
          title={`환불 요청 #${selected.id}`}
          wide
          onClose={() => setSelected(undefined)}
        >
          <div className="detail-summary">
            <Badge status={selected.status} />
            <strong>{money(selected.amount)}</strong>
          </div>
          <dl className="details">
            <dt>회원</dt>
            <dd>{selected.email}</dd>
            <dt>요청 사유</dt>
            <dd>{selected.reason}</dd>
            <dt>환불 고지 동의</dt>
            <dd>{date(selected.refund_notice_agreed_at)}</dd>
            <dt>관리자 답변</dt>
            <dd>{selected.admin_note || "—"}</dd>
          </dl>
          <DownloadTable rows={selected.downloads || []} />
          {selected.status === "requested" && (
            <div className="actions">
              <button className="secondary" onClick={() => setAction("reject")}>
                환불 반려
              </button>
              <button className="danger" onClick={() => setAction("approve")}>
                환불 승인
              </button>
            </div>
          )}
          {action && (
            <ActionForm
              title={action === "approve" ? "환불 승인 확인" : "환불 반려"}
              description={
                action === "approve"
                  ? `${money(selected.amount)} 전액을 환불합니다. 확인 문구를 입력한 뒤 실행하세요.`
                  : "회원에게 전달될 반려 사유를 작성하세요."
              }
              label={action === "approve" ? "확인 문구" : "반려 사유"}
              submitLabel={
                action === "approve" ? "전액 환불 승인 실행" : "반려 처리"
              }
              onClose={() => setAction(undefined)}
              onSubmit={async (note) => {
                await post(
                  `/orders/refund-requests/${selected.id}/${action}`,
                  action === "reject" ? { note } : undefined,
                );
                setSelected(undefined);
                resource.reload();
              }}
            />
          )}
        </Modal>
      )}
    </Panel>
  );
}
export function Members() {
  const [user, setUser] = useState<User>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [change, setChange] = useState(false);
  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"))
      .trim()
      .toLowerCase();
    setBusy(true);
    setUser(undefined);
    setError("");
    try {
      setUser(
        await adminRequest<User>(`/users?email=${encodeURIComponent(email)}`),
      );
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="회원 조회"
      description="이메일로 정확히 일치하는 회원을 찾습니다."
    >
      <form className="search-form" onSubmit={search}>
        <label className="sr-only" htmlFor="member-email">
          회원 이메일
        </label>
        <input
          id="member-email"
          type="email"
          name="email"
          placeholder="회원 이메일을 입력하세요"
          required
        />
        <button className="primary" disabled={busy}>
          {busy ? "조회 중…" : "회원 검색"}
        </button>
      </form>
      {error && <Notice error>{error}</Notice>}
      {user ? (
        <>
          <div className="member-card">
            <span className="avatar large">
              {(user.name || user.email).slice(0, 1)}
            </span>
            <div>
              <h3>{user.name || "이름 미등록"}</h3>
              <p>{user.email}</p>
            </div>
            <span
              className={`status ${user.is_active ? "status-paid" : "status-rejected"}`}
            >
              {user.is_active ? "이용 중" : "정지됨"}
            </span>
          </div>
          <dl className="details">
            <dt>회원 ID</dt>
            <dd>{user.id}</dd>
            <dt>닉네임</dt>
            <dd>{user.nickname || "—"}</dd>
            <dt>가입 시각</dt>
            <dd>{date(user.created_at)}</dd>
            <dt>마지막 로그인</dt>
            <dd>{date(user.last_login_at)}</dd>
          </dl>
          <button
            className={user.is_active ? "danger" : "primary"}
            onClick={() => setChange(true)}
          >
            {user.is_active ? "계정 정지" : "계정 복구"}
          </button>
          {change && (
            <ActionForm
              title={user.is_active ? "계정 정지 확인" : "계정 복구 확인"}
              description={
                user.is_active
                  ? "정지하면 이 회원의 모든 로그인 토큰이 즉시 무효가 됩니다."
                  : "이 회원의 서비스 이용을 복구합니다."
              }
              label="확인 메모 (서버 저장 항목 아님)"
              submitLabel={user.is_active ? "계정 정지 실행" : "계정 복구 실행"}
              onClose={() => setChange(false)}
              onSubmit={async () => {
                const updated = await adminRequest<User>(`/users/${user.id}`, {
                  method: "PATCH",
                  body: JSON.stringify({ is_active: !user.is_active }),
                });
                setUser(updated);
              }}
            />
          )}
        </>
      ) : (
        !busy &&
        !error && (
          <Empty
            title="회원 이메일을 검색하세요"
            description="보유 학습지·배지·탈퇴 이력 조회 API는 아직 제공되지 않습니다."
          />
        )
      )}
    </Panel>
  );
}
export function Downloads() {
  const [orderId, setOrderId] = useState<number>();
  return (
    <>
      <Issuances />
      <Notice>
        발급 코드 검색과 주문별 다운로드 이력을 제공합니다. 코드 재발급·무효화와 기한·횟수 편집은 지원되지 않습니다.
      </Notice>
      <Panel
        title="주문별 다운로드 이력"
        description="주문 번호로 구매자의 PDF 이용 기록을 조회합니다."
      >
        <form
          className="search-form"
          onSubmit={(e) => {
            e.preventDefault();
            setOrderId(Number(new FormData(e.currentTarget).get("id")));
          }}
        >
          <label className="sr-only" htmlFor="download-order-id">
            주문 번호
          </label>
          <input
            id="download-order-id"
            name="id"
            type="number"
            min={1}
            step={1}
            required
            placeholder="주문 번호 입력"
          />
          <button className="primary">이력 조회</button>
        </form>
        {orderId ? (
          <OrderDetail key={orderId} id={orderId} />
        ) : (
          <Empty
            title="조회할 주문 번호를 입력하세요"
            description="다운로드 횟수와 최초·마지막 이용 시각을 확인할 수 있습니다."
          />
        )}
      </Panel>
    </>
  );
}
export function FutureModule({ kind }: { kind: string }) {
  const challenge = kind === "challenges";
  const columns = challenge
    ? [
        "인증 사진",
        "발급 코드",
        "계정 일치",
        "AI 판독 · 신뢰도",
        "중복 여부",
        "검수 상태",
      ]
    : ["유형", "제목", "회원", "담당자", "접수일", "처리 상태"];
  return (
    <>
      <Notice>
        이 화면의 API는 현재 명세에 없습니다. 실제 데이터 조회나 승인·반려·발급
        처리는 수행하지 않습니다.
      </Notice>
      <Panel
        title={challenge ? "도전과제 인증 검수" : "고객 문의 · 프로모션"}
        description={
          challenge
            ? "사진 원본, 코드 판독, 계정·중복 검증을 함께 확인할 공간입니다."
            : "문의·리뷰·공지·쿠폰·포인트 관리 영역입니다."
        }
        action={<span className="status">API 미연동</span>}
      >
        <div className="module-tabs">
          {(challenge
            ? ["검수 대기", "AI 확인 필요", "승인 완료", "반려"]
            : ["1:1 문의", "리뷰", "공지", "쿠폰 · 포인트"]
          ).map((label, i) => (
            <span key={label} className={i === 0 ? "selected" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        <Empty
          title="연동할 데이터가 아직 없습니다"
          description={
            challenge
              ? "인증 접수·발급 코드 검증·AI 판독·검수 API가 준비되면 연결할 수 있습니다."
              : "백엔드 API가 준비되면 실제 운영 내역을 연결할 수 있습니다."
          }
        />
      </Panel>
      <div className="roadmap-grid">
        {(challenge
          ? [
              ["01", "발급 코드 대조", "owner_user_id · 학습지 ID · 코드 상태"],
              [
                "02",
                "사진·AI 결과 검수",
                "detected_code · is_filled · confidence",
              ],
              ["03", "승인 · 반려 기록", "담당자 · 사유 · 처리 시각"],
            ]
          : [
              ["01", "문의와 리뷰", "접수 · 답변 · 처리 상태"],
              ["02", "공지와 프로모션", "게시 · 노출 기간 · 지급 정책"],
              ["03", "운영 감사 이력", "수정 · 승인 · 반려 활동 로그"],
            ]
        ).map(([n, title, body]) => (
          <div className="roadmap" key={n}>
            <span>{n}</span>
            <h3>{title}</h3>
            <p>{body}</p>
            <small>추가 API 필요</small>
          </div>
        ))}
      </div>
    </>
  );
}
export function Settings() {
  return (
    <>
      <Panel
        title="연동 현황"
        description="관리자 기능의 실제 지원 범위를 확인합니다."
      >
        <div className="integration-list">
          {[
            [
              "회원 인증 · 관리자 권한",
              "로그인 토큰 + BE ADMIN_EMAILS 검사",
              true,
            ],
            ["학습지 · 카테고리", "등록 · 수정 · 파일 업로드", true],
            ["매출 집계", "일·월·년 결제액 · 환불액 · 순매출", true],
            [
              "주문 · 환불 · 회원",
              "조회 · 상태 재확인 · 환불 · 계정 정지",
              true,
            ],
            [
              "PDF 발급 이력",
              "코드 정확 검색 · 회원/활동지 필터 · 다운로드 상세",
              true,
            ],
            [
              "도전과제 · 사진 AI 검수",
              "사진 업로드 · 판독 · 검증 · 승인·반려",
              false,
            ],
            [
              "정산 · 역할 · 감사 로그",
              "정산 내역 · 역할별 권한 · 운영 이력",
              false,
            ],
          ].map(([title, body, enabled]) => (
            <div key={String(title)}>
              <div>
                <strong>{title}</strong>
                <p>{body}</p>
              </div>
              <span className={`status ${enabled ? "status-paid" : ""}`}>
                {enabled ? "API 연결" : "추가 API 필요"}
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel
        title="배포와 접근 정책"
        description="고객용 앱과 독립적으로 운영합니다."
      >
        <dl className="details">
          <dt>앱 위치</dt>
          <dd>apps/admin</dd>
          <dt>로컬 주소</dt>
          <dd>http://127.0.0.1:3100</dd>
          <dt>API 경로</dt>
          <dd>/api/v1 → 서버 전용 프록시</dd>
          <dt>세션</dt>
          <dd>관리자 전용 탭 세션 · 401에서 토큰 갱신</dd>
          <dt>운영 배포</dt>
          <dd>별도 도메인·HTTPS·접속 제한은 배포 환경에서 설정</dd>
          <dt>역할별 접근 권한</dt>
          <dd>현재 명세는 관리자 / 일반 사용자만 구분</dd>
        </dl>
      </Panel>
    </>
  );
}

export function Categories() {
  const resource = useResource<Page<Category>>("/activity-categories");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const name = String(new FormData(form).get("name")).trim();
    setBusy(true);
    setError("");
    try {
      await post("/categories", { name });
      form.reset();
      resource.reload();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Panel
      title="학습지 카테고리"
      description="현재 명세는 단일 이름의 카테고리 등록·목록 조회를 지원합니다."
    >
      <form className="search-form" onSubmit={create}>
        <label className="sr-only" htmlFor="category-name">
          카테고리 이름
        </label>
        <input
          id="category-name"
          name="name"
          required
          maxLength={100}
          placeholder="새 카테고리 이름"
        />
        <button className="primary" disabled={busy}>
          {busy ? "등록 중…" : "+ 카테고리 등록"}
        </button>
      </form>
      {error && <Notice error>{error}</Notice>}
      <State {...resource} />
      {resource.data &&
        (resource.data.results.length ? (
          <div className="category-grid">
            {resource.data.results.map((item) => (
              <div key={item.id}>
                <span>⊞</span>
                <strong>{item.name}</strong>
                <small>ID {item.id}</small>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title="등록된 카테고리가 없습니다"
            description="학습지 등록 전에 카테고리를 먼저 만들어 주세요."
          />
        ))}
      <p className="panel-note">
        학년·연령 트리, 태그 편집, 삭제 기능은 추가 API가 필요합니다.
      </p>
    </Panel>
  );
}
export function Products() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState('');
  const [category, setCategory] = useState('');
  const categories = useResource<Page<Category>>('/activity-categories');
  const [editor, setEditor] = useState<Product | "new" | number>();
  const resource = useResource<Page<Product>>(
    `/admin/activities?page=${page}&page_size=20${query ? `&q=${encodeURIComponent(query)}` : ""}${visibility ? `&is_public=${visibility}` : ''}${category ? `&category=${category}` : ''}`,
  );
  return (
    <>
      <Panel
        title="학습지 목록"
        description="원본 PDF와 표지, 판매 가격, 권장 연령을 관리합니다."
        action={
          <button className="primary" onClick={() => setEditor("new")}>
            + 새 학습지 등록
          </button>
        }
      >
        <div className="product-searches">
          <label>공개 상태 <select value={visibility} onChange={e => { setVisibility(e.target.value); setPage(1); }}><option value="">전체</option><option value="true">공개</option><option value="false">비공개</option></select></label>
          <label>카테고리 <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}><option value="">전체</option>{categories.data?.results.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <form
            className="search-form"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(String(new FormData(e.currentTarget).get("q")).trim());
              setPage(1);
            }}
          >
            <input
              name="q"
              maxLength={255}
              aria-label="학습지 검색"
              placeholder="제목 또는 설명으로 검색"
            />
            <button className="secondary">검색</button>
          </form>
          <form
            className="search-form by-id"
            onSubmit={(e) => {
              e.preventDefault();
              setEditor(Number(new FormData(e.currentTarget).get("id")));
            }}
          >
            <input
              type="number"
              min={1}
              step={1}
              name="id"
              required
              aria-label="수정할 학습지 ID"
              placeholder="학습지 ID"
            />
            <button className="secondary">ID로 수정</button>
          </form>
        </div>
        <State {...resource} />
        {resource.data &&
          (resource.data.results.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>학습지</th>
                    <th>권장 월령</th>
                    <th>소장 가격</th>
                    <th>7일 이용권</th>
                    <th>난이도</th>
                    <th>공개 상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {resource.data.results.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="product-cell">
                          <AdminMedia path={`/admin/activities/${row.id}/files/image`} />
                          <div>
                            <strong>{row.title}</strong>
                            <small className="block">ID {row.id}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {row.age_min_months}~{row.age_max_months}개월
                      </td>
                      <td>{money(row.price)}</td>
                      <td>
                        {row.rental_price === null
                          ? "미판매"
                          : money(row.rental_price)}
                      </td>
                      <td>{{ easy: "하", normal: "중", hard: "상" }[row.difficulty]}</td>
                      <td>{row.is_public ? '공개' : '비공개'}</td>
                      <td>
                        <button
                          className="text-link"
                          onClick={() => setEditor(row.id)}
                        >
                          수정 ↗
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="조건에 맞는 학습지가 없습니다"
              description="검색 조건을 변경하거나 새 학습지를 등록해 주세요."
            />
          ))}
        <Pagination
          page={page}
          next={
            resource.data?.count !== undefined
              ? page * 20 < resource.data.count
              : resource.data?.results.length === 20
          }
          onChange={setPage}
        />
      </Panel>
      {editor !== undefined && (
        <Modal
          title={
            editor === "new"
              ? "새 학습지 등록"
              : `학습지 #${typeof editor === "number" ? editor : editor.id} 수정`
          }
          wide
          onClose={() => setEditor(undefined)}
        >
          <ProductEditorLoader
            value={editor}
            onSave={() => {
              setEditor(undefined);
              resource.reload();
            }}
          />
        </Modal>
      )}
    </>
  );
}
function ProductEditorLoader({ value, onSave }: { value: Product | 'new' | number; onSave: () => void }) {
  return value === 'new' ? <ProductEditor value="new" onSave={onSave} /> : <ExistingProductEditor id={typeof value === 'number' ? value : value.id} onSave={onSave} />;
}
function ExistingProductEditor({ id, onSave }: { id: number; onSave: () => void }) {
  const resource = useResource<Product>(`/admin/activities/${id}`);
  return <><State {...resource} />{resource.error && <button onClick={resource.reload}>다시 조회</button>}{resource.data && <>
    <div className="admin-product-files"><AdminMedia path={`/admin/activities/${id}/files/image`} alt="현재 표지" /><AdminMedia path={`/admin/activities/${id}/files/pdf`} pdf /></div>
    <p className="panel-note">등록: {date(resource.data.created_at)} · 수정: {date(resource.data.updated_at)}</p>
    <ProductEditor key={id} value={resource.data} onSave={onSave} />
  </>}</>;
}
function ProductEditor({
  value,
  onSave,
}: {
  value: Product | "new" | number;
  onSave: () => void;
}) {
  const creating = value === "new";
  const product = typeof value === "object" ? value : undefined;
  const id = typeof value === "number" ? value : product?.id;
  const categories = useResource<Page<Category>>("/activity-categories");
  const [purchasePrice, setPurchasePrice] = useState<string>(product ? String(product.price) : creating ? "0" : "");
  const freeProduct = purchasePrice !== "" && Number(purchasePrice) === 0;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const image = form.get("image") as File;
      const pdf = form.get("pdf") as File;
      if (image?.size > 5 * 1024 * 1024)
        throw new Error("표지는 5MB 이하로 업로드하세요.");
      if (pdf?.size > 20 * 1024 * 1024)
        throw new Error("PDF는 20MB 이하로 업로드하세요.");
      if (
        image?.size &&
        !["image/png", "image/jpeg", "image/webp"].includes(image.type)
      )
        throw new Error("표지 형식은 PNG, JPEG, WEBP만 지원합니다.");
      const categoryIds = form.getAll("category").map(Number);
      const fields: Record<string, unknown> = {};
      for (const key of ["title", "description", "difficulty"]) {
        const raw = String(form.get(key) || "").trim();
        if (raw) fields[key] = raw;
      }
      for (const key of [
        "price",
        "rental_price",
        "age_min_months",
        "age_max_months",
        "duration_min",
        "duration_max",
      ]) {
        const raw = String(form.get(key) || "").trim();
        if (raw) {
          const n = Number(raw);
          if (!Number.isSafeInteger(n))
            throw new Error("숫자 항목은 정수로 입력하세요.");
          fields[key] = n;
        }
      }
      if (form.get("remove_rental")) fields.rental_price = null;
      // 무료는 소장 가격 0 + 이용권 없음으로 전송합니다. BE는 이용권 0원을 허용하지 않습니다.
      if (fields.price === 0) {
        if (creating) delete fields.rental_price;
        else fields.rental_price = null;
      }
      const visibility = form.get("is_public");
      if (visibility === "true" || visibility === "false")
        fields.is_public = visibility === "true";
      if (
        creating ||
        product ||
        categoryIds.length ||
        form.get("clear_categories")
      )
        fields.categories = categoryIds;
      if (creating) {
        const body = new FormData();
        Object.entries(fields).forEach(([key, raw]) => {
          if (raw !== null)
            body.set(
              key,
              key === "categories" ? categoryIds.join(",") : String(raw),
            );
        });
        if (!categoryIds.length)
          throw new Error("카테고리를 하나 이상 선택하세요.");
        if (!image?.size || !pdf?.size)
          throw new Error("표지와 PDF를 모두 업로드하세요.");
        body.set("image", image);
        body.set("pdf", pdf);
        await adminRequest("/activities", { method: "POST", body });
      } else {
        if (Object.keys(fields).length)
          await adminRequest(`/activities/${id}`, {
            method: "PATCH",
            body: JSON.stringify(fields),
          });
        if (image?.size || pdf?.size) {
          const files = new FormData();
          if (image?.size) files.set("image", image);
          if (pdf?.size) files.set("pdf", pdf);
          try {
            await adminRequest(`/activities/${id}/files`, {
              method: "POST",
              body: files,
            });
          } catch (cause) {
            throw new Error(
              `기본 정보는 저장됐지만 파일 교체에 실패했습니다. 파일만 다시 선택해 저장하세요. ${errorMessage(cause)}`,
            );
          }
        }
      }
      onSave();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  const numeric = [
    ["price", "소장 가격 (원)", 0, 10000000],
    ["rental_price", "7일 이용권 가격 (원)", 1, 9999999],
    ["age_min_months", "최소 월령", 0, 1200],
    ["age_max_months", "최대 월령", 0, 1200],
    ["duration_min", "최소 시간 (분)", 1, 65535],
    ["duration_max", "최대 시간 (분)", 1, 65535],
  ] as const;
  return (
    <>
    <form className="product-form" onSubmit={submit}>
      {typeof value === "number" && (
        <Notice>
          현재 값을 조회할 API가 없어 입력한 필드만 변경합니다. 비워 둔 항목은
          그대로 유지됩니다.
        </Notice>
      )}
      <label>
        학습지 제목
        <input
          name="title"
          maxLength={255}
          required={creating}
          defaultValue={product?.title}
        />
      </label>
      <label>
        활동 설명
        <textarea
          name="description"
          rows={3}
          maxLength={4000}
          required={creating}
          defaultValue={product?.description}
        />
      </label>
      <div className="form-grid">
        {numeric.map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              step={1}
              min={min}
              max={max}
              name={key}
              disabled={key === "rental_price" && freeProduct}
              placeholder={key === "rental_price" ? freeProduct ? "무료 학습지는 이용권을 설정하지 않습니다" : "선택 · 비워두면 이용권 없음" : undefined}
              onChange={key === "price" ? event => setPurchasePrice(event.target.value) : undefined}
              required={creating && key !== "rental_price"}
              defaultValue={
                key === "rental_price" && freeProduct ? "" : product?.[key] ?? (creating && key === "price" ? 0 : "")
              }
            />
          </label>
        ))}
        <label>
          난이도
          <select
            name="difficulty"
            defaultValue={product?.difficulty || (creating ? "easy" : "")}
          >
            {!creating && <option value="">변경하지 않음</option>}
            <option value="easy">하</option>
            <option value="normal">중</option>
            <option value="hard">상</option>
          </select>
        </label>
        <label>
          공개 상태
          <select name="is_public" defaultValue={product ? String(product.is_public ?? false) : creating ? "false" : ""}>
            {!creating && <option value="">변경하지 않음</option>}
            <option value="false">비공개</option>
            <option value="true">공개</option>
          </select>
        </label>
      </div>
      {!creating && (
        <label className="check">
          <input type="checkbox" name="remove_rental" />
          7일 이용권 판매 중단
        </label>
      )}
      <fieldset>
        <legend>카테고리</legend>
        <State {...categories} />
        <div className="checkboxes">
          {categories.data?.results.map((item) => (
            <label className="check" key={item.id}>
              <input
                type="checkbox"
                name="category"
                value={item.id}
                defaultChecked={product?.categories.includes(item.id)}
              />
              {item.name}
            </label>
          ))}
        </div>
        {categories.data?.results.length === 0 && (
          <p className="muted">먼저 카테고리 관리에서 항목을 등록하세요.</p>
        )}
        {typeof value === "number" && (
          <label className="check">
            <input type="checkbox" name="clear_categories" />
            기존 카테고리 비우기
          </label>
        )}
      </fieldset>
      <div className="form-grid">
        <label>
          표지 이미지 {creating ? "(필수)" : "(교체할 때만 선택)"}
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp"
            required={creating}
          />
          <small>PNG · JPEG · WEBP / 최대 5MB</small>
        </label>
        <label>
          학습지 PDF {creating ? "(필수)" : "(교체할 때만 선택)"}
          <input
            type="file"
            name="pdf"
            accept="application/pdf,.pdf"
            required={creating}
          />
          <small>최대 20MB</small>
        </label>
      </div>
      <details className="unsupported">
        <summary>확장 예정 항목</summary>
        <p>
          학습지 코드, 구독, 페이지 수, 정답지 별도 업로드, PDF
          스탬프·해시 설정은 현재 API에 없어 저장하지 않습니다.
        </p>
      </details>
      {error && <Notice error>{error}</Notice>}
      <div className="actions">
        <button type="button" className="secondary" onClick={onSave}>
          닫기
        </button>
        <button
          className="primary"
          disabled={busy || (creating && !categories.data?.results.length)}
        >
          {busy ? "저장 중…" : creating ? "학습지 등록" : "변경 사항 저장"}
        </button>
      </div>
      {creating && <p className="panel-note">미리보기 이미지는 학습지 등록 후 수정 화면에서 별도로 등록할 수 있습니다.</p>}
    </form>
    {id !== undefined && <ActivityPreviews key={id} id={id} />}
    </>
  );
}
