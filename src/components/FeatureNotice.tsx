import { Link } from 'react-router-dom';
import { ScreenHeader } from './ScreenHeader';
export function UnavailablePage({ title, message }: { title: string; message: string }) {
  return <div className="screen"><ScreenHeader title={title} backTo="/profile" /><div className="screen-content"><h2>기능을 준비하고 있어요</h2><p>{message}</p><Link className="button" to="/support">고객센터</Link></div></div>;
}
export function FeatureNotice({ message }: { message: string }) {
  return <aside className="feature-notice" role="note">{message}</aside>;
}
