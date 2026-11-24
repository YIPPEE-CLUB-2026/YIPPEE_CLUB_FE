import { useNavigate } from 'react-router-dom';
import { GuideViewer } from '../components/GuideViewer';

export function BadgeGuidePage() {
  const navigate = useNavigate();
  return (
    <GuideViewer
      kind="badges"
      onClose={() => navigate('/', { replace: true })}
    />
  );
}
