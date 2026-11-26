# YIPPEE CLUB 학습지 PDF 고유코드 발급·삽입 구현 요청서

- 전달 대상: BE 담당 준성님
- 작성일: 2026-11-25
- 대상: Spring 기반 YIPPEE_CLUB_BE
- 문서 상태: 구현 요청 및 설계 제안. 현재 배포된 API 명세를 대체하지 않습니다.
- 목적: 구매자별 발급 PDF에 개인정보를 드러내지 않는 코드를 넣고, 향후 사진 인증에서 소유권·중복 사용을 검사합니다.

## 1. 요구사항과 미확정 사항

### 참고 문서와 적용 우선순위

사용자가 제공한 `pdf.md`의 기능 요구사항을 참고했습니다. 코드 포맷·길이·문자셋·DB 구조·파일 생성 방식은 이 가이드의 개선안을 우선하는 방향으로 사용자 요청을 반영했습니다. 발급 단위·아이별 인증 등 서비스 정책은 아래 미확정 항목을 별도로 합의합니다.

| 참고 문서 내용 | 이 가이드 적용 |
|---|---|
| 다운로드 PDF에 사용자별 코드 삽입 | 유지. 구매 권한 및 원본 버전과 연결 |
| 난수 7자리 + 체크섬 1자리 | 난수 12자리로 확장. 체크섬 추가 여부는 아래 별도 설명 |
| A4, Courier 10pt, 우측 24pt | A4를 우선 지원하되 CropBox·회전 검사, 10~12pt 및 12mm 여백 제안 |
| 요청마다 메모리 합성 | 발급 이력·코드 재사용, 비공개 파일 생성 및 장애 복구 제안 |
| 하나의 `status`로 발급·제출·승인·만료 관리 | 생성 상태·인증 상태·권한 무효화 분리 제안 |
| AI 판독과 소유권·중복 확인 | 유지. 판독 불확실 시 검수, 승인 경쟁 제어 추가 |

참고 문서의 허용 문자셋은 '24자'라고 되어 있지만 실제 나열된 문자는 26개입니다. 또한 예시 코드에 포함된 `5`, `S`, `B` 등과 허용 문자 목록이 일부 일치하지 않습니다. BE와 FE는 이 가이드의 생성 규칙·정규식을 함께 사용하고 과거 예시를 그대로 검증 규칙으로 쓰지 않습니다.

### 사용자 요구사항

1. 구매자가 학습지를 다운로드하면 PDF에 고유코드가 인쇄돼 있어야 합니다.
2. 코드만 보고 구매자의 회원번호·이메일·전화번호·주문번호를 역산할 수 없어야 합니다.
3. BE 내부에서는 코드와 구매자·학습지·구매 권한을 연결할 수 있어야 합니다.
4. 코드는 다운로드 권한을 대신하지 않습니다. 코드를 아는 타인에게 원본 다운로드나 개인정보 조회를 허용하지 않습니다.
5. 사진 인증에서는 코드 인식 결과를 DB와 대조해 계정 일치와 중복 인증을 검사합니다.

### 아래는 구현 전 합의가 필요한 권장 기본값입니다

| 항목 | 권장안 | 결정 필요 이유 |
|---|---|---|
| 발급 단위 | 구매 권한 1건 × 학습지 버전 1개 | 같은 회원의 재구매·대여 구분 |
| 발급 시점 | 구매 후 첫 다운로드 요청 | 결제만 하고 내려받지 않은 건과 구분 |
| 재다운로드 | 동일 구매 권한·동일 버전이면 같은 코드 | 새 코드로 중복 인증 우회 방지 |
| PDF 적용 페이지 | 전 페이지에 같은 코드 | 중간 페이지만 촬영해도 인식 가능 |
| 삽입 위치 | 상단 우측의 사전 확보된 여백 | 학습 내용 가림 방지 |
| 아이별 발급 | 1차에서는 하지 않음 | 아이별 인증을 원하면 발급 단위와 중복 범위 변경 필요 |
| 무료 학습지 | 인증 대상이면 로그인 후 동일하게 발급 | 현재 공개 PDF 경로와 충돌하므로 정책 결정 필요 |

위 권장안을 이미 확정된 서비스 정책으로 간주하지 말아 주세요.

## 2. 코드 모양과 개인정보 보호

### 제안 형식

```text
CS05-K7WX-9M4R-Q2TV
│    └──────────── 무작위 발급 식별부 12자리
└───────────────── 공개 가능한 학습지 종류 코드
```

- `CS05`: 학습지 자체를 식별하는 공개 코드 예시입니다. 실제 값은 등록 시 관리합니다.
- 뒤 12자리: 암호학적 난수로 독립 생성합니다. 회원·아이·주문 데이터로부터 계산하지 않습니다.
- 읽기 어려운 `0`, `1`, `I`, `O`를 제외한 32문자 집합 사용을 제안합니다.
- 12자리 × 문자당 5비트 = 60비트의 무작위 공간입니다. 이는 인쇄용 식별자이며 인증 비밀키가 아닙니다.
- DB UNIQUE 제약과 충돌 시 재생성은 반드시 필요합니다.
- 원래 예시 `CS05-9K4M-7P2X`의 길이가 확정된 것은 아닙니다. 12자리 확장은 충돌과 추측 가능성을 낮추기 위한 제안입니다.

### 체크섬 처리

원본 문서는 마지막 1자리를 OCR 오인식 검출용 체크섬으로 제안했습니다. 이 가이드의 기본 형식은 뒤 12자리 모두 난수이며 체크섬을 포함하지 않습니다. DB 정확 일치 조회와 불확실한 OCR의 검수 전환을 기본 검증으로 사용합니다.

체크섬이 필요하면 난수 자리를 줄이지 말고 별도 문자를 추가하는 규칙을 먼저 확정합니다. 알고리즘·문자셋·입력 정규화·학습지 접두부 포함 여부·공통 테스트 벡터를 명세하고 생성기·PDF 정규식·AI 출력 검증을 함께 변경합니다. 체크섬은 일부 오타 탐지용이며 소유권 검증, 위조 방지 또는 비밀키를 대신하지 않습니다.

### 사용하지 않을 생성 방식

```text
회원 ID + 학습지 ID + 일련번호
이메일을 Base64로 변환한 문자열
회원 ID 또는 이메일의 단순 해시
시간값 + 주문번호
짧게 자른 회원 JWT
```

Base64는 암호화가 아닙니다. 순번·이메일처럼 후보가 좁은 값의 단순 해시도 개인정보 은닉용으로 사용하지 않습니다.

이 구조는 **코드 자체에 구매자 정보를 담지 않는 가명 식별 방식**입니다. DB 관리자까지 구매자를 알 수 없는 완전 익명화는 아닙니다. 또한 같은 코드를 여러 곳에 공개하면 동일 발급물이라는 연결은 가능하므로, 코드가 전혀 추적 불가능하다고 안내하지 않습니다.

## 3. 현재 BE 코드와 변경 지점

아래 내용은 로컬 BE `main`의 구현을 읽고 정리한 것입니다. 서버 배포본의 최신 상태는 별도 확인이 필요합니다.

| 현재 코드 | 역할 | 변경 방향 |
|---|---|---|
| `order/OrderController.java` | `POST /api/v1/activities/{id}/download` | 외부 진입점 유지 권장 |
| `order/OrderService.java`의 `download` | 구매·기간·환불 등 다운로드 상태 확인 | 검증 후 발급 서비스 호출 |
| `catalog/Activities.java`의 `downloadLink` | 단기 다운로드 링크 생성 | 원본 대신 발급 PDF를 가리키도록 변경 |
| `catalog/CatalogController.java`의 `file` | PDF 응답, 다운로드 이력 기록 | 발급 파일용 경로·권한 검증으로 분리 권장 |
| `pdf_downloads` | 실제 GET 다운로드 시도 이력 | 발급 이력 FK와 생성 버전 연결 검토 |

현재 `downloadLink` 토큰의 서명 대상은 `userId:activityId:expires`이며, 해당 문자열을 Base64 URL 인코딩한 부분이 링크에 포함됩니다. 서명은 변조를 막지만 내용을 숨기지 않습니다. **PDF 시리얼과 이 토큰은 별개**입니다. 다운로드 링크에서도 회원 ID를 보이지 않게 하려면 아래의 무작위 단기 토큰 방식으로 함께 변경해야 합니다.

공개 원본 PDF를 그대로 반환한 뒤 FE에서 코드를 덧붙이는 구조는 사용하지 않습니다. FE는 발급 완료된 PDF를 내려받아야 합니다.

## 4. DB 구조 제안

회원과 학습지는 기존 테이블을 재사용합니다. 핵심 신규 테이블은 `worksheet_issuances`이며 주문·주문 항목 또는 구매 권한 테이블과 연결합니다. 이름과 FK는 기존 스키마에 맞춰 조정해 주세요.

| 필드 | 예시 타입 | 의미 |
|---|---|---|
| `id` | BIGINT PK | 내부 식별자, PDF에는 출력하지 않음 |
| `serial_code` | VARCHAR(64), UNIQUE | 전체 인쇄 코드, 대문자 정규화 |
| `owner_user_id` | BIGINT FK | 발급 계정 |
| `activity_id` | BIGINT FK | 학습지 |
| `entitlement_id` | BIGINT FK | 구매·대여 권한. 실제 권한 모델에 맞춤 |
| `activity_version` | VARCHAR(64) | 불변 원본 버전 ID 또는 해시 |
| `worksheet_code_snapshot` | VARCHAR(32) | 발급 당시 학습지 코드 |
| `stamp_version` | VARCHAR(32) | 삽입 위치·폰트 등 렌더링 규칙 버전 |
| `generation_status` | VARCHAR(20) | `GENERATING / READY / FAILED` |
| `verification_status` | VARCHAR(20) | `UNUSED / APPROVED` 등 인증 상태 |
| `revoked_at` | TIMESTAMP NULL | 환불·운영 조치에 따른 무효화 |
| `private_file_key` | VARCHAR(512) NULL | 비공개 발급 PDF 저장 키 |
| `output_sha256` | CHAR(64) NULL | 결과 파일 무결성 확인값 |
| `issued_at` | TIMESTAMP | UTC 발급 시각 |
| `generated_at` | TIMESTAMP NULL | PDF 생성 완료 시각 |
| `last_error_code` | VARCHAR(64) NULL | 내부 재시도 원인. 상세 스택은 응답하지 않음 |

필수 제약:

```text
UNIQUE(serial_code)
UNIQUE(entitlement_id, activity_version)  -- 권장 발급 단위를 채택했을 때
INDEX(owner_user_id, issued_at)
INDEX(activity_id, issued_at)
```

- 한 권한에 여러 학습지가 들어가는 모델이면 유니크 키에 `activity_id`도 포함합니다.
- 선택적인 아이 ID를 NULL로 넣고 유니크 처리하면 DB별 NULL 동작으로 중복을 허용할 수 있습니다. 아이별 발급을 채택하면 별도의 확정된 발급 키를 설계합니다.
- 기존 문서의 `ISSUED / APPROVED / EXPIRED`를 하나의 상태값에 모두 넣으면 생성·인증·사용 권한이 섞입니다. 상태를 분리하거나 각 의미와 전이를 명세해 주세요.
- 구매 권한 만료와 단기 URL 만료는 서로 다릅니다. URL이 만료됐다고 발급 이력을 지우지 않습니다.
- 개인정보 보존·회원 탈퇴 시 FK 및 발급 기록 처리 정책은 별도로 정해야 합니다.

## 5. 발급 및 재다운로드 처리 순서

1. 로그인 토큰에서 회원 ID를 얻습니다. 요청 본문에 받은 `owner_user_id`를 신뢰하지 않습니다.
2. 기존 구매 권한 검사로 결제 완료·대여 기간·환불·계정 상태를 확인합니다.
3. 해당 권한에서 사용할 원본 버전을 확정합니다. 기존 원본을 덮어쓰지 않도록 버전 보관이 필요합니다.
4. 동일 발급 키의 이력이 있으면 재사용합니다.
5. 이력이 없으면 난수 코드와 `GENERATING` 상태로 생성합니다. 동시 요청은 UNIQUE 제약으로 최종 제어합니다.
6. 원본의 복사본에 코드를 삽입합니다. 원본 파일을 직접 수정하지 않습니다.
7. 임시 파일에 결과를 쓰고 PDF 재열기·코드 추출·해시 검증 후 비공개 최종 위치로 이동합니다.
8. 성공한 경우에만 `READY`와 최종 저장 키를 기록합니다. 실패하면 `FAILED`로 기록하고 다운로드 URL을 반환하지 않습니다.
9. 발급 완료 후 짧게 만료되는 무작위 다운로드 토큰을 발급합니다.
10. 파일 요청 시 토큰·발급 상태·현재 구매 권한을 다시 확인하고 PDF를 응답합니다.

### 동시 요청·실패 처리

- 권한 검사부터 PDF 생성까지 긴 DB 트랜잭션 하나로 감싸지 않습니다.
- 짧은 발급 예약 트랜잭션 → 파일 생성 → 짧은 완료 트랜잭션으로 분리합니다.
- 생성 중인 발급 건은 중복 생성하지 말고 `202`와 재조회 방법을 주거나 짧게 기다리는 정책을 명세합니다.
- UNIQUE 위반을 무조건 코드 충돌로 취급하지 않습니다. 동일 발급 키 경쟁이면 승리한 기존 행을 재조회하고, 시리얼 충돌이면 새 난수를 생성합니다.
- 중간 장애로 남은 `GENERATING`은 작업 소유권·기한을 검사한 복구 작업으로 재시도합니다.
- 파일 생성 성공 후 DB 반영이 실패하면 고아 파일 정리 작업이 필요합니다.
- 실패 시 원본 PDF를 대신 내보내면 시리얼 검증이 무력화되므로 허용하지 않습니다.

## 6. Java 난수 생성 예시

아래는 생성 규칙 예시이며 기존 서비스에 바로 연결된 구현은 아닙니다.

```java
import java.security.SecureRandom;
import java.util.Locale;

public final class WorksheetSerialGenerator {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    public static String generate(String worksheetCode) {
        String prefix = worksheetCode.toUpperCase(Locale.ROOT);
        if (!prefix.matches("[A-Z0-9]{2,12}")) {
            throw new IllegalArgumentException("Invalid worksheet code");
        }
        StringBuilder result = new StringBuilder(prefix);
        for (int group = 0; group < 3; group++) {
            result.append('-');
            for (int i = 0; i < 4; i++) {
                result.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
        }
        return result.toString();
    }
}
```

`SecureRandom`에 회원번호·시간값 등으로 직접 seed를 지정하지 않습니다. DB 제약 오류의 종류를 구분해 제한된 횟수만 재시도하고, 계속 실패하면 내부 오류로 처리합니다. [Java SecureRandom 공식 문서](https://docs.oracle.com/en/java/javase/26/docs/api/java.base/java/security/SecureRandom.html)

## 7. PDF 삽입 규칙과 PDFBox 예시

### 권장 출력 규칙

| 항목 | 제안 |
|---|---|
| 문자 | 영문 대문자·숫자·하이픈 |
| 출력 예 | `CODE: CS05-K7WX-9M4R-Q2TV` |
| 폰트 | 인쇄·OCR에 읽기 쉬운 고정폭 영문 폰트 |
| 크기 | 10~12pt에서 실제 인쇄 검증 |
| 색 | 진한 회색 또는 검정, 흰 배경에서 충분한 대비 |
| 여백 | 우측·상단 12mm 이상을 출발점으로 실제 템플릿 검토 |
| 페이지 | 전 페이지 동일 코드 권장, 첫 장만 적용 여부는 협의 |

여백 위치에 도형·문제가 이미 있으면 텍스트를 덮어쓰지 않습니다. 등록 시 여백을 확보한 템플릿을 받거나 별도 레이아웃 정책을 사용합니다. 흰 사각형을 임의로 덧그려 기존 내용을 지우지 않습니다.

### 라이브러리

Apache PDFBox 3.x 사용을 제안합니다. 실제 도입 시 Maven Central에 배포된 보안 패치 버전을 확인해 정확한 버전으로 고정합니다. 아래 코드는 PDFBox 3.x의 `Loader.loadPDF` 방식을 기준으로 합니다. [PDFBox 3 공식 마이그레이션 가이드](https://pdfbox.apache.org/3.0/migration.html)

```java
import java.awt.Color;
import java.io.IOException;
import java.nio.file.Path;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;

public final class PdfSerialStamper {
    public static void stamp(Path master, Path temporaryOutput, String serial)
            throws IOException {
        if (!serial.matches("[A-Z0-9]{2,12}(-[2-9A-HJ-NP-Z]{4}){3}")) {
            throw new IllegalArgumentException("Invalid serial");
        }
        // 입력·출력 경로는 서버가 지정한 서로 다른 경로여야 합니다.
        try (PDDocument document = Loader.loadPDF(master.toFile())) {
            if (document.isEncrypted() || document.getNumberOfPages() == 0) {
                throw new IOException("Unsupported PDF");
            }
            PDFont font = new PDType1Font(Standard14Fonts.FontName.COURIER);
            float size = 11f;
            float margin = 12f * 72f / 25.4f; // mm -> point
            String text = "CODE: " + serial;
            float width = font.getStringWidth(text) / 1000f * size;

            for (PDPage page : document.getPages()) {
                // 이 최소 예시는 회전 0도, UserUnit 1인 검증된 템플릿만 지원합니다.
                // 다른 입력은 등록 단계에서 거절하거나 별도 좌표 정규화 구현이 필요합니다.
                if (page.getRotation() % 360 != 0 || page.getUserUnit() != 1f) {
                    throw new IOException("Template normalization required");
                }
                PDRectangle box = page.getCropBox();
                float x = box.getUpperRightX() - margin - width;
                float y = box.getUpperRightY() - margin - size;
                if (x < box.getLowerLeftX() + margin || y < box.getLowerLeftY() + margin) {
                    throw new IOException("Page too small for serial");
                }
                try (PDPageContentStream stream = new PDPageContentStream(
                        document, page, PDPageContentStream.AppendMode.APPEND,
                        true, true)) {
                    stream.beginText();
                    stream.setFont(font, size);
                    stream.setNonStrokingColor(Color.DARK_GRAY);
                    stream.newLineAtOffset(x, y);
                    stream.showText(text);
                    stream.endText();
                }
            }
            document.save(temporaryOutput.toFile());
        }
    }
}
```

이 코드는 구조 설명용으로 작성했으며 프로젝트에서 컴파일·시각 검증한 완성 모듈은 아닙니다. DB 예약·저장소·권한·원자적 파일 이동·재시도 처리는 포함하지 않습니다.

### 실제 도입 시 추가 처리

- 기본 영문 폰트 예시는 한글을 출력하지 못합니다. 한글 안내문을 넣으려면 배포 라이선스를 확인한 TTF를 `PDType0Font`로 임베딩합니다.
- 폰트 치환 차이까지 통제하려면 영문도 라이선스가 확인된 폰트 파일을 임베딩합니다.
- A4 세로·가로, CropBox 원점, 페이지 회전, UserUnit 배율을 모두 검사합니다. 미지원 PDF는 업로드 단계에서 안내합니다.
- 전자서명이 있는 PDF에 삽입하면 서명 유효성에 영향을 줄 수 있습니다. 1차에서는 서명된 PDF를 등록하지 않는 정책을 권장합니다.
- PDF가 이미지여도 텍스트 오버레이는 가능하지만 실제 사진에서 OCR이 되는지는 별도 검증이 필요합니다.
- 텍스트 추출 성공만으로 인쇄 위치·겹침 검증을 대신하지 않습니다. 렌더링과 실제 출력 테스트가 필요합니다.
- 신뢰하지 않는 PDF 파싱에는 업로드 용량·페이지 수·작업 시간·동시 생성 수·메모리 제한을 적용합니다.
- QR은 필요하면 같은 불투명 시리얼만 담습니다. 구매자 정보·다운로드 토큰·개인정보 조회 URL은 담지 않습니다.

## 8. 다운로드 URL과 파일 보안

인쇄 시리얼과 다운로드 토큰은 반드시 분리합니다.

| 구분 | PDF 시리얼 | 다운로드 토큰 |
|---|---|---|
| 목적 | 발급물 식별·사진 인증 대조 | 일시적인 파일 접근 |
| 수명 | 발급 이력 기준 유지 | 수분 등 짧은 TTL |
| 구성 | 학습지 코드 + 난수 | 별도의 256비트 난수 권장 |
| 저장 | 발급 이력의 고유코드 | 토큰 해시·발급 FK·만료 시각 |
| 노출 | 종이·사진에 표시 가능 | URL 공유·로그 노출 최소화 |

다운로드 요청에서 확인할 사항:

1. 발급 상태가 `READY`이고 무효화되지 않았는지
2. 접근자가 권한 있는 소유자인지 또는 유효한 단기 토큰을 제시했는지
3. 현재도 구매·대여·회원 상태가 유효한지
4. 조회한 파일 키가 서버의 비공개 저장 영역 내부인지

단기 토큰만으로 내려받는 URL은 유효기간 동안 링크 보유자에게 접근을 허용하는 bearer 방식입니다. 복사한 링크까지 타인이 쓰지 못하게 하려면 파일 GET에도 로그인과 소유자 대조를 요구해야 합니다. 현재 FE는 파일을 fetch 후 표시하므로 이 방식으로 바꿀 때 Authorization 전달 경로도 함께 확인합니다.

토큰은 access JWT와 별도로 만들고, 로그에서 query token을 제거합니다. 발급 PDF 응답에는 `Cache-Control: private, no-store`, 적절한 `Content-Disposition`, `Content-Type: application/pdf`를 사용합니다. CDN·공개 스토리지에 구매자별 PDF를 노출하지 않습니다.

PDF 메타데이터·출력 파일명·저장 키·QR에도 이메일이나 회원 ID를 넣지 않습니다. 원본 메타데이터에 작성자 개인정보가 있다면 명시적 정리 정책을 적용합니다.

이미 내려받은 PDF의 회수나 코드 편집·복사 자체를 완전히 막을 수는 없습니다. 환불 이후 신규 접근과 인증은 서버에서 차단하고, 기존 파일에 대한 제한을 과장하지 않습니다.

## 9. API 계약 제안

### 기존 다운로드 API 유지

```http
POST /api/v1/activities/{activity_id}/download
Authorization: Bearer {access_token}
```

기존 응답의 `download_url`, `expires_at`, `file_name`을 유지하면 FE 변경을 최소화할 수 있습니다. 아래 추가 필드는 제안이며 명세 반영 후 연결합니다.

```json
{
  "download_url": "https://api.yippeclub.com/api/v1/issued-files/download?token=OPAQUE_TOKEN",
  "expires_at": "2026-11-25T13:10:00Z",
  "file_name": "CS05-K7WX-9M4R-Q2TV.pdf",
  "issuance_code": "CS05-K7WX-9M4R-Q2TV",
  "activity_version": "v1",
  "generation_status": "READY"
}
```

반환 시점에 준비되지 않았다면 `202`와 재조회 계약을 명시해야 합니다. 현재 FE가 무조건 완료 URL을 기대하는지 확인 후 함께 변경합니다. 준비되지 않은 URL을 성공 응답으로 반환하지 않습니다.

### 관리자 발급 이력 API 제안

```http
GET /api/v1/admin/worksheet-issuances?code=CS05-K7WX-9M4R-Q2TV&page=1&page_size=20
GET /api/v1/admin/worksheet-issuances/{id}
```

- 목록: 고유코드, 학습지·버전, 발급 시각, 생성·인증·무효화 상태
- 상세: 필요한 권한이 있는 관리자에게만 소유 회원·주문·다운로드·인증 이력 제공
- 소유자 이메일은 일반 응답이나 사진 인증 실패 메시지에 포함하지 않음
- 다른 회원의 코드를 제출해도 그 회원의 존재·이메일을 알려주지 않음
- 재발급·무효화 API가 필요하면 처리 권한, 사유, 감사 로그, 기존 코드 처리 방침을 함께 정의

### 오류 코드 제안

| 상황 | 제안 코드 | 화면 처리 |
|---|---|---|
| 구매 권한 없음·만료·환불 | 기존 오류 계약 유지 | 구매 내역 안내 |
| 생성 중 | `PDF_GENERATING` | 상태 재조회 |
| 생성 실패 | `PDF_GENERATION_FAILED` | 원본 제공 없이 재시도 안내 |
| 미지원 원본 | `PDF_TEMPLATE_UNSUPPORTED` | 관리자 파일 교체 안내 |
| 토큰 만료·무효 | `DOWNLOAD_LINK_INVALID` | 새 링크 요청 |
| 반복 발급 과다 | 기존 429 계약 유지 | 대기 후 재시도 |

공통 `{code, message, details, request_id}` 오류 형태를 유지합니다. HTTP 상태값·재시도 가능 여부는 실제 명세에 확정해 주세요.

## 10. 사진 인증 대조 규칙

### AI 응답 계약 제안

원본 문서의 다음 응답 구조를 유지할 수 있습니다. 서버는 스키마와 enum을 검증하고 AI의 설명 문구 자체로 승인하지 않습니다.

```json
{
  "detected_code": "CS05-K7WX-9M4R-Q2TV",
  "is_filled": true,
  "confidence": "high",
  "reason": "코드와 학습지 작성 내용을 식별함"
}
```

- 판독 불가: `detected_code: null`, `confidence: "low"`를 반환하며 코드를 추측하지 않습니다.
- `confidence`는 모델의 자체 판단이지 보정된 확률이 아닙니다. 검수 표본으로 자동 승인 기준을 검증해야 합니다.
- 알 수 없는 confidence 값, JSON 파싱 실패, 타임아웃은 자동 승인하지 않고 재시도/검수로 처리합니다.
- 제공자·모델·프롬프트 버전을 저장하면 판정 변경 원인을 확인하기 쉽습니다.

1. 업로드 인증 요청의 계정은 로그인 토큰으로 확정합니다.
2. AI가 `detected_code`, `is_filled`, `confidence`를 반환합니다.
3. 대문자화·허용된 공백/하이픈 정규화 후 정확한 코드로 조회합니다. 유사한 코드를 추정해 자동 승인하지 않습니다.
4. 발급 소유자·학습지·버전·현재 권한·무효화 여부를 검증합니다.
5. 신뢰도가 낮거나 코드가 잘린 경우 검수 대기로 보냅니다.
6. 동일 코드의 중복 승인 여부를 DB 제약과 트랜잭션으로 검사합니다.
7. 승인 결과를 저장하고 승인·반려 담당자와 사유를 감사 로그에 남깁니다.

중복 기준을 `발급 건당 1회`로 할지 `발급 건 × 도전과제당 1회`로 할지는 별도 결정해야 합니다. 사진 접수부터 중복으로 차단하면 반려 후 재촬영이 불가능하므로, **제출 시도 이력과 최종 승인 유일성**을 분리합니다.

코드와 `is_filled`만으로 실제 아이의 수행을 완전히 증명할 수는 없습니다. 이는 발급 소유권·기본 완성도 검증이며 사진 재사용 탐지는 추가 기능입니다.

## 11. 다운로드 이력과 환불 처리 주의

- 발급 예약만으로 다운로드 완료 이력을 생성하지 않습니다.
- 기존 구현처럼 HEAD는 다운로드 이력에 포함하지 않습니다.
- 서버가 GET 응답을 시작한 것은 사용자의 저장 완료를 보장하지 않습니다. 기록의 의미를 '파일 제공 시도/시작'으로 정확히 정의합니다.
- 생성 실패·권한 실패·토큰 만료에는 다운로드 기록이 남지 않아야 합니다.
- 실제 파일 응답 직전 환불 여부를 다시 확인합니다.
- 환불 완료 시 관련 권한의 새 URL 발급·기존 URL 사용·사진 인증을 차단합니다.
- 이미 승인된 사진 인증을 환불 시 취소할지는 상품 정책으로 별도 결정합니다.
- 여러 주문이 같은 학습지 권한을 갖는 경우 어느 주문으로 발급했는지 정확히 연결해 잘못된 환불 차단을 막습니다.

## 12. 필수 검증 항목

### 정상·동시성

- [ ] 결제 완료한 회원이 처음 요청하면 발급 이력 1건과 코드가 들어간 PDF 생성
- [ ] 서로 다른 구매 권한에는 다른 코드 발급
- [ ] 동일 권한·버전의 반복 및 동시 요청에 동일 코드 유지
- [ ] 다중 서버에서도 DB 제약으로 중복 발급 방지
- [ ] 코드 충돌과 동일 발급 키 경쟁을 구분해 복구
- [ ] 파일 생성·DB 완료 실패 후 고아 파일 및 상태 복구

### PDF 품질

- [ ] 모든 적용 페이지에서 같은 코드 추출 가능
- [ ] 원본 PDF 해시가 발급 전후 동일
- [ ] 원본 텍스트·이미지·페이지 수가 유지되고 내용 겹침 없음
- [ ] A4 세로·가로, 여러 페이지, 다른 CropBox, 회전 입력 처리 확인
- [ ] 암호화·손상·전자서명·초대형 PDF의 명시적 처리
- [ ] 흑백 인쇄 및 휴대전화 사진에서 코드 읽기 확인
- [ ] 고객 화면 미리보기와 실제 다운로드 파일 모두 동일 발급 PDF 사용

### 권한·개인정보

- [ ] 비구매자·다른 회원·탈퇴/비활성 계정의 접근 차단
- [ ] 환불 및 대여 만료 후 기존 링크도 사용 불가
- [ ] 시리얼을 바꿔 조회해도 다른 구매자 정보나 파일 접근 불가
- [ ] 코드·PDF 메타데이터·파일명에 회원 ID·이메일·주문번호 없음
- [ ] 다운로드 토큰을 디코딩해도 사용자 식별 정보가 나오지 않음
- [ ] URL·헤더 로그에 인증 토큰이 노출되지 않음
- [ ] 관리자 검색·다운로드·무효화 권한 검사 및 감사 로그 확인

### 사진 인증

- [ ] 본인 코드와 완성 사진의 정상 승인
- [ ] 다른 계정 코드·무효 코드·낮은 신뢰도 자동 승인 방지
- [ ] 동시 승인 요청에서도 중복 승인 방지
- [ ] 반려 후 재촬영 제출 가능

## 13. 구현 순서 및 FE 전달사항

1. 발급 단위·재다운로드·아이별 처리·무료 PDF 정책 확정
2. 발급 이력·원본 버전·단기 다운로드 토큰 마이그레이션
3. 난수 생성과 동시 발급 제어 구현
4. PDF 검증·코드 삽입·비공개 저장·복구 구현
5. 기존 다운로드 API를 발급 PDF 반환으로 연결
6. 관리자 발급 이력 조회 API 제공
7. 사진 인증 대조 및 관리자 검수 API 제공
8. 명세·Swagger 갱신 후 FE와 통합 테스트

FE에 전달 부탁드릴 내용:

- 다운로드 응답 변경 여부 및 실제 예시
- 생성 중 응답·재시도/조회 방식
- 발급 코드 표시 여부와 위치
- 관리자 조회 응답·필터·페이지네이션
- 최종 상태값·오류 코드
- 테스트 계정과 테스트 상품 ID (비밀번호·시크릿은 문서에 넣지 않음)

**완료 기준:** 구매자가 받는 PDF에 코드가 실제 인쇄되고, 그 코드에서 구매자 정보를 유추할 수 없으며, 서버가 소유권과 중복 인증을 검증할 수 있어야 합니다. 단순히 DB에 코드만 저장하거나 원본 PDF 링크만 반환하는 것은 완료가 아닙니다.
