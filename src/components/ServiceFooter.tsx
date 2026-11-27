import { Link } from 'react-router-dom';
import { policyLinks } from '../data/policies';

const businessInfo = [
  ['상호', '이피클럽(YIPPEE CLUB)'],
  ['대표자', '권도영'],
  ['사업자등록번호', '561-37-01174'],
  ['통신판매업 신고번호', '확인 후 안내 예정'],
  ['사업장 주소', '경기도 용인시 수지구 죽전로 116, 202동 1602호'],
  ['전화번호', '010-6676-4912'],
  ['고객센터 이메일', 'yip2e2club.official@gmail.com'],
  ['운영시간', '평일 10:00~17:00 (점심 12:00~13:00), 주말·공휴일 휴무'],
];

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
          {businessInfo.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      </details>
      <small>© YIPPEE CLUB</small>
    </footer>
  );
}
