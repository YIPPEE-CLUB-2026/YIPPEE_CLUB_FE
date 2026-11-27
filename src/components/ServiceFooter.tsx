import { Link } from 'react-router-dom';
import { policyLinks } from '../data/policies';

export function ServiceFooter() {
  return (
    <footer className="service-footer" aria-label="서비스 정책 및 사업자 정보">
      <strong>YIPPEE CLUB</strong>
      <nav aria-label="서비스 정책">
        {policyLinks.map(({ key, title }) => (
          <Link key={key} to={`/policies/${key}`}>{title}</Link>
        ))}
      </nav>
      <details>
        <summary>사업자 정보</summary>
        <dl>
          {['상호', '대표자', '사업자등록번호', '통신판매업 신고번호', '사업장 주소', '유선번호', '고객센터 이메일·운영시간'].map((label) => (
            <div key={label}><dt>{label}</dt><dd>확인 후 안내 예정</dd></div>
          ))}
        </dl>
      </details>
      <small>사업자 정보 및 정책은 검토 중입니다.</small>
      <small>© YIPPEE CLUB</small>
    </footer>
  );
}
