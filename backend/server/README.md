# MediCheck API 서버 (Spring Boot)

## 데이터베이스 비밀번호 (`DB_PASSWORD`)

`src/main/resources/application.yaml`의 MySQL 비밀번호는 **환경 변수 `DB_PASSWORD`** 로만 주입합니다.  
저장소에는 비밀번호를 두지 않습니다.

### 로컬 실행 예시

```bash
cd backend/server
export DB_PASSWORD='로컬-MySQL-비밀번호'
./gradlew bootRun --args='--spring.profiles.active=local'
```

또는 `application-local.yaml`(이 파일은 **gitignore** — 레포에 올리지 않음)에 다음을 두어 덮어쓸 수 있습니다:

```yaml
spring:
  datasource:
    password: "로컬에서만 쓰는 비밀번호"
```

### `.env.example`

이 디렉터리의 `.env.example`을 참고해 변수 이름을 맞추고, 실제 값은 `.env`에만 두세요(`.env`는 gitignore).

### CI / 운영 배포

- 파이프라인 또는 시크릿 매니저에 **`DB_PASSWORD`** 를 등록하세요.
- 예전에 Git에 평문 비밀번호가 있었다면 **DB 비밀번호를 반드시 변경**하는 것을 권장합니다.

### `prod` 프로필 (`application-prod.yaml`)

AWS 등에 배포할 때 `--spring.profiles.active=prod` 로 실행합니다.

- **DB**: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `DB_PASSWORD` (필수)
- **JWT·심평·카카오**: `application.yaml`과 동일하게 환경변수로만 주입 (`JWT_SECRET`, `HIRA_SERVICE_KEY`, `KAKAO_*` 등)
- **동기화 API**: `ADMIN_SYNC_KEY` (prod에서는 기본값 없음 — 반드시 설정)
- **CORS (SPA/CloudFront)**: `CORS_ALLOWED_ORIGINS`에 허용할 출처를 쉼표로 나열 (예: `https://d123.cloudfront.net`). 비우면 브라우저 크로스 오리진 요청에 `Access-Control-Allow-Origin`을 붙이지 않습니다.

### 테스트

- `ServerApplicationTests`는 **스키마가 준비된 MySQL**과 `DB_PASSWORD`·`JWT_SECRET` 등이 있어야 통과합니다. 로컬 DB 없이 `./gradlew test` 시 해당 한 건은 실패할 수 있습니다.
