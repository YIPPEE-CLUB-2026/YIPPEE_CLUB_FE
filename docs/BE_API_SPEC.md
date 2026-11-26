# YIPPEE CLUB 백엔드 API 명세 (Spring)

- 기준: 2026-11-24의 서버 코드. 요청·응답 형식은 코드에서 직접 옮겼습니다. 로그인 없이 볼 수 있는 응답 28가지는 개발 서버에
  실제로 요청해 이 문서와 대조했고, 로그인이 필요한 흐름은 서버의 자동 테스트가 확인하는 동작을 적은 것입니다.
- **2026-11-25에 바뀐 것**: 소셜 로그인(3.10) 추가, 활동지 등록의 `price` 필수(10.1), 결제 승인·주문 생성 횟수 제한(1.5).
  소셜 로그인은 실제 카카오·네이버·구글에 붙여 확인한 것이 아니라 각 공급자 문서대로 만든 것입니다.
- **그 뒤 2026-11-25에 더 바뀐 것**: 받는 PDF에 회원별 고유코드 인쇄(9.2, 9.3), 다운로드 응답에 `issuance_code` 추가와
  `file_name` 변경(9.2), 매출 집계(10.5), 발급 코드 조회(10.6). 9.3의 **인쇄 위치·적용 페이지·코드 유지 규칙은 협의 전의 기본값**입니다.
- JSON 예시의 값(id, 이름, 금액, 시각)은 설명용입니다.
- 직접 눌러 보려면 개발 서버의 Swagger 화면(`/swagger-ui/index.html`)을 씁니다. 로그인 응답의 `access_token`을 Authorize에 넣으면
  로그인이 필요한 API도 부를 수 있습니다(5분 뒤 만료). 그 화면에는 본문의 필드가 나오지 않으니 이 문서를 함께 봅니다.
- 기존 팀 명세 `API_SPEC_v1.5`의 번호를 각 API 옆에 `v1.5 #번호`로 적었습니다. 번호가 없는 것은 이 서버에서 새로 생긴 API입니다.
- **이 문서에 없는 v1.5의 API는 구현되어 있지 않습니다**(예: Apple 로그인, 프로필 사진 18~19, 홈 26, 검색어 29~35,
  추천 36, 저장 카드 55~58, 쿠폰·캐시 59 이후). 호출하면 404이고, 토큰 없이 부르면 주소에 따라 401일 수 있습니다(1.2).

## 목차

1. [공통 규칙](#1-공통-규칙)
2. [전체 API 목록](#2-전체-api-목록)
3. [인증](#3-인증)
4. [내 프로필](#4-내-프로필)
5. [아이](#5-아이)
6. [활동지](#6-활동지)
7. [찜과 장바구니](#7-찜과-장바구니)
8. [주문과 결제](#8-주문과-결제)
9. [구매한 활동지와 다운로드](#9-구매한-활동지와-다운로드)
10. [관리자](#10-관리자)
11. [화면 흐름별 호출 순서](#11-화면-흐름별-호출-순서)

---

## 1. 공통 규칙

### 1.1 주소

모든 주소는 `/api/v1`로 시작합니다. 서버 주소는 `https://api.yippeclub.com`입니다(DNS 등록 후 열림). 그 전까지 쓰는 개발 서버의
HTTP 주소는 팀 안에서 따로 공유합니다. 브라우저에서 호출할 수 있는 프론트 origin은 `https://www.yippeclub.com`,
`https://yippeclub.com`, `http://localhost:3000`, `http://127.0.0.1:3000`입니다.

### 1.2 인증

로그인이 필요한 API는 헤더에 Access 토큰을 넣습니다.

```
Authorization: Bearer <access_token>
```

| 토큰 | 수명(기본값) | 설명 |
|---|---|---|
| `access_token` | 5분 | JWT. 만료되면 401. |
| `refresh_token` | 24시간 | 임의 문자열(JWT 아님). 그대로 저장했다가 갱신·로그아웃에 보냅니다. 갱신해도 바뀌지 않습니다. |

- 비밀번호를 변경하거나 재설정하면 그 사용자의 **모든 토큰이 즉시 무효**가 됩니다(다시 로그인).
- 관리자가 계정을 정지하면 다음 요청부터 401입니다.
- 토큰 없이 호출할 수 있는 API: 상태 확인, `/auth/*`, 카테고리, 활동지 목록·상세·파일, 결제 웹훅. 나머지는 모두 토큰이 필요합니다.
- 토큰이 없는 요청이 **없는 주소**로 가면 대부분 404가 아니라 401입니다. `/auth/` 아래와 `/activities/` 아래의 없는 주소만
  토큰 없이도 404입니다(예: `/auth/social/apple`, `/activities/popular`).

### 1.3 요청 형식

- 본문은 JSON(`Content-Type: application/json`), 최대 64KB입니다. 넘으면 413.
- **타입을 바꿔 읽지 않습니다.** 정수 자리에 `"1"`, `1.0`, `true`를 보내면 400입니다. 문자열 자리에 숫자를 보내도 400입니다.
- **정의되지 않은 필드를 보내면 400입니다.** 예외는 `identifiers/check`, `verification/send`, `verification/confirm` 세 곳으로, 모르는 필드를 무시합니다.
- "보내지 않음"과 `null`은 다릅니다. 수정 API에서 보내지 않은 필드는 그대로 두고, `null`은 각 API에 적힌 대로 처리합니다.
- 이름·사유 같은 글자 필드는 앞뒤 공백을 떼고 길이를 셉니다. 이메일은 공백을 떼고 소문자로 바꿔 저장합니다(최대 254자).
  **비밀번호와 토큰은 손대지 않고 보낸 그대로 씁니다.**
- 쿼리 문자열: 결제 내역, 구매한 활동지, 찜 목록, 관리자 목록은 정의되지 않은 쿼리가 있으면 400입니다. 활동지 목록(`/activities`)은 모르는 쿼리를 무시합니다.
- 금액은 원 단위 정수입니다. 날짜는 `YYYY-MM-DD`입니다.
- 시각은 UTC의 ISO 8601 문자열이고 `Z`로 끝납니다(`2026-11-24T08:41:43.378Z`). 초 아래 자릿수는 0~6자리로 달라질 수 있으니 표준 날짜 파서로 읽습니다.
- 목록의 페이지: `page`(기본 1), `page_size`(기본 20, 최대 100).

### 1.4 오류 형식

모든 오류는 같은 모양입니다.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "요청값을 확인해 주세요.",
  "details": { "email": ["요청값을 확인해 주세요."] },
  "request_id": "req_3f2a9c0d4b7e4c1f9a6d2b8e5c7f1a03"
}
```

- `details`는 문제가 된 필드 이름을 키로 갖습니다. 필드와 무관한 오류는 `{}`입니다. 보낸 값은 되돌려 주지 않습니다.
- 본문이 JSON 객체가 아니면 `details.non_field_errors`가 옵니다.
- `request_id`는 응답 헤더 `X-Request-Id`와 같은 값이고, 서버 로그에서 그 요청을 찾는 데 씁니다. 문의할 때 함께 알려 주세요.

| 상태 | `code` | 뜻 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 요청값이 잘못됨 |
| 401 | `AUTHENTICATION_REQUIRED` | 토큰이 없거나 만료·무효 |
| 403 | `PERMISSION_DENIED` | 권한 없음(구매하지 않은 활동지, 관리자 전용) |
| 403 | `ACCESS_EXPIRED` | 7일 이용권의 기간이 끝남 |
| 404 | `NOT_FOUND` | 없거나, 내 것이 아니거나, 비공개 |
| 409 | `INVALID_STATE` | 지금 상태에서는 할 수 없음 |
| 409 | `ALREADY_EXISTS` | 이미 가입한 이메일 |
| 409 | `ALREADY_PURCHASED` | 이미 구매한 활동지 |
| 413 | `VALIDATION_ERROR` | 본문이 너무 큼 |
| 429 | `RATE_LIMITED` | 요청이 너무 잦음. 잠시 후 다시 |
| 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |
| 503 | `SERVICE_UNAVAILABLE` | 외부 서비스(메일, 결제사) 지연. **결제 승인에서는 "실패"가 아니라 "확인 중"** |

### 1.5 요청 횟수 제한

| 대상 | 한도(기본값) |
|---|---|
| 인증 API(가입 여부 확인, 인증번호 발송·검증, 가입, 로그인, 비밀번호 재설정·변경) | API마다 같은 IP에서 10분에 30번 |
| 같은 이메일에 대한 요청(위 API 중 이메일을 받는 것) | API마다 10분에 10번. 로그인은 "IP + 이메일" 단위 |
| 인증번호 재발송 | 같은 이메일로 60초에 1번 |
| 인증번호 입력 | 한 번 발송된 번호에 5번까지 |
| 다운로드 링크 발급 | 한 계정이 한 활동지에 1시간에 10번 |
| 소셜 로그인 | 같은 IP에서 10분에 30번 |
| 결제 승인 | 한 계정이 10분에 20번 |
| 주문 생성 | 한 계정이 10분에 30번 |

토큰 갱신과 로그아웃에는 횟수 제한이 없습니다. 넘으면 429입니다.

---

## 2. 전체 API 목록

인증 칸: 없음 = 토큰 불필요, 필요 = Access 토큰, 관리자 = 관리자 계정의 Access 토큰.

| v1.5 | 메서드 | 주소 | 인증 | 설명 |
|---|---|---|---|---|
| | GET | `/health/` | 없음 | 서버 프로세스 확인 |
| | GET | `/health/ready` | 없음 | DB까지 확인(로드밸런서용) |
| 01 | POST | `/auth/identifiers/check` | 없음 | 이메일 가입 여부 |
| 02 | POST | `/auth/verification/send` | 없음 | 가입용 인증번호 발송 |
| 05 | POST | `/auth/verification/confirm` | 없음 | 인증번호 검증 |
| 06 | POST | `/auth/signup` | 없음 | 회원가입 |
| 07 | POST | `/auth/login` | 없음 | 로그인 |
| 08 | POST | `/auth/social/{provider}` | 없음 | 카카오·네이버·구글 로그인 |
| 09 | POST | `/auth/token/refresh` | 없음 | Access 토큰 갱신 |
| 10 | POST | `/auth/logout` | 없음 | 로그아웃 |
| 11 | POST | `/auth/password/reset-request` | 없음 | 비밀번호 재설정 메일 |
| 12 | POST | `/auth/password/reset-confirm` | 없음 | 새 비밀번호 설정 |
| 13 | PATCH | `/users/me/password` | 필요 | 비밀번호 변경 |
| 16 | GET | `/users/me` | 필요 | 내 프로필 |
| 17 | PATCH | `/users/me` | 필요 | 프로필 수정 |
| 15 | DELETE | `/users/me` | 필요 | 회원 탈퇴 |
| 20 | GET | `/children` | 필요 | 아이 목록 |
| 21 | POST | `/children` | 필요 | 아이 등록 |
| 22 | GET | `/children/{child_id}` | 필요 | 아이 상세 |
| 23 | PATCH | `/children/{child_id}` | 필요 | 아이 수정 |
| 24 | DELETE | `/children/{child_id}` | 필요 | 아이 삭제 |
| 25 | PUT | `/users/me/active-child` | 필요 | 선택한 아이 변경 |
| 37 | GET | `/activity-categories` | 없음 | 카테고리 목록 |
| 27 | GET | `/activities` | 없음 | 활동지 목록·검색 |
| 28 | GET | `/activities/{activity_id}` | 없음 | 활동지 상세 |
| 38 | GET | `/activities/{activity_id}/preview` | 없음 | 구매 전 미리보기(샘플 이미지 주소) |
| | GET | `/activities/{activity_id}/files/image`, `.../files/pdf` | 없음 | 표지·PDF 파일 |
| 41 | GET | `/favorites` | 필요 | 찜 목록 |
| 42 | POST | `/favorites` | 필요 | 찜 추가 |
| 43 | DELETE | `/favorites/{activity_id}` | 필요 | 찜 해제 |
| 44 | GET | `/cart` | 필요 | 장바구니 |
| 45 | POST | `/cart/items` | 필요 | 장바구니 담기 |
| 46 | DELETE | `/cart/items/{activity_id}` | 필요 | 장바구니에서 삭제 |
| 47 | POST | `/orders/quote` | 필요 | 결제 예상 금액 |
| 48 | POST | `/orders` | 필요 | 주문 생성 |
| 49 | POST | `/payments/confirm` | 필요 | 결제 승인 |
| 50 | POST | `/payments/webhook` | 없음 | 결제사 웹훅(프론트는 호출하지 않음) |
| 51 | GET | `/orders` | 필요 | 결제 내역 |
| 52 | GET | `/orders/{order_id}` | 필요 | 주문 상세 |
| 53 | GET | `/orders/{order_id}/receipt` | 필요 | 영수증 |
| 54 | POST | `/orders/{order_id}/cancel` | 필요 | 결제 전 취소 / 결제 후 환불 요청 |
| 39 | GET | `/purchases/activities` | 필요 | 구매한 활동지 |
| 40 | POST | `/activities/{activity_id}/download` | 필요 | 다운로드 링크 발급 |
| | | `/admin/*` | 관리자 | [10장](#10-관리자) |

---

## 3. 인증

### 가입 순서

`verification/send` → (메일의 6자리 번호) → `verification/confirm` → `signup`.

### 3.1 이메일 가입 여부 확인 `v1.5 #01`

`POST /auth/identifiers/check`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `identifier` | string | O | 이메일 |

```json
{ "registered": false, "identifier_type": "email" }
```

오류: 400, 429.

### 3.2 인증번호 발송 `v1.5 #02`

`POST /auth/verification/send`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `identifier` | string | O | 이메일 |
| `purpose` | string | O | `"signup"`만 가능 |

```json
{ "verification_id": "ver_5c1e0f7a9b2d4c3e8f6a1b0d", "expires_in_seconds": 180 }
```

| 오류 | 경우 |
|---|---|
| 400 | 이메일 형식이 아니거나 `purpose`가 다름 |
| 409 `ALREADY_EXISTS` | 이미 가입한 이메일 |
| 429 | 같은 이메일로 60초 안에 다시 요청했거나 횟수 한도 초과 |
| 503 | 메일 발송 실패. **60초 뒤에** 다시 요청합니다(실패한 요청도 60초 제한에 들어가서, 바로 다시 보내면 429) |

### 3.3 인증번호 검증 `v1.5 #05`

`POST /auth/verification/confirm`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `verification_id` | string | O | 발송 응답의 값 |
| `code` | string | O | 숫자 6자리. **문자열**로 보냅니다 |

```json
{ "verification_token": "k3J9...(임의 문자열)", "verified": true }
```

`verification_token`은 10분 동안 가입에 한 번 쓸 수 있습니다.

| 오류 | 경우 |
|---|---|
| 400 | 번호가 틀림 / 만료됨(3분) / `verification_id`가 없음. `message`에 사유가 옵니다 |
| 409 `INVALID_STATE` | 이미 검증을 마친 요청 |
| 429 | 5번 틀림. 새로 발송해야 합니다 |

### 3.4 회원가입 `v1.5 #06`

`POST /auth/signup`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `identifier` | string | O | 인증한 이메일 |
| `verification_token` | string | O | 검증 응답의 값 |
| `password` | string | O | 아래 비밀번호 규칙 |
| `agreements` | object | O | 약관 동의. 예: `{"terms": true, "privacy": true, "marketing": false}`. JSON으로 4,000자 이내. 서버가 필수로 정한 키는 `true`여야 합니다 |

응답 `201`:

```json
{ "user_id": 12, "access_token": "eyJ...", "refresh_token": "Zq8..." }
```

**비밀번호 규칙** (가입, 변경, 재설정 공통)

- 영문과 숫자를 포함해 8자 이상, 72바이트 이하
- 흔한 비밀번호 목록에 없을 것
- 이메일과 비슷하지 않을 것

어기면 400이고 `details.password`(변경·재설정에서는 `details.new_password`)에 사유 문구가 옵니다. 예: `"너무 흔한 비밀번호입니다."`

| 오류 | 경우 |
|---|---|
| 400 | 필드 오류, 비밀번호 규칙 위반, 인증을 마치지 않았거나 토큰 만료("이메일 인증을 완료해 주세요.") |
| 409 `INVALID_STATE` | 이미 사용한 인증 토큰 |
| 409 `ALREADY_EXISTS` | 이미 가입한 이메일 |

### 3.5 로그인 `v1.5 #07`

`POST /auth/login`

| 필드 | 타입 | 필수 |
|---|---|---|
| `email` | string | O |
| `password` | string | O |

```json
{
  "access_token": "eyJ...",
  "refresh_token": "Zq8...",
  "user": { "id": 12, "email": "parent@example.com", "phone": null, "name": null, "nickname": null }
}
```

오류: 400(비밀번호가 틀림, 없는 이메일, 정지된 계정 모두 같은 응답 "이메일 또는 비밀번호를 확인해 주세요."), 429.

### 3.6 토큰 갱신 `v1.5 #09`

`POST /auth/token/refresh`

| 필드 | 타입 | 필수 |
|---|---|---|
| `refresh_token` | string | O |

```json
{ "access_token": "eyJ...(새 토큰)", "refresh_token": "Zq8...(보낸 것과 같음)" }
```

오류: 400("토큰을 확인해 주세요." 만료, 로그아웃됨, 모르는 토큰). 이 경우 다시 로그인해야 합니다.

### 3.7 로그아웃 `v1.5 #10`

`POST /auth/logout`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `refresh_token` | string | X | 끝낼 세션의 토큰. 생략하거나 `null`이어도 성공합니다 |

```json
{ "message": "처리되었습니다." }
```

만료됐거나 모르는 토큰을 보내도 200입니다. 프론트는 응답과 상관없이 저장한 토큰을 지우면 됩니다.

### 3.8 비밀번호 재설정 메일 `v1.5 #11`

`POST /auth/password/reset-request`

| 필드 | 타입 | 필수 |
|---|---|---|
| `email` | string | O |

```json
{ "message": "처리되었습니다." }
```

가입 여부와 상관없이 같은 응답입니다. 메일의 링크는 `<프론트 재설정 페이지 주소>#reset_token=<토큰>` 꼴이고 10분 동안 유효합니다.
토큰은 주소의 `#` 뒤에 있으므로 프론트가 `location.hash`에서 읽습니다.

오류: 400, 429. 서버에 프론트 재설정 페이지 주소(`PASSWORD_RESET_FRONTEND_URL`, `https://`로 시작)가 설정돼 있지 않으면
누가 요청하든 500("비밀번호 재설정 메일 설정을 확인해 주세요.")입니다. 개발 서버는 아직 이 값이 비어 있습니다.

### 3.9 새 비밀번호 설정 `v1.5 #12`

`POST /auth/password/reset-confirm`

| 필드 | 타입 | 필수 |
|---|---|---|
| `reset_token` | string | O |
| `new_password` | string | O |

```json
{ "message": "처리되었습니다." }
```

오류: 400("재설정 토큰을 확인해 주세요." 또는 `details.new_password`에 규칙 위반 사유), 429.
성공하면 그 사용자의 모든 세션이 끝나고, 같은 링크는 다시 쓸 수 없습니다.

---

### 3.10 소셜 로그인 `v1.5 #08`

`POST /auth/social/{provider}` — `provider`는 `kakao`, `naver`, `google`. 서버에 그 공급자의 키가 설정돼 있지 않으면 404입니다.
(v1.5의 Apple은 없습니다.)

프론트가 할 일: 사용자를 공급자 로그인 화면으로 보내고, Redirect URI로 돌아온 `code`를 받아 이 API에 넘깁니다. 공급자의
토큰은 프론트가 받지 않습니다. 구글은 인가 요청의 scope에 `openid email`이 있어야 이메일이 오고, `profile`까지 있어야 이름이 옵니다.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `authorization_code` | string | O | 공급자가 돌려준 `code`. 한 번만 쓸 수 있습니다 |
| `redirect_uri` | string | 카카오·구글 O, 네이버 X | 인가 요청에 쓴 Redirect URI와 **똑같은 값**. 구글 팝업 방식이면 페이지의 origin |
| `state` | string | 네이버 O, 그 외 X | 네이버 인가 요청에 쓴 `state` |
| `agreements` | object | 첫 로그인 때 O | 회원가입(3.4)과 같은 동의 객체. 이미 계정이 있으면 없어도 됩니다 |

```json
{
  "access_token": "eyJ...",
  "refresh_token": "Zq8...",
  "is_new_user": true,
  "user": { "id": 12, "email": "parent@example.com", "phone": "", "name": "", "nickname": "" }
}
```

| 응답 | 뜻 | 프론트가 할 일 |
|---|---|---|
| 201 | 계정이 방금 만들어짐(`is_new_user: true`) | 가입 후 화면(아이 등록 등) |
| 200 | 기존 계정으로 로그인(`is_new_user: false`) | |
| 400 | 공급자가 코드를 받아 주지 않음(만료, 이미 씀, `redirect_uri` 불일치) 또는 필드 오류(`details`) | 공급자 로그인부터 다시 |
| 409 `AGREEMENTS_REQUIRED` | 새 계정인데 필수 약관 동의가 없음 | 약관 동의를 받고 **공급자 로그인부터 다시**(코드는 이미 쓰였습니다) |
| 409 `EMAIL_REQUIRED` | 공급자가 쓸 수 있는 이메일을 주지 않음 | "이메일 제공에 동의해 주세요" 안내 후 다시 |
| 409 `ALREADY_EXISTS` | 그 이메일로 가입한 계정이 있고, 공급자가 이메일을 보증하지 않음(네이버는 항상 해당) | "이메일과 비밀번호로 로그인" 안내 |
| 403 `PERMISSION_DENIED` | 정지된 계정, 또는 소셜 로그인을 쓸 수 없는 계정 | `message` 표시 |
| 404 | 지원하지 않거나 켜지 않은 공급자 | |
| 429 | 같은 IP에서 10분에 30번 초과 | |
| 503 | 공급자 응답 지연이나 서버 설정 문제 | 잠시 후 다시(공급자 로그인부터) |

- `AGREEMENTS_REQUIRED`를 피하려면 소셜 버튼을 누르기 전에 약관 동의를 받아 두고 항상 `agreements`를 보냅니다.
- 이메일을 공급자가 보증하는 경우(카카오의 인증된 이메일, 구글의 gmail.com·구글 운영 도메인)에는 같은 이메일로 이미
  가입한 계정에 자동으로 연결되어 200이 옵니다.
- 계정의 `name`이 비어 있으면 공급자가 준 이름(구글 `name`, 카카오 프로필 닉네임, 네이버 `name`)으로 채웁니다. 이미 있는
  이름은 바꾸지 않고, 100자를 넘는 이름은 쓰지 않습니다. 사용자는 프로필 수정(4.2)으로 바꿀 수 있습니다.
- 소셜로 만든 계정은 이메일·비밀번호 로그인이 안 됩니다. 비밀번호 재설정(3.8)을 하면 그때부터 됩니다. 네이버처럼
  보증되지 않은 이메일로 만든 계정은 비밀번호를 재설정하면 그 소셜 로그인이 끊깁니다(이후 409 `ALREADY_EXISTS`).

---

## 4. 내 프로필

### 4.1 프로필 조회 `v1.5 #16`

`GET /users/me`

```json
{ "id": 12, "email": "parent@example.com", "phone": null, "name": "홍길동", "nickname": "길동맘", "active_child_id": 3 }
```

### 4.2 프로필 수정 `v1.5 #17`

`PATCH /users/me`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `name` | string \| null | X | 100자 이내. `null`이나 `""`이면 비웁니다 |
| `nickname` | string \| null | X | 50자 이내. `null`이나 `""`이면 비웁니다 |

응답은 `id`, `email`, `phone`, `name`, `nickname` 다섯 개입니다(`active_child_id`는 없음).
비운 값은 `null`이 아니라 `""`로 돌아옵니다. 한 번도 넣지 않은 값은 `null`입니다.

### 4.3 비밀번호 변경 `v1.5 #13`

`PATCH /users/me/password`

| 필드 | 타입 | 필수 |
|---|---|---|
| `current_password` | string | O |
| `new_password` | string | O |

```json
{ "message": "처리되었습니다." }
```

오류: 400("현재 비밀번호를 확인해 주세요." 또는 `details.new_password`), 429.
**성공하면 지금 쓰던 토큰도 무효가 됩니다.** 새 비밀번호로 다시 로그인해야 합니다.

### 4.4 회원 탈퇴 `v1.5 #15`

`DELETE /users/me` — 본문 없음.

```json
{ "message": "처리되었습니다." }
```

- 성공하면 그 계정의 모든 토큰이 즉시 무효입니다. 프론트는 저장한 토큰을 지우고 로그인 전 화면으로 보냅니다.
- 아이 정보, 찜, 장바구니, 소셜 로그인 연결은 바로 삭제됩니다. 구매 내역은 이어지지 않으며 **되돌릴 수 없습니다.**
- 같은 이메일이나 같은 소셜 계정으로 바로 다시 가입할 수 있습니다(새 계정).

| 오류 | 경우 | 화면 |
|---|---|---|
| 409 `INVALID_STATE` | 결제 승인이 진행 중이거나, 결정되지 않은 환불 요청이 있음 | `message` 표시("진행 중인 결제나 환불 요청이 끝난 뒤에…") |
| 409 `INVALID_STATE` | 관리자 계정 | `message` 표시 |
| 401 | 토큰 없음·만료 | |

---

## 5. 아이

아이 객체:

```json
{ "id": 3, "name": "서아", "birth_date": "2022-05-14", "gender": "female", "interests": [1, 4] }
```

- `gender`: 20자 이내의 자유 문자열. 없으면 `""`.
- `interests`: 카테고리 id 배열(오름차순). 없으면 `[]`.
- 등록할 수 있는 아이 수에는 제한이 없습니다.

| v1.5 | 메서드·주소 | 본문 | 응답 |
|---|---|---|---|
| 20 | `GET /children` | | `{ "results": [아이, ...] }` (등록 순) |
| 21 | `POST /children` | 아래 표 | `201` 아이 |
| 22 | `GET /children/{child_id}` | | 아이 |
| 23 | `PATCH /children/{child_id}` | 아래 표의 일부 | 아이 |
| 24 | `DELETE /children/{child_id}` | | `204` 본문 없음 |
| 25 | `PUT /users/me/active-child` | `{ "child_id": 3 }` | `{ "active_child_id": 3 }` |

| 필드 | 타입 | 등록 | 수정 | 설명 |
|---|---|---|---|---|
| `name` | string | 필수 | 선택 | 1~100자. `null` 불가 |
| `birth_date` | string | 필수 | 선택 | `YYYY-MM-DD`. 한국 날짜 기준으로 미래일 수 없음. `null` 불가 |
| `gender` | string \| null | 선택 | 선택 | 20자 이내. `null`이면 `""` |
| `interests` | number[] \| null | 선택 | 선택 | 서로 다른 카테고리 id. 없는 id가 있으면 400. `null`이면 `[]` |

- 남의 아이나 없는 아이는 404입니다. 단, `active-child`는 400(`details.child_id`)입니다.
- 선택된 아이를 삭제하면 `active_child_id`가 `null`이 됩니다.

---

## 6. 활동지

활동지 객체(15개 필드):

```json
{
  "id": 7,
  "title": "숲속 모양 찾기",
  "price": 1900,
  "rental_price": 700,
  "rental_days": 7,
  "sale_status": "on_sale",
  "description": "숲에서 볼 수 있는 모양을 찾아보는 활동지입니다.",
  "age_min_months": 36,
  "age_max_months": 59,
  "difficulty": "easy",
  "duration_min": 10,
  "duration_max": 20,
  "categories": [1, 4],
  "image": "https://<서버>/api/v1/activities/7/files/image?v=1795510903",
  "pdf": "https://<서버>/api/v1/activities/7/files/pdf"
}
```

| 필드 | 설명 |
|---|---|
| `price` | 영구 소장 가격(원). 0이면 무료 |
| `rental_price` | 7일 이용권 가격. **`null`이면 7일 이용권을 팔지 않는 활동지** |
| `rental_days` | 이용권 기간. 항상 7 |
| `sale_status` | 항상 `"on_sale"` |
| `difficulty` | `"easy"` 또는 `"hard"` |
| `duration_min`, `duration_max` | 소요 시간(분) |
| `image` | 표지 주소. 파일이 바뀌면 `?v=` 값이 바뀝니다. 브라우저가 하루 동안 보관합니다 |
| `pdf` | PDF 주소. **유료 활동지는 이 주소를 그대로 열면 404입니다.** [9.2](#92-다운로드-링크-발급-v15-40)의 링크를 써야 합니다 |

### 6.1 카테고리 목록 `v1.5 #37`

`GET /activity-categories`

```json
{ "results": [ { "id": 1, "name": "자연탐구" }, { "id": 2, "name": "신체운동" } ] }
```

### 6.2 활동지 목록·검색 `v1.5 #27`

`GET /activities`

| 쿼리 | 형식 | 설명 |
|---|---|---|
| `q` | 1~255자 | 제목·설명에서 찾기(대소문자 구분 없음) |
| `category` | 정수 | 카테고리 id |
| `age_years` | 정수 | 만 나이. 그 나이의 개월 범위와 권장 개월이 겹치는 활동지 |
| `duration` | `최소-최대` | 분. 예: `10-20` |
| `difficulty` | `easy` \| `hard` | |
| `price_min`, `price_max` | 정수 | 영구 소장 가격 기준 |
| `sort` | `latest`(기본) \| `oldest` \| `title` \| `price_asc` \| `price_desc` | |
| `page`, `page_size` | 정수 | 기본 1, 20. `page_size`는 최대 100 |

```json
{
  "count": 42,
  "next": "https://<서버>/api/v1/activities?page=2",
  "previous": null,
  "results": [ 활동지, ... ]
}
```

- 공개된 활동지만 나옵니다.
- 값이 형식에 맞지 않으면 400(`details`에 쿼리 이름). 2쪽 이상에서 결과가 없으면 404.

### 6.3 활동지 상세 `v1.5 #28`

`GET /activities/{activity_id}` → 활동지. 없거나 비공개면 404.

### 6.4 파일

`GET /activities/{activity_id}/files/image` — 표지. 공개 활동지면 누구나.

`GET /activities/{activity_id}/files/pdf` — PDF.

| 활동지 | 결과 |
|---|---|
| 무료이고 공개 | 누구나 받을 수 있음 |
| 유료 | `?token=...`이 붙은 다운로드 링크로만 받을 수 있음. 없으면 404 |

PDF는 첨부 파일로 내려오고 브라우저에 보관되지 않습니다. 다운로드 링크로 받은 PDF에는 그 회원의 고유코드가 인쇄되어 있고
파일 이름도 그 코드입니다([9.3](#93-pdf-고유코드)). 링크 없이 받는 무료 PDF는 코드가 없는 원본(`activity-{id}.pdf`)입니다.

### 6.5 구매 전 미리보기 `v1.5 #38`

`GET /activities/{id}/preview` — 로그인 없이 호출합니다. 관리자가 올려 둔 샘플 이미지의 주소를 순서대로 줍니다.

```json
{ "preview_urls": ["https://.../api/v1/activities/31/previews/1?v=1795600000", "https://.../api/v1/activities/31/previews/2?v=1795600000"] }
```

- 샘플이 없으면 `preview_urls`는 빈 배열입니다. 최대 5장이고 PNG·JPEG·WEBP 이미지입니다.
- 주소는 그대로 `<img src>`에 넣으면 됩니다. 샘플이 바뀌면 `?v=` 값이 바뀌므로 브라우저 캐시를 신경 쓸 필요가 없습니다.
- 공개되지 않았거나 없는 활동지는 404입니다.

---

## 7. 찜과 장바구니

| v1.5 | 메서드·주소 | 본문 | 응답 |
|---|---|---|---|
| 41 | `GET /favorites?page=&page_size=` | | `{ "results": [활동지, ...] }` 최근에 담은 순 |
| 42 | `POST /favorites` | `{ "activity_id": 7 }` | `201` `{ "activity_id": 7, "message": "처리되었습니다." }` |
| 43 | `DELETE /favorites/{activity_id}` | | `204` |
| 44 | `GET /cart` | | `{ "items": [활동지, ...], "total_amount": 3800 }` |
| 45 | `POST /cart/items` | `{ "activity_id": 7 }` | `201` `{ "activity_id": 7, "message": "처리되었습니다." }` |
| 46 | `DELETE /cart/items/{activity_id}` | | `204` |

- 목록에는 공개된 활동지만 나옵니다. 비공개가 된 것은 목록에서 빠지지만 삭제는 할 수 있습니다.
- 찜 목록은 끝을 넘은 쪽을 요청하면 빈 배열입니다. `count`는 없습니다.
- 장바구니의 `total_amount`는 **영구 소장 가격**의 합입니다. 7일 이용권으로 살 때의 금액은 [8.1](#81-결제-예상-금액-v15-47)로 계산합니다.
- `GET /cart`에 쿼리를 붙이면 400입니다.

| 오류 | 경우 |
|---|---|
| 400 `details.activity_id` | 없거나 비공개인 활동지 |
| 409 `INVALID_STATE` | 이미 담겨 있음 |
| 409 `ALREADY_PURCHASED` | (장바구니만) 영구 소장한 활동지. 7일 이용권으로 보고 있는 것은 담을 수 있습니다 |
| 404 | 삭제하려는 것이 목록에 없음 |

---

## 8. 주문과 결제

### 이용권 두 가지

| `plan` | 뜻 | 가격 |
|---|---|---|
| `permanent` | 영구 소장 | 활동지의 `price` |
| `rental` | 7일 이용권. **결제가 확정된 순간부터 7일** | 활동지의 `rental_price` |

살 수 있는지 여부:

| 지금 가진 것 | 영구 소장 구매 | 7일 이용권 구매 |
|---|---|---|
| 없음, 또는 기간이 끝난 이용권 | 가능 | 가능 |
| 기간이 남은 7일 이용권 | 가능 | 불가 (409) |
| 영구 소장 | 불가 (409) | 불가 (409) |

### 주문 상태

| `status` | 뜻 |
|---|---|
| `pending` | 결제 대기 또는 결제 확인 중 |
| `paid` | 결제 완료 |
| `payment_failed` | 결제 실패 |
| `cancelled` | 결제 전 취소 |
| `refunded` | 전액 환불됨 |
| `review` | 결제 금액이 주문과 달라 사람의 확인을 기다림. 권한은 주어지지 않음 |

### 8.1 결제 예상 금액 `v1.5 #47`

`POST /orders/quote`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `activity_ids` | number[] | O | 서로 다른 활동지 id 1~50개 |
| `rental_activity_ids` | number[] | X | 그중 **7일 이용권으로 살** 활동지. `activity_ids`에 들어 있는 id여야 합니다. 생략하면 전부 영구 소장 |

```json
{
  "subtotal": 2600,
  "payable_amount": 2600,
  "unavailable_activity_ids": [9],
  "refund_notice": "결제 후 파일을 내려받거나 열람하면 ... 환불을 요청할 수 있습니다."
}
```

- `unavailable_activity_ids`: 살 수 없는 것(없음, 비공개, 이미 가짐, 7일 이용권을 팔지 않는데 이용권으로 요청). 금액에서 빠집니다.
- `refund_notice`: **결제 버튼 옆에 그대로 보여 주고 동의 체크를 받아야 하는 문구**입니다. 문구는 서버가 정합니다.

### 8.2 주문 생성 `v1.5 #48`

`POST /orders`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `activity_ids` | number[] | O | 8.1과 같음 |
| `rental_activity_ids` | number[] | X | 8.1과 같음 |
| `agreed_to_payment` | boolean | O | `true`여야 함 |
| `agreed_to_refund_notice` | boolean | 유료면 O | 환불 고지에 동의. **합계가 0원보다 크면 `true`가 아닐 때 400.** 무료 주문에는 필요 없음 |
| `payment_method_id` | null | X | 저장 카드는 없습니다. `null` 외의 값은 400 |

응답 `201`:

```json
{ "order_id": 31, "status": "pending", "amount": 2600, "payment_session_token": "ord_9f3c2a7b1e5d4c80" }
```

- `amount`는 서버가 저장된 가격으로 계산한 금액입니다. 요청으로 금액을 보낼 수 없습니다.
- `payment_session_token`이 **결제창에 넘길 주문 번호(`orderId`)** 입니다.
- 합계가 0원이면 결제 없이 바로 `status: "paid"`, `payment_session_token: null`이고 받을 수 있게 됩니다.
- 새 주문을 만들면, 같은 사용자의 아직 결제를 시작하지 않은 이전 주문은 자동으로 `cancelled`가 됩니다.

| 오류 | 경우 |
|---|---|
| 400 `details.activity_ids` | 없거나 비공개인 활동지, 형식 오류 |
| 400 `details.rental_activity_ids` | 7일 이용권을 팔지 않는 활동지, `activity_ids`에 없는 id |
| 400 `details.agreed_to_payment` / `agreed_to_refund_notice` | 동의하지 않음 |
| 409 `ALREADY_PURCHASED` | 위 표에서 "불가"인 경우 |
| 409 `INVALID_STATE` | 같은 활동지가 든 다른 주문의 결제를 확인하는 중 |
| 503 | 서버에 결제 설정이 없어 지금은 결제할 수 없음 |

### 8.3 결제 승인 `v1.5 #49`

`POST /payments/confirm` — 결제창에서 인증이 끝난 뒤 호출합니다. **인증 후 10분 안에** 불러야 합니다.

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `order_id` | number | O | 주문 생성 응답의 `order_id` |
| `pg_payment_key` | string | O | 결제창이 돌려준 `paymentKey` |
| `pg_order_id` | string | O | 결제창이 돌려준 `orderId`(= `payment_session_token`) |

```json
{ "order_id": 31, "status": "paid", "paid_amount": 2600 }
```

금액은 보내지 않습니다. 서버가 주문의 금액으로 결제사에 승인을 요청하고, 결제사가 알려 준 금액이 주문과 같을 때만 완료 처리합니다.

| 응답 | 뜻 | 프론트가 할 일 |
|---|---|---|
| 200 | 결제 완료 | 완료 화면. 같은 요청을 다시 보내도 200이고 두 번 결제되지 않습니다 |
| **503** | **확인 중**(결제사 응답 지연) | 실패로 표시하지 않습니다. 같은 요청을 다시 보내거나 주문 상세를 조회합니다. 서버도 1분마다 다시 확인합니다 |
| 409 `INVALID_STATE` | 승인되지 않음, 이미 끝난 주문, 금액 확인 필요(`review`) | `message`를 보여 주고, 다시 결제하려면 새 주문을 만듭니다 |
| 400 `details.pg_order_id` | 주문 번호가 이 주문의 것이 아님 | |
| 404 | 내 주문이 아님 | |
| 429 | 한 계정이 10분에 20번 초과 | 잠시 후 주문 상세를 조회 |

### 8.4 결제 웹훅 `v1.5 #50`

`POST /payments/webhook` — 토스페이먼츠가 서버로 보내는 알림입니다. **프론트는 호출하지 않습니다.**
본문은 토스페이먼츠의 형식(`eventType`, `createdAt`, `data.orderId`)이고, 서버는 본문을 믿지 않고 결제사에 직접 다시 조회합니다.

### 8.5 결제 내역 `v1.5 #51`

`GET /orders?page=&page_size=` — 최근 주문부터.

```json
{
  "count": 2,
  "results": [
    { "order_id": 31, "status": "paid", "amount": 2600, "payment_session_token": null },
    { "order_id": 30, "status": "cancelled", "amount": 1900, "payment_session_token": null }
  ]
}
```

`payment_session_token`은 `pending`인 주문에만 값이 있습니다.

### 8.6 주문 상세 `v1.5 #52`

`GET /orders/{order_id}`

```json
{
  "id": 31,
  "status": "paid",
  "items": [
    { "activity_id": 7, "title": "숲속 모양 찾기", "price": 700, "plan": "rental" },
    { "activity_id": 8, "title": "색깔 나라", "price": 1900, "plan": "permanent" }
  ],
  "total_amount": 2600,
  "refund_request": null
}
```

- `items`의 `title`과 `price`는 **구매한 날의** 값입니다.
- `refund_request`: 환불을 요청한 적이 없으면 `null`. 있으면 가장 최근 요청:

```json
{ "status": "rejected", "reason": "아이에게 맞지 않아요", "admin_note": "이미 내려받은 자료입니다" }
```

`status`는 `requested`(검토 중), `approved`(환불됨), `rejected`(거절됨). `admin_note`는 거절 사유이며 그 외에는 `null`입니다.

### 8.7 영수증 `v1.5 #53`

`GET /orders/{order_id}/receipt`

```json
{ "receipt_url": "https://dashboard.tosspayments.com/receipt/...", "order_id": 31 }
```

영수증이 없는 주문(무료, 결제 전)은 409입니다.

### 8.8 결제 전 취소 / 환불 요청 `v1.5 #54`

`POST /orders/{order_id}/cancel`

| 필드 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `reason` | string | O | 1~500자 |

응답은 주문 상태에 따라 다릅니다. 둘 다 `201`입니다.

**결제 전(`pending`이고 결제를 시작하지 않음)** — 바로 취소됩니다.

```json
{ "order_id": 31, "status": "cancelled", "refund_amount": 0, "refund_request": null }
```

**결제 완료(`paid`)** — 환불 **요청**이 접수됩니다. 돈과 다운로드 권한은 아직 그대로이고, 관리자가 사유를 보고 수락하거나 거절합니다.

```json
{ "order_id": 31, "status": "paid", "refund_amount": 0, "refund_request": "requested" }
```

- 결과는 주문 상세의 `refund_request`와 `status`(`refunded`)로 확인합니다. 알림은 없습니다.
- **요청이 검토 중인 동안에는 그 주문의 PDF를 받을 수 없습니다**(다운로드 링크 발급이 409). 거절되면 다시 받을 수 있고, 다시 요청할 수도 있습니다.
- 환불은 주문 전체 단위입니다.

| 오류 | 경우 |
|---|---|
| 409 `INVALID_STATE` | 이미 검토 중인 요청이 있음 / 무료 주문 / 결제 확인 중이거나 이미 끝난 주문(실패, 취소, 환불, `review`) |
| 404 | 내 주문이 아님 |

---

## 9. 구매한 활동지와 다운로드

### 9.1 구매한 활동지 `v1.5 #39`

`GET /purchases/activities?page=&page_size=`

```json
{
  "count": 2,
  "results": [
    { "id": 8, "title": "색깔 나라", "...": "활동지의 15개 필드", "plan": "permanent", "expires_at": null, "expired": false },
    { "id": 7, "title": "숲속 모양 찾기", "...": "활동지의 15개 필드", "plan": "rental", "expires_at": "2026-12-01T08:41:43.378Z", "expired": true }
  ]
}
```

활동지 객체에 세 필드가 더 붙습니다.

| 필드 | 설명 |
|---|---|
| `plan` | `permanent` 또는 `rental` |
| `expires_at` | 7일 이용권이 끝나는 시각(UTC). 영구 소장은 `null` |
| `expired` | 기간이 끝났으면 `true`. 화면에 "이용 기간 종료"로 표시하면 됩니다 |

- 기간이 끝난 이용권도 목록에 남습니다. 환불된 것은 빠집니다.
- 구매한 뒤 비공개가 된 활동지도 목록에 남고 PDF를 받을 수 있습니다(표지 주소는 404).

### 9.2 다운로드 링크 발급 `v1.5 #40`

`POST /activities/{activity_id}/download` (본문 없음)

```json
{
  "download_url": "https://<서버>/api/v1/activities/7/files/pdf?token=MTI6Nzox...",
  "expires_at": "2026-11-24T08:46:43Z",
  "file_name": "W0007-K7WX-9M4R-Q2TV.pdf",
  "issuance_code": "W0007-K7WX-9M4R-Q2TV"
}
```

- `download_url`은 **5분 동안** 유효합니다. 토큰 헤더 없이 열 수 있으므로 `<a href>`나 `window.location`으로 바로 엽니다.
- 받을 때마다 새로 발급받습니다. 저장해 두고 쓰지 않습니다.
- 무료이고 공개된 활동지는 로그인만 하면 발급됩니다.
- 링크를 받은 뒤라도 그 사이에 기간이 끝나거나, 환불되거나, 계정이 정지되면 그 링크는 404가 됩니다.
- 링크로 파일이 나갈 때마다 서버에 기록이 남습니다(계정, 활동지, 발급 코드, 시각, 받아 간 IP와 브라우저 정보).
- `issuance_code`는 그 PDF의 모든 쪽에 인쇄된 코드입니다. 화면에 보여 줄지는 프론트가 정합니다. `download_url`의 토큰에는
  회원 번호가 들어 있지 않습니다.
- 응답이 200이면 코드가 찍힌 PDF가 이미 만들어져 있습니다. "만드는 중" 상태나 재조회는 없습니다.

| 오류 | 경우 | 화면 |
|---|---|---|
| 403 `PERMISSION_DENIED` | 구매하지 않음 | 구매 유도 |
| 403 `ACCESS_EXPIRED` | 7일 이용권 기간이 끝남 | "이용 기간 종료", 재구매 유도 |
| 409 `INVALID_STATE` | 환불 요청을 검토 중 | "환불 요청 처리 중" |
| 404 | 없는 활동지 | |
| 429 | 같은 활동지에 1시간 10번 초과 | |
| 500 `PDF_GENERATION_FAILED` | 코드가 찍힌 PDF를 만들지 못함 | "잠시 후 다시 시도". 원본이 대신 나가는 일은 없음 |

### 9.3 PDF 고유코드

회원이 다운로드 링크로 받는 PDF에는 `CODE: W0007-K7WX-9M4R-Q2TV` 같은 코드가 인쇄됩니다.

| 항목 | 지금의 동작 |
|---|---|
| 모양 | `W` + 활동지 번호(4자리 이상) + 무작위 12자(4자씩 `-`로 구분). 정규식 `W[0-9]{4,}(-[2-9A-HJ-NP-Z]{4}){3}` |
| 문자 | 무작위 부분은 `0`, `1`, `I`, `O`를 뺀 32자. 회원·주문 정보에서 계산하지 않은 난수이고 체크섬은 없음 |
| 발급 단위 | **회원 한 명 × 활동지 하나에 코드 하나** |
| 발급 시점 | 그 회원이 그 활동지의 다운로드 링크를 처음 받을 때 |
| 다시 받을 때 | 같은 코드. 환불 뒤 다시 사도, 7일 이용권 뒤에 소장으로 사도, 관리자가 PDF를 바꿔도 같은 코드 |
| 인쇄 위치 | 모든 쪽의 오른쪽 위. 위·오른쪽 가장자리에서 12mm, Courier 10pt, 진한 회색. 눕혀 저장된 쪽은 보이는 방향 기준 |
| 무료 활동지 | 다운로드 링크로 받으면 똑같이 코드가 찍힘. 링크 없이 여는 공개 주소(6.4)는 코드 없는 원본 |

- 코드에는 회원 번호·이메일·주문 번호가 들어 있지 않고, PDF의 다른 곳(파일 이름, 문서 정보)에도 넣지 않습니다.
- 코드를 받는 회원용 API는 없습니다. 코드를 안다고 다른 사람의 파일이나 정보를 볼 수 없고, 코드로 찾는 것은 관리자만 합니다(10.6).
- 서버는 코드를 회원, 활동지, 발급 당시의 주문, 발급 시각과 묶어 저장합니다.
- **협의가 필요한 것**: 위 표의 발급 단위, 다시 받을 때의 규칙, 인쇄 위치·적용 쪽은 서버가 고른 기본값입니다. 지금 도안에 찍어 보면
  주제별 도안은 코드가 "이름:" 칸 위에, 이름 놀이북은 쪽 번호 동그라미 옆 테두리에 걸쳐 찍힙니다. 아이가 이름을 쓰면 코드가
  가려지므로, 도안에서 그 자리를 비우거나 위치를 바꾸기 전에는 사진 인증에 쓸 수 없습니다.
  사진 인증(코드 대조, 중복 승인 방지)과 무료 원본 공개 주소의 처리는 아직 만들지 않았습니다.
- 관리자가 올리는 PDF는 코드를 찍을 수 있어야 합니다. 암호가 걸렸거나 열리지 않는 PDF는 등록·교체 때 400(`pdf`)입니다.

---

## 10. 관리자

서버 설정(`ADMIN_EMAILS`)에 적힌 이메일로 가입한 계정만 쓸 수 있습니다. 그 외에는 403입니다. 모든 주소는 `/api/v1/admin`으로 시작합니다.

### 10.1 카테고리와 활동지

| 메서드·주소 | 본문 | 응답 |
|---|---|---|
| `POST /admin/categories` | `{ "name": "자연탐구" }` (100자 이내) | `201` `{ "id": 1, "name": "자연탐구" }` |
| `POST /admin/activities` | 폼 업로드(아래) | `201` 활동지 + `is_public` |
| `PATCH /admin/activities/{id}` | JSON(아래 필드의 일부) | 활동지 + `is_public` |
| `POST /admin/activities/{id}/files` | 폼 업로드: `image`, `pdf` 중 하나 이상 | 활동지 + `is_public` |
| `POST /admin/activities/{id}/previews` | 폼 업로드: `previews` 이미지 1~5개(각 5MB 이하). 기존 샘플 전체를 이 순서로 교체 | `{ "preview_urls": [...] }` |
| `DELETE /admin/activities/{id}/previews` | 없음 | 샘플을 모두 지움. `{ "preview_urls": [] }` |

활동지 등록(`multipart/form-data`):

| 필드 | 필수 | 설명 |
|---|---|---|
| `title` | O | 255자 이내 |
| `description` | O | 4,000자 이내 |
| `age_min_months`, `age_max_months` | O | 0~1200. 최대가 최소보다 작을 수 없음 |
| `difficulty` | O | `easy` \| `hard` |
| `duration_min`, `duration_max` | O | 1~65535분 |
| `price` | O | 0~10,000,000. 무료는 `0`을 적습니다(빠뜨리면 400) |
| `rental_price` | X | 7일 이용권 가격. **0보다 크고 `price`보다 작아야 함.** 생략하면 이용권 없음 |
| `is_public` | X | `true` \| `false`. 기본 `false` |
| `categories` | O | 카테고리 id를 쉼표로. 예: `1,4` |
| `image` | O | PNG, JPEG, WEBP. 5MB 이하 |
| `pdf` | O | PDF. 20MB 이하 |

수정(`PATCH`, JSON)은 같은 이름의 필드를 원하는 것만 보냅니다. 차이점:

- `categories`는 숫자 배열(`[1, 4]`), `is_public`은 boolean입니다.
- `rental_price`에 **`null`을 보내면 7일 이용권을 없앱니다.**
- `price`만 낮춰서 `rental_price` 이하가 되어도 400(`details.rental_price`)입니다.
- 파일은 `/files` 주소로 따로 바꿉니다.

### 10.2 주문

| 메서드·주소 | 설명 |
|---|---|
| `GET /admin/orders?status=&page=&page_size=` | 전체 주문, 최근 순. `status`로 거르기(`review`가 사람이 봐야 하는 목록) |
| `GET /admin/orders/{id}` | 주문 한 건과 분쟁 대응용 기록 |
| `POST /admin/orders/{id}/reconcile` | 결제사에 그 주문을 다시 조회(웹훅을 놓쳤을 때) |
| `POST /admin/orders/{id}/refund` | 전액 환불. 본문 `{ "reason": "..." }` (200자 이내) |

목록의 한 줄:

```json
{
  "order_id": 31, "user_id": 12, "status": "paid", "amount": 2600,
  "pg_order_id": "ord_9f3c2a7b1e5d4c80",
  "confirm_started_at": "2026-11-24T08:40:11.120Z",
  "created_at": "2026-11-24T08:39:58.004Z"
}
```

상세는 여기에 세 가지가 더 붙습니다.

```json
{
  "paid_at": "2026-11-24T08:40:13.551Z",
  "refund_notice_agreed_at": "2026-11-24T08:39:58.001Z",
  "downloads": [
    {
      "activity_id": 7, "title": "숲속 모양 찾기", "plan": "rental",
      "download_count": 2,
      "first_downloaded_at": "2026-11-24T08:41:02.118Z",
      "last_downloaded_at": "2026-11-25T01:15:40.902Z"
    }
  ]
}
```

- `refund_notice_agreed_at`: 구매자가 환불 고지에 동의한 시각.
- `downloads`: 결제 이후 구매자가 각 PDF를 받은 횟수와 처음·마지막 시각. 받은 적이 없으면 횟수 0, 시각 `null`.
- 환불(`refund`)은 결제사가 환불을 확인해 준 뒤에만 `refunded`가 됩니다. 확인이 늦으면 503이고, 잠시 후 `reconcile`로 다시 확인합니다.

### 10.3 환불 요청

| 메서드·주소 | 설명 |
|---|---|
| `GET /admin/orders/refund-requests?status=&page=&page_size=` | 요청 목록, 최근 순. `status`: `requested` \| `approved` \| `rejected` |
| `POST /admin/orders/refund-requests/{id}/approve` | 수락. 결제사에서 전액 환불 |
| `POST /admin/orders/refund-requests/{id}/reject` | 거절. 본문 `{ "note": "..." }` (1~500자, 구매자가 읽는 답) |

요청 객체(목록의 `results` 항목이자 수락·거절의 응답):

```json
{
  "id": 4, "order_id": 31, "user_id": 12, "email": "parent@example.com",
  "reason": "아이에게 맞지 않아요",
  "status": "requested",
  "admin_note": null,
  "amount": 2600,
  "paid_at": "2026-11-24T08:40:13.551Z",
  "refund_notice_agreed_at": "2026-11-24T08:39:58.001Z",
  "created_at": "2026-11-25T02:00:10.300Z",
  "decided_at": null,
  "downloads": [ "10.2의 downloads와 같은 모양" ]
}
```

| 오류 | 경우 |
|---|---|
| 409 `INVALID_STATE` | 이미 처리된 요청 |
| 503 | (수락) 결제사의 환불 확인이 늦음. 요청은 `requested`로 남아 있다가, 결제사가 환불을 알려 오면 자동으로 `approved`가 됩니다 |
| 404 | 없는 요청 |

### 10.4 사용자

| 메서드·주소 | 설명 |
|---|---|
| `GET /admin/users?email=` | 이메일로 사용자 찾기. 없으면 404 |
| `PATCH /admin/users/{id}` | 본문 `{ "is_active": false }`로 정지, `true`로 복구. 정지하면 그 계정의 토큰이 바로 끊깁니다 |

```json
{
  "id": 12, "email": "parent@example.com", "name": "홍길동", "nickname": "길동맘",
  "is_active": true,
  "created_at": "2026-11-20T03:12:44.100Z",
  "last_login_at": "2026-11-24T08:30:02.771Z"
}
```


### 10.5 매출 집계

`GET /admin/sales?unit=&date=`

| `unit` | `date` 형식 | `buckets` |
|---|---|---|
| `day` | `2026-11-25` | 시간별 24개, `key` 0~23 |
| `month` | `2026-11` | 일별(그 달의 날 수), `key` 1~31 |
| `year` | `2026` | 월별 12개, `key` 1~12 |

```json
{
  "unit": "day", "date": "2026-11-25", "timezone": "Asia/Seoul",
  "paid_amount": 5300, "refund_amount": 2900, "net_amount": 2400,
  "paid_count": 3, "refund_count": 1,
  "buckets": [
    { "key": 0, "paid_amount": 1900, "refund_amount": 0, "net_amount": 1900 },
    { "key": 1, "paid_amount": 0, "refund_amount": 0, "net_amount": 0 }
  ]
}
```

- 모든 날짜와 시간은 **한국 시간**입니다. `buckets`는 금액이 0인 칸도 빠짐없이 옵니다.
- `paid_amount`(결제 완료 금액)는 **결제가 승인된 시각**의 칸에 들어갑니다. 나중에 환불돼도 그날의 결제 금액은 그대로입니다.
- `refund_amount`(환불 금액)는 **환불이 확정된 시각**의 칸에 들어갑니다. 결제한 날로 거슬러 올라가 빼지 않습니다.
  11월에 팔고 12월에 환불했으면 11월의 결제 금액과 12월의 환불 금액으로 잡힙니다.
- `net_amount`(환불 차감 금액) = `paid_amount` - `refund_amount`. 환불만 있는 칸은 음수입니다.
- 결제 대기·취소·결제 실패 주문은 들어가지 않습니다. 금액이 맞지 않아 지급 없이 되돌린 결제(`review`였던 주문)도 매출과 환불
  어디에도 넣지 않습니다. 무료 주문(0원)은 건수에도 넣지 않습니다.
- `unit`이나 `date`가 없거나 형식이 다르면 400입니다.

### 10.6 발급 코드 조회

| 메서드·주소 | 설명 |
|---|---|
| `GET /admin/worksheet-issuances?code=&user_id=&activity_id=&page=&page_size=` | 발급 목록, 최근 순. `code`는 전체 코드가 정확히 같아야 찾음(소문자·공백은 허용) |
| `GET /admin/worksheet-issuances/{id}` | 한 건. 회원 이메일과 받아 간 기록이 붙음 |

목록의 한 줄(`{ "count": 1, "results": [ ... ] }`):

```json
{
  "id": 5, "issuance_code": "W0007-K7WX-9M4R-Q2TV",
  "user_id": 12, "activity_id": 7, "activity_title": "숲속 모양 찾기", "order_id": 31,
  "issued_at": "2026-11-25T04:41:02.118Z",
  "right": "active",
  "download_count": 2, "last_downloaded_at": "2026-11-25T05:15:40.902Z"
}
```

- `order_id`: 코드가 처음 발급될 때 권한의 근거였던 주문. 주문 없이 받은 무료 활동지는 `null`.
- `right`: 그 회원이 지금 그 활동지에 가진 권한. `active` | `expired`(7일 이용권 종료) | `revoked`(환불) | `free`(주문 없이 받은 무료).
- 상세에는 `email`과 `downloads`(최근 100건, 각 `downloaded_at`, `ip_address`, `user_agent`)가 더 붙습니다. 탈퇴한 회원의 `email`은 실제 주소가 아닌 자리표시 값입니다.
- 코드를 다시 발급하거나 무효로 만드는 API는 없습니다.

---

## 11. 화면 흐름별 호출 순서

### 11.1 결제 (토스페이먼츠 결제창)

1. `POST /orders/quote` — 금액과 `refund_notice`를 받아 화면에 표시하고, 결제 동의와 환불 고지 동의를 받습니다.
2. `POST /orders` — `order_id`, `amount`, `payment_session_token`을 받습니다.
3. 결제창을 엽니다. `orderId`에 `payment_session_token`, `amount`에 응답의 `amount`를 넣습니다.
4. 결제창이 성공 주소로 돌아오면 `paymentKey`, `orderId`를 받아 `POST /payments/confirm`을 부릅니다.
5. 200이면 완료. 503이면 같은 요청을 다시 보내거나 `GET /orders/{order_id}`로 상태를 확인합니다.

무료 활동지만 담긴 주문은 2번에서 바로 `paid`가 되고 3~5번이 없습니다.

### 11.2 다운로드

1. `GET /purchases/activities`로 보유 목록을 보여 줍니다. `expired`가 `true`면 받기 버튼 대신 기간 종료를 표시합니다.
2. 받기 버튼을 누르면 `POST /activities/{id}/download`를 부르고, 응답의 `download_url`을 바로 엽니다.

### 11.3 환불 요청

1. `POST /orders/{order_id}/cancel`에 사유를 보냅니다. 응답의 `refund_request`가 `"requested"`면 접수된 것입니다.
2. 주문 상세의 `refund_request.status`로 진행 상황을 보여 줍니다. `rejected`면 `admin_note`를 함께 보여 줍니다.
3. 수락되면 주문의 `status`가 `refunded`가 되고 그 활동지는 보유 목록에서 빠집니다.

### 11.4 토큰

1. 로그인·가입 응답의 두 토큰을 저장합니다.
2. API가 401을 주면 `POST /auth/token/refresh`로 Access 토큰을 새로 받아 원래 요청을 다시 보냅니다.
3. 갱신이 400이면 로그인 화면으로 보냅니다.
