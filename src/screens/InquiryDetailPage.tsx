import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';

export interface Inquiry {
  id: string;
  title: string;
  date: string;
  content: string;
  answer?: string;
}
export function InquiryDetailPage({
  inquiry: supplied,
}: {
  inquiry?: Inquiry;
}) {
  const { state } = useLocation();
  const value: unknown = supplied || state?.inquiry;
  const inquiry =
    value &&
    typeof value === 'object' &&
    typeof (value as Inquiry).id === 'string' &&
    typeof (value as Inquiry).title === 'string' &&
    typeof (value as Inquiry).content === 'string'
      ? (value as Inquiry)
      : undefined;
  const [removing, setRemoving] = useState(false);
  const [notice, setNotice] = useState(false);
  return (
    <div
      className="screen wire-inquiry-detail"
      data-figma-node={inquiry?.answer ? '124:4873' : '124:4850'}
    >
      <ScreenHeader title="문의 상세" backTo="/support/inquiries" />
      {inquiry ? (
        <div className="screen-content">
          <span className="tag">
            {inquiry.answer ? '답변 완료' : '답변 대기'}
          </span>
          <h2>{inquiry.title}</h2>
          {!inquiry.answer && (
            <small className="wire-note">{inquiry.date}</small>
          )}
          <p className="wire-inquiry-detail__body">{inquiry.content}</p>
          {inquiry.answer ? (
            <>
              <section className="wire-inquiry-detail__answer">
                <h3>답변</h3>
                <p>{inquiry.answer}</p>
              </section>
              <Link className="button" to="/support/inquiries/new">
                추가 문의하기
              </Link>
            </>
          ) : (
            <div className="wire-inquiry-detail__actions">
              <Link
                className="text-button"
                to="/support/inquiries/new"
                state={{ inquiry }}
              >
                수정
              </Link>
              <button className="text-button" onClick={() => setRemoving(true)}>
                삭제
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="screen-content screen-content--center">
          <div className="empty-circle" />
          <h2>문의 내역을 찾을 수 없어요</h2>
          <Link className="button" to="/support/inquiries">
            문의 내역 보기
          </Link>
        </div>
      )}
      {removing && (
        <WireDialog title="문의 삭제" onClose={() => setRemoving(false)}>
          <h2>문의를 삭제할까요?</h2>
          <p>삭제한 문의는 되돌릴 수 없어요.</p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setRemoving(false)}>
              취소
            </button>
            <button
              className="button button--primary"
              onClick={() => {
                setRemoving(false);
                setNotice(true);
              }}
            >
              삭제하기
            </button>
          </div>
        </WireDialog>
      )}
      {notice && (
        <WireDialog title="문의 삭제 안내" onClose={() => setNotice(false)}>
          <p>문의 삭제를 진행할 수 없어요. 잠시 후 다시 시도해 주세요.</p>
          <button
            className="button button--primary"
            onClick={() => setNotice(false)}
          >
            확인
          </button>
        </WireDialog>
      )}
    </div>
  );
}
