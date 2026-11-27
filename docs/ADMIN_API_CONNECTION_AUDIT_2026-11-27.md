# 관리자 콘솔 API 연결 전수 점검

> 후속 반영: 1절의 미리보기 조회/등록·교체/전체 삭제를 관리자 학습지 수정 화면에 연결했습니다. `ActivityPreviews.tsx`, `lib/previews.ts` 참고. 아래 미연결 설명은 감사 당시 기록입니다. 새 학습지는 기본 등록 후 수정 화면에서 이미지를 추가하며, 미리보기는 기본 정보 저장과 별도 실행입니다. 공개 GET은 비공개 상품에 404이므로 조회 제한을 안내하며 원본 PDF·표지를 대신 노출하지 않습니다. 파일 1~5장/각 5MB/PNG·JPEG·WEBP 검증, 선택 이미지 확인·순서 변경, 교체/삭제 확인, API 응답 결과 반영을 구현했습니다. 실제 공유 서버의 이미지 변경 테스트는 별도로 확인할 것.

기준: 2026-11-27 현재 FE apps/admin/src 전체, FE docs/BE_API_SPEC.md, 로컬 Spring BE main eeb46c6의 관리자 Controller를 대조. 현재 화면에 있는 기능 및 화면이 명시한 확장 항목을 대상으로 함. 임의의 미래 기능을 모두 구현 대상으로 확장한 목록은 아님. 배포 서버의 모든 API를 인증 호출하거나 실제 환불을 실행한 검증은 아님.

## 1. BE 계약/코드는 있는데 FE 미연결

| 기능 | API | 현재 빠진 부분 |
|---|---|---|
| 활동지 미리보기 이미지 등록·교체 | POST /api/v1/admin/activities/{id}/previews | 등록/수정 폼에 업로드 입력·순서·저장 호출 없음. previews 이미지 1~5개, 각 5MB 이하, 기존 전체 교체 계약 |
| 활동지 미리보기 삭제 | DELETE /api/v1/admin/activities/{id}/previews | 삭제 UI 및 호출 없음 |
| 기존 미리보기 조회 | GET /api/v1/activities/{id}/preview | 관리자 편집 화면에서 조회·표시하지 않음. 공개 조회 계약이므로 비공개 상품도 관리자에서 조회 가능한지는 추가 확인 필요 |

중요: Sections.tsx '확장 예정 항목'은 미리보기 별도 업로드 API가 없다고 적혀 있지만 현재 명세/BE 소스에는 위 API가 있음. 이 안내는 오래된 문구라 수정해야 함. 원본 PDF 등록·표지 업로드와 미리보기 이미지 업로드는 별개 기능.

## 2. 화면이 있으나 실제 API가 미연결인 메뉴

### 도전과제 인증 검수
- 인증 접수 목록/상세/사진 원본 조회.
- 발급 코드와 제출 계정·활동지 대조 결과.
- 사진 AI 판독 결과: 검출 코드, 작성 여부, 신뢰도.
- 중복 제출 검사 결과.
- 대기/AI 확인 필요/승인/반려 상태별 조회.
- 승인·반려 실행, 사유 저장, 담당자·처리 시각 기록.
- 모두 FutureModule의 안내용 표/탭이며 조회·처리 호출 없음. 탭도 실제 상태 필터가 아니라 span 표시.
- 현재 확인한 BE 계약에는 사진 인증 API가 없음. 기존 발급 상세 API가 있다고 사진 검수 API까지 연결된 것은 아님.

### 문의·프로모션
- 1:1 문의 목록/상세/답변/처리 상태.
- 리뷰 목록/관리/답변 등 운영 처리.
- 공지 목록/등록/수정/삭제/공개·노출 기간.
- 쿠폰 등록/지급/사용·만료 관리.
- 포인트 지급/차감/지급 정책 및 이력.
- 위 모듈의 담당자·접수일·상태 데이터.
- 모두 FutureModule이며 실제 데이터 호출 없음. 문의/리뷰/공지/쿠폰·포인트 탭은 화면 표시만 존재.

### 설정·연동 현황
- 연동 상태는 코드의 true/false 배열을 그린 정적 안내. 서버 상태 자동 점검/설정 조회가 아님.
- 정산 내역 조회/대사 기능 없음. 매출 차트와 결제사 정산은 다른 기능.
- 역할별 권한 조회/설정, 관리자 추가·해제 UI/API 없음. 현재 ADMIN_EMAILS 서버 설정으로 일반/관리자 구분.
- 운영 감사 로그 조회 및 승인·변경 이력 관리 없음.
- 화면의 앱 위치/로컬 주소/배포 정책도 정적 설명. 설정 저장 버튼이나 API는 없음.
- 이 영역은 현재 명세에 없는 추가 계약이 필요. Cloudflare Access는 외부 인프라 설정이며 관리자 업무 API 미연결과 구분.

## 3. 기존 연결 기능의 부분 미지원

### 학습지 관리
- 목록이 GET /activities(공개 목록)를 사용. 비공개 포함 관리자 전체 목록 API는 현재 확인되지 않음.
- 비공개 ID로 수정은 가능하지만 관리자 상세 GET으로 기존 값을 가져와 자동 채우는 흐름 없음. ID만 전달한 폼은 일부 입력 필드/파일 변경 방식.
- 난이도 FE는 하=easy/중=normal/상=hard 3단계. 확인한 BE 등록·수정·필터 검증과 DB CHECK는 easy/hard만 허용. **normal은 배포 API/DB 지원 전 미완성**. BE_DIFFICULTY_THREE_LEVELS.md 참고.
- 상품 자체의 수동 학습지 코드 입력/변경 기능 없음. PDF 자동 발급 코드와 다른 항목.
- 구독 상품 설정 없음. 기존 소장/7일권은 연결되어 있음.
- 페이지 수 저장/수정 없음.
- 정답지 별도 파일 등록 없음.
- PDF 스탬프 위치/적용 페이지/해시 설정 없음. 코드가 자동 인쇄되는 BE 기능은 존재하지만 관리자가 설정하는 API는 없음.
- 상품 삭제는 현재 UI/확인한 관리자 계약에 없음. 비공개 전환은 PATCH로 연결되어 있으므로 삭제 미연결과 구분.

### 카테고리
- 이름 등록과 전체 목록은 연결되어 있음.
- 카테고리 이름 수정/삭제 UI·호출 없음.
- 학년·연령 계층 트리 없음.
- 태그 편집/정렬 등 확장 관리 없음.
- 안정적인 관심사 code를 관리하는 UI 없음. 현재 생성은 name만 전송.
- 고객의 관심 놀이가 선택 안 되는 문제는 이 목록의 데이터 부족이 원인. 실제 서버 GET 결과는 ID 1/name 테스트 한 개였음. 카테고리 등록 API 자체가 미연결인 것이 아님. 관심사 마스터와 상품 카테고리를 동일하게 쓸지부터 합의 후 실제 항목을 등록해야 함.

### 회원 관리
- 이메일 정확 검색과 계정 정지·복구는 연결되어 있음.
- 전체 회원 목록·부분 검색·가입일/상태 필터 UI 없음. 현재 계약은 이메일 한 명 조회 중심.
- 보유 학습지·배지·탈퇴 이력 전용 조회 없음.
- 회원의 아이 정보/주문 내역 등을 한 화면에 묶은 관리자 상세 없음. 주문/발급 메뉴의 기존 조회와 구분.
- 계정 정지/복구의 '확인 메모'는 입력받지만 서버로 보내지 않음. 실제 전송은 is_active뿐. 감사 메모 저장 API가 필요.
- 회원 정보 수정·관리자 권한 부여/회수 UI 없음. 무조건 기존 회원 PATCH에 임의 필드를 넣지 말 것.

### PDF 발급·다운로드
- 목록/정확 코드 검색/회원 ID·활동지 ID 필터/상세/최근 다운로드 이력은 연결.
- 재발급/코드 무효화, 이용 기한·횟수 수동 변경은 미지원.
- 부분 코드 검색은 미연결 버그가 아니라 현재 BE 계약상 정확 일치만 지원.
- 상세 다운로드 로그는 최근 최대 100건. 전체 이력 페이지 조회 API/UI는 현재 계약에 없음.
- 관리자 표는 서버 download_count를 그대로 표시. '저장 버튼 클릭 횟수' 이벤트와 분리된 지표는 없음. 파일 GET/열람 집계이고 FE Blob 재사용으로 중복 전송을 수정한 상태.

### 주문·환불·매출
- 주문 목록/상태 필터/페이지/상세, 결제사 재조회, 전액 환불, 환불 요청 목록/승인/반려는 연결.
- 부분 환불 UI/계약 없음. 현재 refund API는 전액 환불.
- 주문 목록 UI에는 날짜 범위·회원별·PG번호 검색/CSV 내보내기가 없음. 추가 요청 시 BE 필터 지원 여부부터 확인. 현재 화면이 약속한 핵심 기능 미연결과 구분.
- processing 상태는 statusLabel에는 있으나 주문 목록 상태 선택지에 없음. '전체'에서 조회될 수 있으므로 데이터 미연결로 분류하지 않고 UI 필터 누락으로 분류.
- 일/월/년 매출은 실제 sales API 연결. 정산·수수료·부가세·실입금 지표와 CSV는 현재 화면/계약 범위 밖.
- 유료 결제/환불 매출 반영의 실서버 E2E 검증은 별도 필요. 연결 코드 존재가 실결제 검증 완료를 뜻하지 않음.

## 4. 이미 연결된 범위(중복 요청 방지)

- 로그인 POST /auth/login, 프로필 GET /users/me, 토큰 갱신/로그아웃, 관리자 API 권한 검사.
- 대시보드 GET /admin/sales, 주문/환불 대기 건수, 공개 상품 수, 최근 주문.
- GET /activities, GET /activity-categories.
- POST /admin/categories.
- POST /admin/activities, PATCH /admin/activities/{id}, POST /admin/activities/{id}/files.
- GET /admin/orders, GET /admin/orders/{id}, POST /admin/orders/{id}/reconcile, POST /admin/orders/{id}/refund.
- GET /admin/orders/refund-requests, POST /admin/orders/refund-requests/{id}/approve, POST /admin/orders/refund-requests/{id}/reject.
- GET /admin/users?email=, PATCH /admin/users/{id} (is_active).
- GET /admin/worksheet-issuances, GET /admin/worksheet-issuances/{id}.

위 경로는 별도 표기가 없으면 /api/v1 기준. 연결 목록에는 현재 확인한 UI 호출을 적었으며 매 호출의 성공을 보장하지 않음.

## 5. 착수 우선순위

1. BE에 이미 있는 previews 등록/삭제를 관리자 화면에 연결하고 오래된 안내 수정.
2. normal API/DB 지원, 관리자 비공개 포함 목록/상세 계약.
3. 관심 놀이 마스터 데이터/카테고리 정책 확정 후 데이터 등록. 임의 ID를 FE에서 생성하지 않기.
4. 운영상 먼저 쓸 문의/공지/리뷰와 사진 인증의 API 계약 구체화.
5. 정지 메모/감사 로그·권한 관리 계약.
6. 운영 필요에 따라 정산/쿠폰·포인트/발급 수동 조치 확장. 위험한 권한 변경은 서버 감사 및 접근 제어와 함께 설계.

## 6. 근거 파일

- apps/admin/src/components/AdminConsole.tsx: 메뉴, 인증, 화면 분기.
- apps/admin/src/components/Sections.tsx: Dashboard / Products / ProductEditor / Categories / Orders / Refunds / Members / Downloads / FutureModule / Settings.
- apps/admin/src/components/Issuances.tsx, RevenueDashboard.tsx: 발급/매출 실제 조회.
- apps/admin/src/lib/admin.ts, reporting.ts, api.ts: 요청 경로와 타입·세션.
- docs/BE_API_SPEC.md 10장: 관리자 지원 API.
- BE src/main/java/club/yippee/api/catalog/AdminController.java: previews POST/DELETE 포함.
- BE src/main/java/club/yippee/api/catalog/CatalogController.java: 공개 preview 조회 및 난이도 필터.
- BE src/main/resources/db/migration/V1__init.sql: easy/hard CHECK.

이 보고서는 작성 시점의 소스 감사 결과입니다. 배포본에 별도 변경이 있다면 최신 명세와 실서버 읽기 검증으로 갱신해야 합니다. 이번 점검에서 환불·정지·생성 같은 서버 데이터 변경은 하지 않았습니다.
