# 학습지 난이도 3단계 지원 요청

관리자 등록·수정 선택지 및 목록 표시는 하 / 중 / 상으로 변경했습니다.

| 화면 | API 값 |
|---|---|
| 하 | easy |
| 중 | normal |
| 상 | hard |

현재 확인한 BE 소스는 easy / hard만 허용하므로 normal 저장을 위해 아래 반영이 필요합니다.

1. AdminController의 학습지 생성 및 수정 difficulty 검증에 normal 허용.
2. CatalogController의 활동지 목록 검색 difficulty 검증에 normal 허용.
3. DB activities.ck_activities_difficulty CHECK에 normal 추가. 기존 V1 수정 대신 새 Flyway 마이그레이션으로 기존 데이터 보존. 운영 MySQL 버전에 맞는 제약 변경 구문 사용.
4. API_SPEC의 difficulty enum 및 Swagger 명세를 easy / normal / hard로 갱신.
5. normal로 등록·수정·목록 필터 성공과 잘못된 난이도 거절 테스트 후 배포.

기존 easy / hard 데이터는 각각 하 / 상으로 유지하며 일괄 변환은 필요 없습니다. FE 옵션 추가만으로 배포 API와 DB가 변경되지는 않습니다.
