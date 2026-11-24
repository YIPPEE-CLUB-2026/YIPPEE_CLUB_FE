import { Link, useParams } from 'react-router-dom';
import { ActivityDesignHeader } from '../components/ActivityDesign';
import { demoActivities } from '../data/demo-activities';

// Demo purchases do not grant real document access. Originals stay outside public/.
export function DemoActivityViewerPage() {
  const { exampleSlug } = useParams();
  const activity = demoActivities.find((item) => item.slug === exampleSlug);
  const detailPath = activity ? `/activities/examples/${activity.slug}` : '/';
  return (
    <div className="screen activity-design">
      <ActivityDesignHeader title="활동지 보기" backTo={detailPath} />
      <div className="screen-content screen-content--center">
        <h2>
          {activity ? '구매 후 이용할 수 있어요' : '활동지를 찾을 수 없어요'}
        </h2>
        {activity && (
          <p>활동지 원본과 전체 가이드는 구매한 활동지에서 확인할 수 있어요.</p>
        )}
        <Link className="button" to={detailPath}>
          {activity ? '상세 화면으로' : '홈으로'}
        </Link>
      </div>
    </div>
  );
}
