import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { WireDialog } from '../components/WireDialog';
import { Icon } from '../components/Icon';
import { getActivity } from '../services/activities';
import type { Activity } from '../types';

export function ViewerPage() {
  const { activityId } = useParams();
  const [activity, setActivity] = useState<Activity>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('activity');
  const [zoom, setZoom] = useState(100);
  const [expanded, setExpanded] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [paper, setPaper] = useState('A4');
  const [printRange, setPrintRange] = useState('활동지만');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setActivity(undefined);
    setZoom(100);
    setTab('activity');
    getActivity(Number(activityId), controller.signal)
      .then(setActivity)
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [activityId]);
  const pdf =
    activity?.pdf && /^https?:\/\//i.test(activity.pdf)
      ? activity.pdf
      : activity?.pdf?.startsWith('/') && !activity.pdf.startsWith('//')
        ? activity.pdf
        : '';
  const preview = (
    <div
      className="document-viewer__paper"
      style={{
        width: `${(254 * zoom) / 100}px`,
        height: `${(360 * zoom) / 100}px`,
      }}
    >
      {tab === 'guide' ? (
        <div className="document-viewer__guide">
          <h2>{activity?.title}</h2>
          <p>{activity?.description || '활동 가이드를 준비하고 있어요.'}</p>
          <h3>준비물</h3>
          <p>
            {activity?.materials?.join(' · ') || '등록된 준비물 정보가 없어요.'}
          </p>
        </div>
      ) : pdf ? (
        <iframe
          title={`${activity?.title} PDF`}
          src={`${pdf.split('#')[0]}#page=1&view=FitH&toolbar=0`}
        />
      ) : activity?.thumbnail ? (
        <img src={activity.thumbnail} alt={activity.title} />
      ) : (
        <span className="sr-only">활동지 미리보기가 없어요</span>
      )}
    </div>
  );
  return (
    <div
      className="screen document-viewer"
      data-figma-node={
        loading
          ? '124:2942'
          : error
            ? '124:2966'
            : tab === 'guide'
              ? '124:2985'
              : '116:731'
      }
    >
      <ScreenHeader title="활동지 보기" backTo={`/activities/${activityId}`} />
      <div className="screen-content">
        <div className="tabs" role="tablist" aria-label="활동지 보기 종류">
          {[
            ['activity', '활동지'],
            ['guide', '활동 가이드'],
          ].map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? 'is-selected' : ''}
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="document-viewer__loading" role="status">
            <div />
            <img
              className="system-loading__icon"
              src="/assets/594ba.svg"
              alt="불러오는 중"
            />
          </div>
        ) : error ? (
          <div className="document-viewer__error" role="alert">
            <div className="empty-circle" />
            <h2>활동지를 열지 못했어요</h2>
            <p>잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : (
          <>
            <section
              className="document-viewer__preview"
              role="tabpanel"
              aria-label={tab === 'guide' ? '활동 가이드' : '활동지'}
            >
              <div className="document-viewer__scroll">{preview}</div>
              <div className="document-viewer__paging">
                <button className="text-button" disabled>
                  이전
                </button>
                <span>{pdf && tab === 'activity' ? 'PDF' : '1 / 1'}</span>
                <button className="text-button" disabled>
                  다음
                </button>
              </div>
            </section>
            <div className="document-viewer__zoom">
              <button
                className="button square-button"
                aria-label="축소"
                disabled={zoom <= 50}
                onClick={() => setZoom(Math.max(50, zoom - 25))}
              >
                <Icon name="zoomOut" />
              </button>
              <button
                className="button square-button"
                aria-label="확대"
                disabled={zoom >= 200}
                onClick={() => setZoom(Math.min(200, zoom + 25))}
              >
                <Icon name="zoomIn" />
              </button>
              <button
                className="button square-button"
                aria-label="전체화면"
                onClick={() => setExpanded(true)}
              >
                <Icon name="fullscreen" />
              </button>
            </div>
            <div className="document-viewer__tools">
              <div>
                {pdf && tab === 'activity' ? (
                  <a
                    className="button square-button"
                    href={pdf}
                    target="_blank"
                    rel="noreferrer"
                    download
                    aria-label="활동지 내려받기"
                  >
                    <Icon name="download" />
                  </a>
                ) : (
                  <button
                    className="button square-button"
                    disabled
                    aria-label="활동지 내려받기"
                  >
                    <Icon name="download" />
                  </button>
                )}
                <span>내려받기</span>
              </div>
              <div>
                <button
                  className="button square-button"
                  disabled={!pdf || tab === 'guide'}
                  aria-label="활동지 인쇄하기"
                  onClick={() => setPrinting(true)}
                >
                  <Icon name="print" />
                </button>
                <span>인쇄하기</span>
              </div>
            </div>
            {!pdf && (
              <p className="wire-note">
                내려받을 PDF가 아직 등록되지 않았어요.
              </p>
            )}
          </>
        )}
      </div>
      {error && (
        <div className="screen-actions">
          <button
            className="button button--primary"
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      )}
      {expanded && (
        <WireDialog
          title="활동지 전체화면"
          className="document-viewer-fullscreen"
          onClose={() => setExpanded(false)}
        >
          <div className="section-heading">
            <h2>활동지 보기</h2>
            <button
              className="icon-button"
              aria-label="전체화면 닫기"
              onClick={() => setExpanded(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="document-viewer__scroll">{preview}</div>
        </WireDialog>
      )}
      {printing && (
        <WireDialog
          title="인쇄 설정"
          sheet
          className="print-settings"
          onClose={() => setPrinting(false)}
        >
          <div className="section-heading">
            <h2>인쇄 설정</h2>
            <button
              className="icon-button"
              aria-label="인쇄 설정 닫기"
              onClick={() => setPrinting(false)}
            >
              <Icon name="close" />
            </button>
          </div>
          <h3 className="wire-subtitle">용지 크기</h3>
          <div className="chips" aria-label="용지 크기">
            {['A4', 'A3'].map((value) => (
              <button
                key={value}
                className={`chip ${paper === value ? 'is-selected' : ''}`}
                aria-pressed={paper === value}
                onClick={() => setPaper(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <h3 className="wire-subtitle">출력 범위</h3>
          <div className="chips" aria-label="출력 범위">
            {['활동지만', '가이드 포함'].map((value) => (
              <button
                key={value}
                className={`chip ${printRange === value ? 'is-selected' : ''}`}
                aria-pressed={printRange === value}
                onClick={() => setPrintRange(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <p className="wire-note">
            PDF를 연 뒤 브라우저 인쇄창에서 {paper}를 선택해 주세요. 활동
            가이드는 화면에서 확인할 수 있어요.
          </p>
          <a
            className="button button--primary"
            href={pdf}
            target="_blank"
            rel="noreferrer"
            onClick={() => setPrinting(false)}
          >
            인쇄하기
          </a>
        </WireDialog>
      )}
    </div>
  );
}
