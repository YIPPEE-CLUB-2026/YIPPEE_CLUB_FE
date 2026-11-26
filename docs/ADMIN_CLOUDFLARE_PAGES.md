# 관리자 Cloudflare Pages 별도 배포

고객 프로젝트와 별도 프로젝트를 생성합니다. 저장소는 같은 YIPPEE_CLUB_FE를 사용하며 운영 도메인은 admin.yippeclub.com을 제안합니다.

| 항목 | 설정 |
|---|---|
| Production branch | develop |
| Framework preset | None |
| Root directory | 비워두기 (저장소 루트) |
| Build command | npm ci --prefix apps/admin && npm run admin:build:pages |
| Build output directory | apps/admin/out |
| NODE_VERSION | 24 |
| NEXT_PUBLIC_API_BASE_URL | https://api.yippeclub.com/api/v1 |

루트 의존성은 Pages 자동 설치를 사용하고 관리자 의존성은 빌드 명령 첫 단계에서 설치합니다. npm ci에는 apps/admin/package-lock.json을 사용합니다.

빌드 스크립트는 격리된 apps/admin/.pages-build에서 빌드하므로 로컬 개발 서버의 .next를 덮어쓰지 않습니다. 로컬 .env 파일을 복사하지 않고 운영에서는 가상 로그인을 강제 해제합니다. HTML 가상 미리보기는 산출물에서 제외됩니다. 조회 메뉴는 ?view= 경로를 사용합니다.

## 도메인

1. 새 Pages 프로젝트의 Custom domains에 admin.yippeclub.com 추가.
2. GoDaddy에 CNAME admin → 해당 관리자 프로젝트.pages.dev 등록. 고객 www 레코드는 수정하지 않음.
3. 관리자 도메인 HTTPS 활성화 확인.
4. BE CORS_ALLOWED_ORIGINS에 https://admin.yippeclub.com 추가.
5. Cloudflare Access로 관리자 도메인과 기본/Preview 경로 보호. 상세 기준은 ADMIN_SECURITY_AND_BE_REQUESTS.md 참고.

Pages 기본 주소를 CORS에 추가하지 않아도 화면이 열릴 수 있으나 로그인이 차단될 수 있습니다. 운영 인증은 지정한 관리자 도메인에서 확인합니다.

## 운영 보안

- 별도 호스트나 정적 배포만으로 접근 제한이 완성되지 않습니다.
- Access 보호를 확인하기 전 URL을 운영자들에게 일반 배포하지 않습니다.
- 관리 데이터는 HTML에 포함하지 않으며 실제 관리자 토큰으로 API를 조회합니다.
- 응답 헤더는 산출물 _headers에서 no-store, noindex, frame-ancestors 등을 적용합니다.
- 관리자 로그인 화면은 서버 권한 확인 후에만 관리 화면을 엽니다.
- 비밀키·공유 비밀번호를 Pages 환경변수에 넣지 않습니다.
