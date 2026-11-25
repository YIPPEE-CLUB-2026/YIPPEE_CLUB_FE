# Cloudflare Pages 배포 설정

## 현재 상태

- 고객 도메인: `https://www.yippeclub.com` (정확한 철자: yippeclub)
- 관리용 메일: `yippeclub1@gmail.com` (관리자 권한 자동 부여에 사용하지 않음)
- 개발 API: `http://54.206.246.207:8080/api/v1`
- 운영 예정 API: `https://api.yippeclub.com/api/v1` (HTTPS 개통 전)
- Google 테스트 로그인 계정: `yuldo04@gmail.com` (공급자 콘솔 등록 필요)
- 토스 테스트 클라이언트 키: 미제공

현재 고객용 앱은 Next.js 안의 클라이언트 React Router로 동작합니다.
Pages에서는 루트 앱을 정적으로 내보내고, 없는 경로를 index.html로 보내는 Pages의 SPA fallback을 사용합니다.
로컬 개발의 동적 경로와 API 프록시는 그대로 유지합니다.

## Pages 프로젝트 설정

- 저장소: `YIPPEE-CLUB-2026/YIPPEE_CLUB_FE`
- 프로젝트 루트: 레포 루트 (apps/admin이 아님)
- 프레임워크 프리셋: None 또는 사용자 지정
- 설치: `npm ci`
- 빌드 명령: `npm run build:pages`
- 빌드 출력 폴더: `out`
- Node.js: 24
- 운영 브랜치: 팀에서 실제 배포할 브랜치를 지정합니다. 현재 main에는 기본 설정만 있으므로 main을 바로 지정하면 현재 구현은 배포되지 않습니다.

`.env.pages.example`의 공개 빌드 변수를 Pages 환경변수로 등록합니다.
`NEXT_PUBLIC_API_BASE_URL=https://api.yippeclub.com/api/v1`을 사용합니다.
`API_PROXY_TARGET`은 로컬 Next 서버 전용이며 Pages 정적 파일에는 프록시가 없습니다.
토스 키가 없으면 빈 값으로 두며 유료 주문 생성은 차단됩니다.
클라이언트 시크릿, 토스 시크릿, AWS 자격 증명은 프론트 환경변수에 넣지 않습니다.

`build:pages`는 `.pages-build`에 원본을 복사해 정적 빌드하고 `out`을 생성합니다.
원본 src 및 실행 중인 개발 서버의 .next에는 변경을 가하지 않습니다.
생성 결과에서 고객용 최상위 404.html을 제거해 SPA fallback을 활성화합니다.
관리자 앱과 UI 미리보기 HTML은 고객용 배포 산출물에 포함하지 않습니다.

## DNS와 HTTPS (아직 적용하지 않음)

1. BE 담당자: `api`의 A 레코드를 `54.206.246.207`로 지정합니다.
2. BE 담당자: API 서버의 TLS 인증서와 443 리버스 프록시를 구성합니다.
3. `https://api.yippeclub.com/api/v1/health/` 및 브라우저의 CORS 허용 응답을 확인합니다.
4. Pages의 Custom domains에 `www.yippeclub.com`을 먼저 추가합니다.
5. Pages에서 안내한 CNAME 대상에 맞춰 GoDaddy DNS의 `www` 레코드를 설정합니다. 임의의 pages.dev 주소를 추정해 입력하지 않습니다.
6. 루트 `yippeclub.com`을 함께 사용할 경우 Cloudflare의 도메인/네임서버 요구사항을 확인하고 www로 통일합니다. 레지스트라가 GoDaddy여도 DNS 운영사는 별개일 수 있습니다.
7. 웹 HTTPS 인증서 발급이 끝난 뒤 운영 콜백 경로를 확인합니다.

A 레코드 등록만으로 API HTTPS가 생기지는 않습니다.
정적 HTTPS 프론트에서 HTTP API로 요청하면 혼합 콘텐츠로 차단되므로 API HTTPS 개통을 배포 전 조건으로 둡니다.
BE는 운영 origin `https://www.yippeclub.com` 및 `https://yippeclub.com`을 허용해야 합니다.

## 소셜 로그인

사용자 동의 → 공급자 인가 화면 → `/auth/callback/{provider}` → BE 코드 교환 → JWT 세션입니다.
Apple 버튼 대신 BE가 지원하는 Google 버튼을 사용합니다.

| 공급자 | 로컬 Redirect URI                            | 운영 Redirect URI                                |
| ------ | -------------------------------------------- | ------------------------------------------------ |
| 카카오 | `http://localhost:3000/auth/callback/kakao`  | `https://www.yippeclub.com/auth/callback/kakao`  |
| 네이버 | `http://localhost:3000/auth/callback/naver`  | `https://www.yippeclub.com/auth/callback/naver`  |
| 구글   | `http://localhost:3000/auth/callback/google` | `https://www.yippeclub.com/auth/callback/google` |

`127.0.0.1:3000`에서 시작하면 동의 전에 localhost:3000으로 이동해 저장소와 콜백 origin을 일치시킵니다.
운영 apex에서도 www로 이동합니다. 등록되지 않은 pages.dev 미리보기 도메인에서는 OAuth를 시작하지 않습니다.
모든 공급자의 state를 검증하고 10분 초과 요청·다른 공급자·다른 callback을 거절합니다.
네이버만 BE 본문에 state를 보내며 그 외 정의되지 않은 필드는 보내지 않습니다.
코드 교환은 동일 Promise를 공유하고 소비 상태도 저장하므로 StrictMode와 새로고침에서 재사용하지 않습니다.
오류 후에는 공급자 로그인부터 다시 시작합니다. BE request_id는 오류 화면에 표시합니다.

Google Cloud의 OAuth 테스트 사용자에 `yuldo04@gmail.com`을 추가해야 합니다.
이 파일 기록만으로 콘솔의 테스트 사용자나 도메인 소유권, 관리자 권한이 등록되지는 않습니다.

## 배포 후 확인

- `/login`, `/auth/callback/google`, `/password/reset#reset_token=...` 직접 접속과 새로고침
- 세 공급자 신규 가입과 기존 로그인 (실제 계정 동의는 사용자가 직접 수행)
- 약관 미동의, state 불일치, 취소, 코드 만료와 중복 호출 방지
- CORS, API 파일 다운로드, 이미지 HTTPS 주소
- 토스 테스트 키 제공 후 결제창·콜백·승인 테스트

## 참고 문서

- https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.kakao.com/docs/ko/kakaologin/rest-api
- https://developers.naver.com/docs/login/api/api.md
- https://developers.google.com/identity/protocols/oauth2/web-server
