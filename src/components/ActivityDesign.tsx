import type { ReactNode } from 'react';
import { useBack } from './NavigationHistory';

const files = {
  back: '60e11',
  cart: 'dbf84',
  share: '429d0',
  chevron: '83432',
  heart: '8d016',
  zoomOut: 'fc9bc',
  zoomIn: 'f0416',
  expand: '47d48',
  download: '0b3ab',
  print: 'f4a50',
};

export function ActivityDesignIcon({ name }: { name: keyof typeof files }) {
  return (
    <span className="activity-design-icon" aria-hidden="true">
      <img src={`/assets/activity-detail/${files[name]}.svg`} alt="" />
    </span>
  );
}

export function ActivityDesignHeader({
  title,
  backTo,
  right,
}: {
  title: string;
  backTo: string;
  right?: ReactNode;
}) {
  const back = useBack(backTo);
  return (
    <header className="activity-design-header">
      <button type="button" aria-label="뒤로가기" onClick={back}>
        <ActivityDesignIcon name="back" />
      </button>
      <h1>{title}</h1>
      <div>{right}</div>
    </header>
  );
}
