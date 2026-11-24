import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Activity } from '../types';
import { Icon } from './Icon';
import { ActivityThumbnail } from './ActivityThumbnail';

interface ActivityCardProps {
  activity: Activity;
  saved: boolean;
  onToggle: (id: number) => void;
  showSave?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
  preview?: boolean;
  onPreview?: () => void;
  detailTo?: string;
  showPreviewMeta?: boolean;
  saveIcon?: ReactNode;
}

export function ActivityCard({
  activity,
  saved,
  onToggle,
  showSave = true,
  selected = false,
  onSelect,
  preview = false,
  onPreview,
  detailTo,
  showPreviewMeta = preview,
  saveIcon,
}: ActivityCardProps) {
  const previewClick = preview
    ? (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        onPreview?.();
      }
    : undefined;
  return (
    <article
      className={`activity-card ${activity.location ? 'activity-card--experience' : ''}`}
    >
      <Link
        className="activity-card__thumbnail"
        to={preview ? '/login' : detailTo || `/activities/${activity.id}`}
        onClick={previewClick}
        aria-label={`${activity.title} 상세 보기`}
      >
        <ActivityThumbnail activity={activity} />
      </Link>
      {onSelect && (
        <label className="activity-card__select">
          <input
            type="checkbox"
            aria-label={`${activity.title} 선택`}
            checked={selected}
            onChange={() => onSelect(activity.id)}
          />
          <span aria-hidden="true">✓</span>
        </label>
      )}
      {showSave && (
        <button
          className="activity-card__save"
          type="button"
          aria-label={`${activity.title} ${saved ? '저장 해제' : '저장'}`}
          aria-pressed={saved}
          onClick={() => (preview ? onPreview?.() : onToggle(activity.id))}
        >
          {saveIcon || <Icon name={saved ? 'heartFilled' : 'heart'} />}
        </button>
      )}
      {showPreviewMeta ? (
        <div className="guest-activity-meta">
          <span
            className={`tag ${activity.subtitle === '신체&인지' ? 'tag--cognitive' : ''}`}
          >
            {activity.subtitle}
          </span>
          <span>
            {activity.durationMin === activity.durationMax
              ? `${activity.duration}분`
              : `${activity.durationMin ?? 5}-${activity.durationMax ?? 10}분`}
          </span>
        </div>
      ) : (
        <span className={`tag ${activity.location ? 'tag--location' : ''}`}>
          {activity.location ||
            (activity.duration
              ? activity.durationMin !== undefined
                ? activity.durationMin === activity.durationMax
                  ? `${activity.duration}분`
                  : `${activity.durationMin}–${activity.durationMax}분`
                : `${activity.duration}분`
              : '시간 미정')}
        </span>
      )}
      <Link
        className="activity-card__title"
        to={preview ? '/login' : detailTo || `/activities/${activity.id}`}
        onClick={previewClick}
      >
        {!showPreviewMeta && <span>[{activity.subtitle}]</span>}
        {activity.title}
      </Link>
      <Link
        className="activity-card__price"
        to={preview ? '/login' : detailTo || `/activities/${activity.id}`}
        onClick={previewClick}
      >
        <strong>{activity.price.toLocaleString('ko-KR')}원</strong>
      </Link>
    </article>
  );
}
