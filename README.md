# YIPPEE CLUB FE

TypeScript · React · Next.js 고객용 프론트엔드입니다.

## 실행

```sh
npm ci
```

`.env.example`을 `.env.local`로 복사하고 서버 설정을 확인합니다.

```sh
npm run dev
```

http://127.0.0.1:3000

## 실제 API 연동

- API 규격: 2026-11-24 Spring API_SPEC.md
- API_PROXY_TARGET: 현재 개발 BE 주소. EC2 이전 시 이 설정을 교체하고 서버를 재시작합니다.
- 브라우저는 동일 출처 `/api/v1`로 요청하며 Next.js가 BE로 전달합니다.
- 회원가입·이메일 인증·로그인·프로필·아이·찜·장바구니·구매 목록·다운로드·주문 조회·환불 요청·영수증을 BE API에 연결합니다.
- 활동지·카테고리·회원·아이·주문 ID는 BE 응답값을 사용합니다. 예시 음수 ID나 가상 로그인을 사용하지 않습니다.
- 토큰은 sessionStorage에 저장하며 401에서 갱신합니다. 갱신 실패 시 세션을 지웁니다.
- 빈 서버 목록은 샘플 데이터로 대체하지 않습니다.

## 결제

`NEXT_PUBLIC_TOSS_CLIENT_KEY`에는 BE와 동일한 상점의 API 개별 연동 테스트 클라이언트 키(`test_ck_...`)를 설정합니다. 시크릿 키는 프론트에 넣지 않습니다.

견적 → 서버 환불 고지 표시·동의 → 주문 생성 → 토스 결제창 → 서버 승인 순서입니다.
무료 주문은 BE가 `paid`를 반환했을 때만 완료 화면으로 이동합니다.
유료 결제 복귀 주소는 `/checkout/success`, `/checkout/fail`입니다.
승인 503·네트워크 오류는 확인 중으로 표시하며 같은 승인 요청을 재확인할 수 있습니다.
테스트 키가 없으면 유료 주문 생성과 결제창 진입을 차단합니다.
7일 이용권 가격·구매 권한은 응답에 매핑하지만 이용권 선택 UI는 아직 추가하지 않아 신규 주문은 영구 소장 기준입니다.

## 확인

```sh
npm test
npm run typecheck
npm run build
```

계정이 필요한 실제 변경·결제 테스트는 테스트 계정 및 상점 키로 별도 진행합니다.
현재 연동 서버의 카테고리와 활동지 목록은 비어 있습니다.
서버의 준비물·발달 영역 필드 및 추천·리뷰·배지·쿠폰·캐시 API는 명세에 없어 해당 서버 기능 연동은 제외합니다.

## 관리자 앱

고객 앱은 현재 루트에 유지하며, `apps/admin`을 별도 실행·배포 단위로 구성합니다.
관리자 앱에는 고객 UI의 노란색·크림색·브라운 분위기를 이어간 별도 데스크톱 레이아웃이 있습니다.

```sh
npm --prefix apps/admin ci
npm run admin:dev
```

관리자: http://127.0.0.1:3100 · 상세 설정: `apps/admin/README.md`

## 소셜 로그인과 Cloudflare Pages

카카오·네이버·Google 로그인은 약관 동의, state 검증, 일회용 인가 코드 교환을 사용합니다.
로컬 테스트 주소는 `http://localhost:3000/login`입니다.

```sh
npm run build:pages
```

Pages 빌드 명령은 위와 같고 출력 폴더는 `out`입니다.
운영 API HTTPS 개통과 공급자 콘솔 설정이 끝난 후 실제 배포·로그인을 확인합니다.
구체적인 환경변수와 GoDaddy/Pages 연결 순서는 `docs/CLOUDFLARE_PAGES.md`를 참고하세요.
