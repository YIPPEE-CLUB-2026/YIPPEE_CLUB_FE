import type { Activity } from '../types';
import { LinesActivityCover } from './LinesActivityCover';

export function ActivityThumbnail({ activity }: { activity: Activity }) {
  const title = activity.title.replace(/\s/g, '');
  if (title === '실선이랑점선이랑') return <LinesActivityCover />;
  const puzzle = title.includes('나만의퍼즐만들기');
  const transport = title.includes('어디서탈까요');
  if (puzzle || transport) {
    return (
      <LinesActivityCover
        title={activity.title}
        variant={puzzle ? 'puzzle' : 'transport'}
      />
    );
  }
  return activity.thumbnail ? <img src={activity.thumbnail} alt="" /> : null;
}
