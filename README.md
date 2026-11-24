# YIPPEE CLUB 고객용 UI

`main`은 TypeScript + React + Next.js App Router 기본 설정만 포함합니다.
`feature/ui-layout`은 기존 고객용 UI와 페이지 이동 흐름을 옮긴 브랜치입니다.

## 실행

Node.js 22.12 이상을 사용합니다.

```sh
npm ci
npm run dev
```

http://127.0.0.1:3000 에서 확인합니다.

```sh
npm run typecheck
npm run build
```

## 포함 범위

- 기존 고객용 화면, 모바일 레이아웃, 이미지와 폰트
- React Router 경로, 화면 간 링크, 뒤로가기 및 로그인 후 복귀 흐름
- Next.js App Router 진입점: 홈과 하위 경로의 직접 접속/새로고침
- 로컬 샘플 활동지와 화면 검토용 세션

로그인 화면에 이메일 형식의 임의 값을 입력하면 화면 검토용 세션으로 진입합니다.
실제 계정, 인증 토큰, 서버 권한은 생성하지 않습니다. 로그아웃으로 세션을 지웁니다.
기존 기능의 빈 화면과 준비 중 안내는 그대로 유지하며 결제 성공을 가짜로 처리하지 않습니다.

## 제외 범위

- 실제 회원가입, 인증 메일, 토큰 갱신, BE 통신
- 실제 주문, 결제, 다운로드 권한, 운영 데이터
- 관리자 UI, Render/AWS 서버 주소, Cloudflare 배포 설정, 서비스 워커

`src/lib/api.ts`는 HTTP 호출을 하지 않는 UI 전용 어댑터입니다.
`src/services`는 화면에서 사용하는 함수 인터페이스이며, 기존 BE 구현을 연결하지 않습니다.
새 Spring API 연동은 별도 브랜치에서 진행합니다.
7일 이용권 선택, 환불 고지 등 UI 보완은 협의 후 반영합니다.

## 주요 경로

- `/`: 홈
- `/activities`, `/activities/:activityId`: 활동지 목록과 상세
- `/search`, `/search/results`: 검색
- `/saved`, `/cart`, `/checkout`, `/checkout/result`: 저장·장바구니·결제 화면
- `/login`, `/signup/child`, `/children`: 로그인과 아이 화면
- `/profile`, `/settings`, `/orders`, `/viewer/:activityId`: 내 정보·주문·뷰어
- 배지·리뷰·성장 리포트·쿠폰 등 기존 화면도 경로만 보존합니다.

UI 출처: 기존 `YIPPEE-CLUB/YIPPEE_CLUB_FE`의 main `36cdccd`.
