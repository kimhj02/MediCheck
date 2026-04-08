# MediCheck

심평원/건보 공공데이터를 활용해 사용자 위치 기반으로 병원을 탐색하고, 길찾기/리뷰/즐겨찾기를 제공하는 헬스케어 웹 서비스입니다.

## 프로젝트 개요

- **목표**: 위치 기반 병원 탐색과 신뢰 가능한 병원 정보 제공
- **아키텍처**: `React + Vite` 프론트엔드, `Spring Boot` 백엔드, `MySQL` 데이터베이스
- **외부 연동**:
  - 카카오맵(JavaScript SDK), 카카오모빌리티 길찾기 API
  - 카카오 OAuth 로그인
  - 건강보험심사평가원(HIRA) Open API
- **배포 방식**: AWS EC2 + Docker Compose (`docker-compose.aws.yml`)

## 주요 기능

- **지도 기반 병원 조회**: 사용자 현재 위치 근처 병원 목록/상세 조회
- **경로 안내**: 출발지-목적지 기준 길찾기 경로/거리/소요 시간 조회
- **회원 기능**: 로그인, 회원가입, 카카오 소셜 로그인
- **리뷰 기능**: 병원 리뷰 조회/작성/수정/삭제
- **즐겨찾기**: 사용자별 관심 병원 저장 및 조회
- **운영 안전장치**:
  - JWT 기반 인증
  - CORS 허용 출처 제어
  - 길찾기 API Rate Limit(IP별 + 전역)

## 기술 스택

- **Frontend**: React 19, TypeScript, Vite, React Router, React Query, Tailwind CSS
- **Backend**: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, Flyway
- **Infra**: Docker, Docker Compose, AWS EC2 (with RDS)

## 저장소 구조

```text
MediCheck/
├─ backend/
│  └─ server/                  # Spring Boot API 서버
├─ frontend/                   # React + Vite 웹 프론트
├─ frontend-expo/              # Expo 관련 리소스
├─ scripts/
│  ├─ ec2/bootstrap.sh         # EC2 초기 설치 스크립트
│  └─ deploy/redeploy.sh       # 다운타임 최소화 재배포 스크립트
├─ docker-compose.aws.yml      # AWS 배포용 Compose
└─ DEPLOY_AWS_DOCKER.md        # AWS 배포 상세 가이드
```

## 빠른 시작 (로컬 개발)

### 0) MySQL 준비 (필수)

`application.yaml` 기준 기본 DB 연결 정보는 아래와 같습니다.

- Host: `localhost`
- Port: `3306`
- DB: `medi_check`
- User: `root`
- Password: `DB_PASSWORD` 환경변수로 주입

로컬에 MySQL이 없다면 Docker로 빠르게 실행할 수 있습니다.

```bash
docker run -d \
  --name medicheck-mysql \
  -e MYSQL_ROOT_PASSWORD=your_local_password \
  -e MYSQL_DATABASE=medi_check \
  -p 3306:3306 \
  mysql:8.4
```

이후 백엔드 실행 전에 `DB_PASSWORD=your_local_password`를 맞춰 주세요.

### 1) 백엔드 실행

```bash
cd backend/server
cp .env.example .env
# .env 에 DB_PASSWORD 등 필요한 값 입력
set -a && source .env && set +a
./gradlew bootRun --args='--spring.profiles.active=local'
```

백엔드 환경변수 핵심:
- 필수: `DB_PASSWORD`, `JWT_SECRET`
- 선택/기능별: `KAKAO_MOBILITY_REST_API_KEY`, `HIRA_SERVICE_KEY`, `KAKAO_OAUTH_REST_API_KEY`, `KAKAO_OAUTH_CLIENT_SECRET`

### 2) 프론트엔드 실행

```bash
cd frontend
cp .env.example .env
# .env 에 VITE_KAKAO_APP_KEY 입력
npm install
npm run dev
```

- 기본 개발 서버: `http://localhost:5173`
- 프론트의 `/api` 요청은 Vite Proxy로 `http://localhost:8080` 백엔드에 전달됩니다.

## 환경변수 정리

### 백엔드 (`backend/server`)

- 템플릿: `.env.example`, `.env.prod.example`
- 운영에서 필수:
  - `SPRING_DATASOURCE_URL`
  - `SPRING_DATASOURCE_USERNAME`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `ADMIN_SYNC_KEY`
- 운영 권장:
  - `CORS_ALLOWED_ORIGINS` (예: `https://your-domain.com`)
  - `HIRA_SERVICE_KEY`, `KAKAO_*`

### 프론트엔드 (`frontend`)

- 템플릿: `.env.example`
- 주요 변수:
  - `VITE_KAKAO_APP_KEY`

## AWS + Docker 배포

상세 문서는 `DEPLOY_AWS_DOCKER.md`를 참고하세요.

핵심 절차(EC2 + 외부 MySQL/RDS 기준):

```bash
# 1) EC2 초기 설치 (Ubuntu)
bash scripts/ec2/bootstrap.sh

# 2) 배포용 env 준비
cp .env.aws.example .env.aws
cp backend/server/.env.prod.example backend/server/.env.prod

# 3) 최초 배포
docker compose --env-file .env.aws -f docker-compose.aws.yml up -d --build

# 4) 재배포 (다운타임 최소화)
bash scripts/deploy/redeploy.sh
```

### 배포 시 DB 구성 옵션

- **권장(운영)**: AWS RDS(MySQL) 사용
  - `backend/server/.env.prod`의 `SPRING_DATASOURCE_URL`을 RDS 엔드포인트로 설정
  - 예: `jdbc:mysql://<rds-endpoint>:3306/medi_check?...`
- **대안(단일 EC2 테스트/소규모)**: EC2 내부 MySQL 컨테이너/직접 설치
  - 이 경우에도 `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `DB_PASSWORD`는 반드시 실제 DB와 일치해야 합니다.
  - 단, 운영 안정성/백업/복구 측면에서 RDS 구성을 권장합니다.

## 운영 시 체크 포인트

- 보안그룹: `FRONTEND_PORT`(기본 `8080`)와 `443` 공개, `22`는 운영자 IP로 제한
- DB 접근: RDS는 EC2 보안그룹만 허용
- 시크릿 관리: `.env` 파일은 커밋 금지, 가능하면 AWS SSM/Secrets Manager 사용
- CORS 오류 시 `CORS_ALLOWED_ORIGINS` 값 우선 점검

## 참고 문서

- 백엔드 상세: `backend/server/README.md`
- AWS 배포 가이드: `DEPLOY_AWS_DOCKER.md`
