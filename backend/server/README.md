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
