# YIPPEE CLUB 노트북 작업 인수인계

작성일: 2026-11-27 (한국 시간). 이 문서는 현재 PC의 실제 Git/코드를 확인해 작성한 작업 재개용 문서입니다.

> 후속 업데이트: 사용자 요청으로 아래 미커밋 작업과 이 문서를 하나의 커밋에 포함하여 develop에 푸시합니다. GitHub에서 이 문서가 포함된 커밋을 받았다면 아래 '미커밋' 표현은 작성 당시 기록이며 소스도 함께 포함되어 있습니다. 최종 커밋은 `git log -1`로 확인하고 노트북에서 `git pull --ff-only origin develop` 후 재개하세요. 이후 추가 작업은 별도로 status를 확인하세요. 정책은 여전히 초안이며 난이도 normal의 BE 배포는 별도입니다.

## 0. 제일 먼저 읽기: GitHub만 받으면 최신 작업이 없음

**현재 FE의 최근 변경은 커밋·푸시 전입니다.** 원격 develop은 `0727196`이고, 부모/아이 가입 화면·정책 페이지·구매자 다운로드 버튼·다운로드 중복 수정·난이도 3단계는 현재 PC 작업 폴더에만 있습니다. 이 문서도 아직 미커밋 파일입니다.

노트북으로 이동하기 전에 아래 중 하나로 소스를 전달해야 합니다.

1. 현재 PC에서 변경을 검토하고 FE develop에 커밋·푸시한 뒤 노트북에서 pull. **develop push는 고객/관리자 자동 배포를 일으킬 수 있으므로 초안 공개 여부까지 검토할 것.**
2. 아직 배포하지 않을 경우 현재 FE 작업 폴더를 별도로 복사해 전달. `node_modules`, `.next`, `.pages-build`, `out`, 로그는 제외 가능. `.git`을 제외한 복사본은 노트북의 동일 커밋 checkout에 덮어쓴 뒤 diff를 검토. 비밀 환경파일은 일반 압축 공유에 포함하지 말고 안전하게 별도 설정.

`git diff`만 저장하면 새 파일(untracked)이 빠지므로 주의. MD 하나를 전달한다고 소스가 함께 전달되는 것은 아닙니다. 이 요청에서는 자동 커밋·푸시하지 않았습니다.

## 1. 저장소와 정확한 작업 위치

| 구분 | Git 주소 | 현재 PC 경로 | 현재 브랜치/커밋 |
|---|---|---|---|
| FE (고객+관리자 모노레포) | https://github.com/YIPPEE-CLUB-2026/YIPPEE_CLUB_FE.git | `D:\Documents\YIPPEE_CLUB\YIPPEE_CLUB_2026_FE` | develop / 0727196 |
| BE (Spring) | https://github.com/YIPPEE-CLUB-2026/YIPPEE_CLUB_BE.git | `D:\Documents\YIPPEE_CLUB\YIPPEE_CLUB_2026_BE` | main / eeb46c6 |

- FE `feature/ui-layout`: f784dd3. 예전 UI 브랜치이며 지금 작업은 develop.
- FE `main`: cbda0ab. 초기 프로젝트 상태이므로 최신 서비스 작업에 사용하지 말 것.
- BE main의 마지막 커밋 메시지: `merge: dev → main (전체 테스트 114개 통과) (#7)`.
- BE 작업 트리는 작성 시 clean. 이번 난이도 변경은 **BE 코드에 반영하지 않았음**.
- remote tracking 정보는 현재 로컬 상태 기준이며 노트북에서 fetch 후 새 커밋 유무 확인.
- 상위 폴더에 `YIPPEE_CLUB_FE`, `Yippee_club_frontend`, `YIPPEE_CLUB_BE`, `Yippee_club_backend` 등 유사 폴더가 많음. 이름만 보고 예전 폴더를 수정하지 말고 `git remote -v`, 현재 커밋, package.json을 확인할 것.

## 2. 주소 모음

| 용도 | 주소 | 비고 |
|---|---|---|
| 고객 운영 | https://www.yippeclub.com | 소셜 로그인 정식 origin |
| 고객 apex | https://yippeclub.com | 소셜 로그인은 www로 통일 |
| 고객 Pages | https://yippee-club-fe.pages.dev | 이 주소에서 OAuth 시작은 제한 |
| 관리자 운영 | https://admin.yippeclub.com | 사용자 화면에서 DNS/SSL Active 확인 |
| 관리자 Pages | https://yippee-club-admin.pages.dev | 별도 프로젝트. Access 우회 경로 보호도 필요 |
| 배포 API | https://api.yippeclub.com/api/v1 | 로컬 FE도 현재 여기에 연결 |
| Swagger | https://api.yippeclub.com/swagger-ui/index.html | 활성화 상태는 서버 설정에 따라 달라짐 |
| OpenAPI | https://api.yippeclub.com/v3/api-docs | 명세 필드 설명이 불충분할 수 있음 |
| 고객 로컬 | http://localhost:3000/ | 로그인/OAuth는 localhost 권장 |
| 고객 로컬 별칭 | http://127.0.0.1:3000/ | localhost와 브라우저 저장소는 별개 |
| 관리자 로컬 | http://127.0.0.1:3100/ | 실제 인증 모드 |
| 관리자 로컬 별칭 | http://localhost:3100/ | 127 주소와 세션 공유 안 됨 |
| 과거 API | http://54.206.246.207:8080/api/v1 | 옛 연결 정보. 새 HTTPS 화면에 사용하지 말 것 |

도메인 철자 주의: 서비스 표기는 YIPPEE지만 도메인은 **yippeclub.com**입니다.

## 3. 기술 구성과 설치

- FE: Next.js 16.4.6, React 19.3.1, TypeScript 약 5.9.3, react-router-dom 7.18.5.
- 고객: Next 안에서 React Router로 동작하는 클라이언트 앱. Pages에서는 정적 export + SPA fallback.
- 관리자: `apps/admin`의 별도 Next 앱. 메뉴는 `?view=` 방식. Chart.js 사용.
- 스타일은 기존 CSS. Tailwind 도입하지 않았음.
- Node는 24 권장(Cloudflare NODE_VERSION=24). package engines 최소 22.12.0.
- BE: Java 17, Spring Boot 4.1.3, Gradle wrapper, MySQL 8, Flyway. 예전 Django 프로젝트와 혼동 금지.
- 저장소 AGENTS.md를 읽고, Next 수정 전 번들 문서 `node_modules/next/dist/docs`를 확인해야 함.

노트북 신규 clone 예시(PowerShell, 경로는 노트북에 맞게 변경):

```powershell
git clone https://github.com/YIPPEE-CLUB-2026/YIPPEE_CLUB_FE.git YIPPEE_CLUB_2026_FE
git clone https://github.com/YIPPEE-CLUB-2026/YIPPEE_CLUB_BE.git YIPPEE_CLUB_2026_BE
Set-Location YIPPEE_CLUB_2026_FE
git switch develop
git fetch origin
git status --short
npm ci
npm ci --prefix apps/admin
```

기존 노트북 checkout이면 dirty 상태를 먼저 확인하고 작업을 보존한 뒤 `git pull --ff-only origin develop`. 강제 reset/clean으로 로컬 작업을 지우지 말 것. 미커밋 전달본이 있다면 그 파일들도 적용한 뒤 확인.

## 4. 로컬 환경파일: Git에 없으므로 재생성

FE 루트 `.env.local`:

```dotenv
API_PROXY_TARGET=https://api.yippeclub.com
NEXT_PUBLIC_API_BASE_URL=/api/v1
```

`apps/admin/.env.local`:

```dotenv
API_PROXY_TARGET=https://api.yippeclub.com
NEXT_PUBLIC_API_BASE_URL=/api/v1
ADMIN_UI_PREVIEW=false
```

- `/api/v1` 요청을 로컬 Next rewrite가 HTTPS BE로 프록시함. 로컬이라고 로컬 DB가 되는 것이 아님.
- 등록/주문/다운로드/환불은 **공유 배포 서버 데이터에 영향**을 줄 수 있음. 테스트 활동지·계정을 구분.
- 서버 측 API_PROXY_TARGET은 origin만 입력. `/api/v1`까지 붙이면 경로 중복 가능.
- 환경변수 변경 후 개발 서버 재시작. 공개 NEXT_PUBLIC 변수는 정적 배포 시 재빌드 필요.
- `.env*`는 gitignore. `.env.example`, `.env.pages.example`만 예외.
- 토스 테스트가 필요하면 루트에 `NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...` 별도 설정. 실제 값은 이 문서에 없음.
- 시크릿 키, AWS 키, JWT, 비밀번호는 NEXT_PUBLIC/Git/문서/캡처에 넣지 말 것.
- 관리자 메일: `yippeclub1@gmail.com`. 비밀번호는 문서에 기록하지 않으며 담당자에게 안전한 경로로 확인. ADMIN_EMAILS 등록은 BE에서 관리.
- 과거 대화에 비밀번호가 노출되었으므로 운영 전 별도 보안 경로로 변경하는 것이 필요. FE 하드코딩 금지.

## 5. 실행·중지·검증 명령

고객/관리자를 각각 별도 터미널에서 실행:

```powershell
# FE 루트
npm run dev
```

```powershell
# FE 루트, 다른 터미널
npm run admin:dev
```

기본 고객 명령은 127.0.0.1 바인딩. 현재 PC에서는 localhost 브라우저 접근을 위해 아래 방식도 사용했음:

```powershell
node node_modules/next/dist/bin/next dev --hostname 0.0.0.0 --port 3000
```

0.0.0.0 바인딩은 같은 네트워크에서 접근 가능할 수 있으므로 필요한 경우에만 사용. localhost는 항상 **접속 중인 노트북 자체**를 뜻하며 데스크톱 서버로 이어지지 않음.

```powershell
npm run typecheck
npm run admin:typecheck
npm test
npm run build:pages
npm run admin:build:pages
```

- 고객 출력 `out`, 관리자 출력 `apps/admin/out`.
- `.pages-build`와 `apps/admin/.pages-build`에서 격리 빌드하므로 개발용 .next를 직접 덮어쓰지 않음.
- 최근 검증: FE 타입 검사, 관리자 타입 검사, 테스트 17개, 고객/관리자 Pages 빌드 성공. 유료 실결제 전체 검증을 의미하지 않음.
- Windows에서 EPERM mkdir 오류가 발생했을 때 권한을 조정한 실행으로 빌드 성공했음. 코드 오류로 단정하지 말 것.
- EADDRINUSE는 이미 해당 포트가 사용 중이라는 뜻. 두 번째 서버를 계속 띄우지 말고 프로세스 확인.

```powershell
Get-NetTCPConnection -State Listen -LocalPort 3000,3100 -ErrorAction SilentlyContinue
Invoke-WebRequest http://localhost:3000/ -TimeoutSec 30
Invoke-WebRequest http://127.0.0.1:3100/ -TimeoutSec 30
```

터미널에서 띄운 서버는 Ctrl+C로 종료. PID 종료 시 반드시 해당 개발 서버인지 확인. 현재 PC의 프로세스·로그는 노트북에 자동 이관되지 않음. 현재 PC 로그는 상위 폴더 `customer-dev.log`, `customer-dev-error.log`, `admin-dev.log`, `admin-dev-error.log`.

BE를 노트북에서 직접 띄우는 것은 선택 사항이며 현재 FE 연결에는 필요 없음. 필요하다면 BE README/.env.example을 따라 Java 17·MySQL·메일·JWT·OAuth 환경을 준비한 후 `./gradlew.bat test`, `./gradlew.bat bootRun`. Gradle이 .env를 자동으로 읽는다고 가정하지 말 것. 운영 DB 자격증명/파일 저장소를 임의 복제하지 말 것.

## 6. 고객 API 연결 범위

아래 경로 앞에는 `/api/v1`이 붙습니다. '연결'은 FE 호출 코드가 있다는 뜻이며 모든 조합이 운영에서 검증됐다는 뜻은 아닙니다.

| 기능 | 연결 API/구현 | 상태/주의 |
|---|---|---|
| 이메일 존재 확인 | POST /auth/identifiers/check | 이메일 정규화 후 전송 |
| 가입 인증번호 | POST /auth/verification/send, /confirm | 메일 발송 환경·제한 별도 확인 |
| 일반 가입/로그인 | POST /auth/signup, /auth/login | 필수 동의·이메일 인증 토큰 사용 |
| 세션 | POST /auth/token/refresh, /auth/logout | 401 시 갱신 공유, 실패 시 세션 종료 |
| 소셜 | POST /auth/social/{provider} | 카카오/Google 버튼, 네이버 숨김 |
| 비밀번호 재설정 | POST /auth/password/reset-request, /reset-confirm | 메일·토큰 환경 확인 필요 |
| 프로필 | GET/PATCH /users/me | 이름·닉네임 저장, 이메일 읽기 표시 |
| 비밀번호 변경 | PATCH /users/me/password | 실제 API 사용 |
| 탈퇴 | MoreScreens.tsx의 WithdrawPage는 안내만 표시 | **FE API 미연결. 계정이 삭제되지 않는다고 명시** |
| 아이 | GET/POST /children, GET/PATCH/DELETE /children/{id} | 등록·조회·수정·삭제 연결 |
| 활성 아이 | PUT /users/me/active-child | child_id 전송, 선택 상태 연결 |
| 카테고리 | GET /activity-categories | 실제 목록 사용 |
| 활동지 | GET /activities, /activities/{id} | 서버 ID/표지/PDF/가격 변환 사용 |
| 장바구니 | GET /cart, POST /cart/items, DELETE /cart/items/{id} | 실제 API 연결 |
| 찜 | GET /favorites, POST /favorites, DELETE /favorites/{id} | App.tsx에서 실제 연결. 목록은 현재 page_size=100 한 페이지 조회라 대량 데이터 개선 검토 |
| 구매한 활동지 | GET /purchases/activities | plan/expires_at/expired 사용 |
| 결제 예상액 | POST /orders/quote | 서버 금액 및 refund_notice |
| 주문 생성 | POST /orders | agreed_to_payment, agreed_to_refund_notice 전송 |
| 토스 승인 | POST /payments/confirm | 결제 callback에서 호출. 현재 테스트 클라이언트 키만 허용 |
| 주문 조회 | GET /orders, /orders/{id} | 주문번호 표시, 상세 표지 보완 |
| 취소/환불 요청 | POST /orders/{id}/cancel | 사유 전송. 관리자 승인과 구분 |
| 영수증 | GET /orders/{id}/receipt | 0원 주문 등 영수증 없는 응답 처리 확인 |
| 코드 PDF | POST /activities/{id}/download → 반환 download_url GET | 원본 직접 대체 다운로드 금지 |

기록·추천·가이드·리뷰 등은 화면이 있다는 이유로 모두 API 완료라고 판단하지 말 것. 이 문서의 확정 목록 밖 기능은 실제 호출/명세부터 확인. 데모 화면과 실서비스 화면이 공존하며 `DemoActivityDetailPage`는 별도 데모입니다.

## 7. 관리자 API 연결 범위

관리자 UI는 고객 로그인과 별도 세션. 메일이 같아도 고객 토큰을 관리자 저장소로 복사하지 않음. 모든 /admin API 권한은 서버가 검사.

| 화면/기능 | 연결 API |
|---|---|
| 로그인·권한 | 실제 로그인 토큰으로 관리자 API 접근 검사. ADMIN_EMAILS 등록 필요 |
| 운영 대시보드 매출 | GET /admin/sales?unit=day/month/year&date=... |
| 주문 목록/상세 | GET /admin/orders, /admin/orders/{id} |
| 결제사 재조회 | POST /admin/orders/{id}/reconcile |
| 전액 환불 | POST /admin/orders/{id}/refund |
| 환불 요청 목록 | GET /admin/orders/refund-requests?status=... |
| 환불 승인/반려 | POST /admin/orders/refund-requests/{id}/approve 또는 /reject |
| 회원 검색 | GET /admin/users?email=... |
| 회원 정지/복구 | PATCH /admin/users/{id} |
| 카테고리 생성 | POST /admin/categories |
| 카테고리 목록 | GET /activity-categories |
| 활동지 등록 | POST /admin/activities (multipart) |
| 활동지 정보 수정 | PATCH /admin/activities/{id} |
| 활동지 파일 교체 | POST /admin/activities/{id}/files (multipart) |
| 발급 목록/검색 | GET /admin/worksheet-issuances?code=&user_id=&activity_id=&page=&page_size= |
| 발급 상세/이용 이력 | GET /admin/worksheet-issuances/{id} |
| 주문별 다운로드 기록 | GET /admin/orders/{id}의 downloads 사용. 별도 신규 API 아님 |

- 사진 인증 검수, 문의·프로모션 등 '준비' 메뉴는 실제 완료 기능이 아님.
- 카테고리 학년·연령 트리/태그 편집/삭제는 추가 API 필요.
- 코드 재발급·무효화, 기한·횟수 수동 편집은 지원하지 않음.
- Chart.js 일/월/년 전환 구현. KST 기준; 일은 시간 24칸, 월은 날짜별, 년은 월 12칸.
- paid_amount는 결제 승인 시각, refund_amount는 환불 확정 시각 기준. net=paid-refund이며 음수 가능. 0원 주문은 매출 지표에서 제외.
- API unit/date가 필수. day=YYYY-MM-DD / month=YYYY-MM / year=YYYY.

## 8. 지금 PC에만 있는 변경 상세

### 8.1 신규 가입 부모 → 아이 화면
- AuthPage 일반 가입 성공 / SocialCallbackPage is_new_user=true → `/signup/parent`.
- 이름·닉네임은 PATCH /users/me로 저장. 이메일은 로그인 프로필로 표시.
- 저장 후 `/signup/child`; 기존 아이 API 사용. 나중에 등록 가능.
- 기존 회원 로그인은 매번 가입 화면을 강요하지 않음.
- 흰색 배경. 부모 관계·연령대는 BE 필드가 없어 사용자 승인으로 제외.
- 중간 이탈 후 재로그인 시 미완료 단계 복구 플래그는 없음.

### 8.2 하단 정책 링크와 본문
- 홈 하단 ServiceFooter → `/policies/terms`, `/policies/privacy`, `/policies/refund`, `/policies/marketing`.
- 로그인 없이 직접 진입 가능. 흰색 배경, 피그마 문서 레이아웃 참고.
- 본문은 **검토용 초안**, 시행일 미정. 사업자 실제 정보는 임의 생성하지 않음.
- 사업자 정보 펼침 영역은 상호·대표·등록번호·신고번호·주소·유선번호·고객센터 모두 확인 예정.
- 개인정보 위탁/국외 이전/보유 기간/책임자/아동 동의는 실제 운영 현황 확인 후 확정 필요.
- 현재 그대로는 결제 심사 최종 제출용 아님. 정책 초안 작성과 법적 검토 완료는 다름.

### 8.3 이미 구매한 활동지 버튼
- 사용자 정정 사항: **이미 다운로드한 사람이 아니라 결제 완료한 사람 기준**.
- ActivityDetailPage에서 /purchases/activities 조회 후 해당 ID가 있고 expired=false면 다운로드 버튼 → `/viewer/{id}`.
- 0원으로 완료한 주문도 권한이 있으면 동일하게 다운로드 가능.
- 환불된 권한은 BE 구매 목록에서 제외; 만료는 expired=true이므로 구매 버튼 유지.
- 구매 확인 중에는 버튼 비활성. 실패하면 구매 확인 재시도. 계정/활동지 변경 시 이전 결과 재사용 방지.
- 재구매 방지를 위해 보유 상품 장바구니 버튼도 비활성화.

### 8.4 다운로드 두 배 집계 수정
- 기존: Viewer 진입 시 코드 PDF GET(1회), 저장 클릭 시 다시 발급+GET(1회) → 총 2회.
- BE는 코드 PDF GET마다 pdf_downloads를 남김. HEAD는 제외.
- 수정: 처음 받은 코드 PDF Blob을 미리보기·저장·인쇄에 재사용. 저장 파일명은 응답 file_name 사용.
- 중단된 비동기 화면이 뒤늦게 발급을 시작하지 않도록 signal 확인 추가.
- **현재 정의는 파일 열람/전송 횟수**. 화면 열기+같은 화면에서 저장=1회. 재진입/새로고침=새 1회.
- 저장 버튼만 세는 요구라면 BE 이벤트 계약을 별도 설계해야 함. 실제 디스크 저장 완료를 서버 GET만으로 증명할 수 없음.
- 기존 4회 등 기록은 수정하지 않았고 단순히 절반으로 나누면 안 됨.
- tests/viewer-download.test.cjs 추가: 코드 PDF 1회 취득, Blob 저장 링크, 추가 API 호출 없음 확인.

### 8.5 난이도 하/중/상
- 관리자 등록·수정 선택지와 목록 표시: 하=easy / 중=normal / 상=hard.
- **FE만 변경. BE 배포 미완료.** 현재 BE AdminController 생성·수정, CatalogController 필터가 easy/hard만 허용.
- V1 DB CHECK도 easy/hard뿐. 새 Flyway migration으로 normal 추가해야 함(V1 직접 수정 금지).
- 명세/Swagger/테스트와 배포 필요. 현재 '중' 등록이 성공한다고 안내하지 말 것.

## 9. PDF 발급 계약과 개인정보

- download 응답: download_url, expires_at, file_name, issuance_code.
- 예: W0007-K7WX-9M4R-Q2TV.pdf. 예시 코드이며 실제 계정과 혼동 금지.
- 같은 회원·같은 활동지는 같은 코드 재사용. 랜덤 부분으로 구매자 개인정보를 직접 노출하지 않음.
- 사용자/활동지/발급 정보는 서버 권한으로 추적. '테이블이 정확히 3개뿐'인 구조가 아님. 실제로 주문·권한·다운로드 등 여러 테이블이 존재.
- 200이면 코드가 찍힌 PDF가 이미 준비됨. 202 생성 중 상태나 폴링 없음.
- PDF_GENERATION_FAILED(500)는 잠시 후 재시도 안내. 코드 없는 원본으로 fallback하지 않음.
- 발급 검색 코드는 전체 정확 일치, 소문자·공백 허용, 부분 검색 불가.
- right: active / expired / revoked / free. 무료 발급 order_id는 null 가능, last_downloaded_at도 null 가능.
- 상세는 email 및 최근 100건 다운로드 시간/IP/user-agent 포함. 관리자 외 공개 금지.
- PDF 기본 코드 위치가 오른쪽 위라 도안 이름 칸과 겹친다는 BE 피드백 있음. 위치·적용 페이지·발급 단위 협의 필요.
- PDF 등록: 표지와 파일 multipart. 암호 PDF/손상 PDF 오류 처리. 기존 문서의 업로드 제한은 표지 5MB/PDF 20MB UI 기준이며 서버 제한도 함께 확인.

## 10. OAuth·로그인·CORS 주의

- 카카오 정상 로그인은 사용자가 이전에 확인. 네이버는 개발 상태/이메일 동의 문제로 미루기로 하여 버튼 숨김. 코드 전체 삭제는 아님.
- Google 버튼은 있음. 모든 계정/환경에서 로그인 완료를 보장한 상태 아님.
- 로컬 OAuth 콜백: `http://localhost:3000/auth/callback/kakao` 및 `/google`.
- 운영: `https://www.yippeclub.com/auth/callback/kakao` 및 `/google`.
- 공급자 콘솔 Redirect URI와 BE 허용 URI도 일치해야 함. pages.dev 도메인을 무조건 추가하지 말 것.
- OAuth state 검증·한 번만 코드 교환·안전한 returnPath 검증 있음. origin 간 sessionStorage가 공유되지 않음.
- 관리자 세션 키 `yippee.admin.session`, 고객 `yippee.local.session`을 분리. 쿠키 삭제만으로 서버 권한 문제나 공급자 동의 문제는 해결되지 않음.
- CORS_ALLOWED_ORIGINS는 여러 origin 동시 허용 가능. 기존 목록을 지우고 로컬만 남기지 말 것.
- 이전에는 로컬/관리자 CORS 403이 있었지만 11/27 검사에서 `https://admin.yippeclub.com`, `http://localhost:3000` OPTIONS 200 확인. 모든 경로·실제 인증까지 완료됐다는 의미는 아님.
- 필요 목록: https://www.yippeclub.com, https://yippeclub.com, https://admin.yippeclub.com, http://localhost:3000, http://127.0.0.1:3000, http://localhost:3100, http://127.0.0.1:3100.
- pages.dev 직접 인증을 쓸 경우 해당 정확한 origin도 별도 검토. wildcard로 모두 열지 말 것.

## 11. 배포와 DNS

고객/관리자 모두 같은 FE 저장소의 develop을 연결한 별도 Cloudflare Pages 프로젝트. develop 커밋이 푸시되면 자동 배포되도록 설정한 상태이며 실제 배포 성공/커밋은 Dashboard에서 확인. 로컬 파일 수정만으로 배포되지 않음.

| 설정 | 고객 | 관리자 |
|---|---|---|
| Production branch | develop | develop |
| Root directory | 저장소 루트/빈 값 | 저장소 루트/빈 값 |
| Preset | None | None |
| Build command | npm run build:pages | npm ci --prefix apps/admin && npm run admin:build:pages |
| Output | out | apps/admin/out |
| NODE_VERSION | 24 | 24 |
| NEXT_PUBLIC_API_BASE_URL | https://api.yippeclub.com/api/v1 | 동일 |

- Pages 정적 파일에는 로컬 Next rewrite 프록시가 없음. 운영은 HTTPS API 직접 호출.
- 고객 산출물에는 관리자 앱/가상 HTML 포함 안 됨. 관리자 운영 가상 로그인은 강제 비활성.
- GoDaddy: www CNAME → yippee-club-fe.pages.dev, admin CNAME → yippee-club-admin.pages.dev, api A → 54.206.246.207 (이전 사용자 화면에서 확인).
- 루트 @ A는 당시 Parked였음. apex의 최종 전달/redirect 상태는 별도 점검 필요.
- GoDaddy 계정 소유/접근은 담당자에게 확인. 로그인 메일을 추정하지 말 것.
- 관리자 DNS Active/SSL enabled는 확인했으나 **Cloudflare Access 설정 완료는 확인하지 못함**.
- 주소만 알아도 관리자 로그인 화면은 열릴 수 있음. 관리자 API 권한과 사이트 진입 제한은 다른 문제.
- Access를 적용한다면 admin 도메인뿐 아니라 pages.dev 및 Preview 우회 경로도 보호해야 함. CORS만으로 인증·접근 제한이 되지 않음.
- BE GitHub push와 AWS 배포는 별개. FE Pages 자동 배포가 BE까지 배포하지 않음.

## 12. 토스 결제 현재 상태

- 사용자: 시크릿 키 발급받았다고 전달. 실제 키를 코드에 입력/설정 완료한 것은 확인하지 못함.
- FE paymentClientKey는 **test_ck_만 허용**. live_ck_를 넣어도 현재는 차단됨.
- BE TOSS_SECRET_KEY는 서버의 비밀 환경 변수. 프론트에는 별도 클라이언트 키만 필요.
- 0원 주문은 토스 결제 테스트를 대체하지 못함. 결제 승인·실패·취소·환불·매출 반영은 유료 테스트 주문으로 검증 필요.
- 운영 전환은 라이브 키로 문자열만 바꾸는 작업이 아님. 심사·실제 서버 키 모드·웹훅·승인/취소 검증 필요.
- 사업자 고지/약관/개인정보/환불정책이 없다고 심사 피드백 받음. 지금은 초안 페이지와 링크만 준비했으며 최종 정보는 미확정.

## 13. 남은 작업 우선순위

### 바로 할 것
1. 미커밋 소스를 노트북에 확실히 전달. 문서만 복사하고 끝내지 말 것.
2. 의존성/환경파일 설정 후 고객·관리자 켜기. 같은 배포 BE 연결 확인.
3. 구매 완료 계정 상세에서 다운로드 버튼 표시, 환불·만료 계정은 구입 표시 확인.
4. 관리자 횟수를 기록하고 Viewer 진입→저장 후 1만 증가하는지 실제 검증. 기존 4 기록은 보존.
5. BE에 난이도 요청서 전달: normal API/DB/명세/테스트 반영 후 배포.
6. 실제 사업자 정보 및 정책 확인 항목 수집. 초안 확정 전 심사 완료라고 주장하지 말 것.

### 다음 기능 검증
- 무료 가격 0원 등록/공개/주문/권한/코드 PDF까지 테스트. 7일권 미제공(null)과 무료 0원의 의미를 구분.
- 신규 일반·카카오/Google 가입에서 부모/아이 입력, 저장·건너뛰기·기존 로그인 복귀 확인.
- 고객 주문번호, 주문 상세 표지, 무료 주문 문구 확인. 비공개/삭제 상품의 표지 보완 실패 시 화면 유지 확인.
- 고객 주문 날짜는 현재 서버 미제공 문구이며 실제 결제 수단도 유료는 토스페이먼츠 일반명으로 표시. BE에 created_at/paid_at/payment_method 추가 요청 필요.
- 토스 테스트 결제 승인·취소·환불 후 이용권 회수 및 관리자 일/월/년 매출 반영 확인.
- 관리자 로그인, 비관리자 403, 만료 토큰 갱신, 로그아웃 후 접근 확인.
- Access 미인증 차단 및 pages.dev/Preview 우회 차단 확인.
- PDF 코드 위치(이름 칸 겹침) 및 적용 페이지 협의.

### 아직 계약/구현이 필요한 것
- 부모 관계·연령대 API 필드.
- 회원탈퇴 실제 API 연결. 현재 화면은 안내만 표시하므로 정책 초안의 탈퇴 절차 설명과 실제 기능도 일치시켜야 함.
- 가입 중간 단계 복구 상태.
- 사진 인증/도전과제 검수 API.
- 카테고리 트리·태그·수정/삭제 추가 계약.
- 문의·프로모션 등 준비 화면의 실제 API.
- 열람/다운로드/저장 지표 분리 여부.
- 정책 동의 버전·시각 관리, 개인정보/아동 동의/수탁자/국외 이전 고지 확정.
- 기관용 콘텐츠 라이선스 및 소장 재다운로드 보장 범위 확정.

## 14. 관련 파일 지도

| 위치(FE 저장소 기준) | 역할 |
|---|---|
| src/App.tsx | 라우트·가입 진입·인증 보호 |
| src/lib/api.ts | 고객 요청·토큰 갱신·파일 URL 처리 |
| src/services/* | 인증/아이/활동지/주문/결제 계약 |
| src/screens/ConnectedPages.tsx | 실제 활동지 상세·장바구니, 구매자 다운로드 버튼 |
| src/screens/ViewerPage.tsx | 코드 PDF fetch/Blob/저장·인쇄 |
| src/screens/OrderDetails.tsx, OrdersPage.tsx | 주문번호·고객 결제 내역 |
| src/screens/ParentRegistrationPage.tsx | 신규 부모 정보 입력 |
| src/screens/ChildRegistrationPage.tsx | 아이 입력 |
| src/screens/AuthPage.tsx, SocialCallbackPage.tsx | 가입 후 분기·소셜 복귀 |
| src/components/ServiceFooter.tsx | 정책 링크·사업자 정보 영역 |
| src/data/policies.ts, src/screens/PolicyPage.tsx | 정책 초안 본문·흰색 문서 화면 |
| src/styles.css, src/auth-spec.css | 정책/가입 스타일 |
| apps/admin/src/components/Sections.tsx | 관리자 주요 화면·등록폼·난이도 |
| apps/admin/src/lib/admin.ts, reporting.ts, api.ts | 관리자 API 타입·매출/발급·독립 세션 |
| scripts/build-pages.cjs, build-admin-pages.cjs | 고객/관리자 격리 Pages 빌드 |
| tests/viewer-download.test.cjs | PDF 중복 요청 회귀 검사 |

참고 문서: BE_API_SPEC.md, PDF_SERIAL_ISSUANCE_GUIDE.md, ADMIN_CLOUDFLARE_PAGES.md, ADMIN_SECURITY_AND_BE_REQUESTS.md, PAYMENT_REVIEW_READINESS.md, DOWNLOAD_COUNT_FINDINGS.md, BE_DIFFICULTY_THREE_LEVELS.md.

**오래된 문서 주의**: CLOUDFLARE_PAGES.md의 'HTTPS 개통 전', 'DNS 아직 적용하지 않음'은 과거 기록. 실제 현재 API HTTPS·admin DNS는 위 최신 상태 참고. INTEGRATION_FOLLOWUPS.md의 '다운로드 수정 미적용'도 과거 상태이며 현재 로컬에는 Blob 재사용 수정 있음. BE_HANDOFF_2026-11-27.md는 FE docs에서 확인되지 않았으므로 그 이름만 믿고 찾지 말 것. 상위 HANDOFF.md도 내용 시점 확인.

## 15. 현재 미커밋 파일 목록(인수인계 문서 작성 직전)

수정:
```text
apps/admin/next-env.d.ts (Next 생성 파일, 수동 기능 수정 아님)
apps/admin/src/components/Sections.tsx
apps/admin/src/lib/admin.ts
src/App.tsx
src/auth-spec.css
src/screens/AuthPage.tsx
src/screens/ChildRegistrationPage.tsx
src/screens/ConnectedPages.tsx
src/screens/HomePage.tsx
src/screens/SocialCallbackPage.tsx
src/screens/SupportSubPages.tsx
src/screens/ViewerPage.tsx
src/styles.css
```

새 파일:
```text
docs/BE_DIFFICULTY_THREE_LEVELS.md
docs/DOWNLOAD_COUNT_FINDINGS.md
docs/PAYMENT_REVIEW_READINESS.md
docs/LAPTOP_HANDOFF_2026-11-27.md (이 문서)
src/components/ServiceFooter.tsx
src/data/policies.ts
src/screens/ParentRegistrationPage.tsx
src/screens/PolicyPage.tsx
tests/viewer-download.test.cjs
```

실제 목록은 마지막에 `git status --short`로 다시 확인. 기존 작업을 덮어쓰거나 생성 파일을 무조건 되돌리지 말 것.

## 16. 노트북의 다음 담당 AI에게 그대로 전달할 메시지

> 이 문서 전체와 저장소 AGENTS.md를 먼저 읽어 주세요. FE는 develop, BE는 main입니다. 우선 Git 상태와 미커밋 소스 전달 여부를 확인하고 현재 작업을 보존해 주세요. 로컬 고객 3000/관리자 3100은 배포 HTTPS BE에 프록시 연결합니다. 최근 정책 초안·부모/아이 가입·구매자 다운로드 버튼·PDF 중복 GET 수정·난이도 3단계는 아직 푸시 전입니다. 난이도 normal은 BE/DB가 미지원이라 요청서대로 반영·배포가 필요합니다. 타입 검사·테스트 17개·양쪽 Pages 빌드는 통과했지만 유료 결제 E2E와 Access 검증은 남았습니다. 비밀키나 비밀번호를 출력/커밋하지 말고, 실제 사업자 정보를 추정하지 마세요. 문서의 API 연결과 실제 운영 검증 상태를 구분해 이어서 작업해 주세요.
