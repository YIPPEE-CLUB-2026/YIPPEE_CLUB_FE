import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { useChildren } from '../context/ChildrenContext';
import { WireDialog } from '../components/WireDialog';

export interface GrowthReport {
  childId: number;
  counts: [number, number, number, number, number];
}
export function GrowthReportPage({ report }: { report?: GrowthReport }) {
  const { activeChild, children } = useChildren();
  const [period, setPeriod] = useState('최근 3개월');
  const [choosing, setChoosing] = useState(false);
  const child =
    children.find((item) => item.id === report?.childId) || activeChild;
  const ready =
    report &&
    report.counts.every((value) => Number.isFinite(value) && value >= 0) &&
    report.counts.some((value) => value > 0);
  return (
    <div
      className="screen wire-growth"
      data-figma-node={ready ? '124:3478' : '124:3514'}
    >
      <ScreenHeader
        title="성장 리포트"
        backTo="/profile"
        right={
          ready ? (
            <button
              className="icon-button"
              aria-label="성장 리포트 공유"
              onClick={() => window.print()}
            >
              <Icon name="share" />
            </button>
          ) : undefined
        }
      />
      {ready ? (
        <div className="screen-content">
          <div className="section-heading">
            <span className="chip is-selected">
              {child?.name || '우리 아이'}
            </span>
            <button className="filter-chip" onClick={() => setChoosing(true)}>
              {period}
              <Icon name="down" size={16} />
            </button>
          </div>
          <h2>{child?.name || '우리 아이'}의 발달 영역</h2>
          <div
            className="wire-growth__chart"
            role="img"
            aria-label="발달 영역별 활동 분포"
          />
          {[
            '신체운동, 건강',
            '의사소통',
            '사회관계',
            '예술경험',
            '자연탐구',
          ].map((name, index) => (
            <div className="wire-growth__row" key={name}>
              <span>{name}</span>
              <span
                className="wire-growth__bar"
                style={{
                  width: `${(report.counts[index] / Math.max(...report.counts)) * 160}px`,
                }}
              >
                <span className="sr-only">{report.counts[index]}회</span>
              </span>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="screen-content screen-content--center">
            <div className="empty-circle" />
            <h2>아직 리포트를 만들 수 없어요</h2>
            <p>활동을 더 마치면 발달 영역을 보여드려요.</p>
          </div>
          <div className="screen-actions">
            <Link className="button button--primary" to="/activities">
              활동지 보러가기
            </Link>
          </div>
        </>
      )}
      {choosing && (
        <WireDialog
          title="리포트 기간"
          sheet
          onClose={() => setChoosing(false)}
        >
          <h2>조회 기간</h2>
          <div className="sort-options">
            {['최근 1개월', '최근 3개월', '최근 6개월'].map((value) => (
              <label key={value}>
                {value}
                <input
                  type="radio"
                  name="report-period"
                  checked={period === value}
                  onChange={() => setPeriod(value)}
                />
              </label>
            ))}
          </div>
          <button
            className="button button--primary"
            onClick={() => setChoosing(false)}
          >
            적용하기
          </button>
        </WireDialog>
      )}
    </div>
  );
}
