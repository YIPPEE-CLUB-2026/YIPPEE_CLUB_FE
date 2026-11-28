import { scrollAppToTop } from '../lib/scroll';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import { ServiceFooter } from '../components/ServiceFooter';
import { policies, policyLinks } from '../data/policies';

export function PolicyPage({ type }: { type: string }) {
  const policy = policies[type];
  const title = policyLinks.find((link) => link.key === type)?.title;
  useEffect(() => { scrollAppToTop(); }, [type]);
  if (!policy || !title) return <div className="screen policy-screen"><ScreenHeader title="서비스 정책" /><div className="policy-document"><p>요청하신 정책을 찾을 수 없습니다.</p><Link to="/">홈으로 이동</Link></div></div>;
  return (
    <div className="screen policy-screen" data-figma-node="413:9008">
      <ScreenHeader title={title} backTo="/" />
      <article className="policy-document">
        <h2>{title}</h2>
        <p className="policy-document__status">검토용 초안 · 시행일 확정 전</p>
        <p>{policy.intro}</p>
        {policy.sections.map((section) => <section key={section.title}><h3>{section.title}</h3>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</section>)}
      </article>
      <ServiceFooter />
    </div>
  );
}
