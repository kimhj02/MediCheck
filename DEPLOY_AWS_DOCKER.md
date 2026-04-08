# AWS + Docker 배포 가이드

이 문서는 EC2 서버 1대 + 외부 MySQL(RDS) 기준 배포 절차입니다.

## 1) 서버 준비

EC2(Ubuntu)에서 Docker/Compose 설치:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

재로그인 후 확인:

```bash
docker --version
docker compose version
```

## 2) 환경변수 파일 준비

프로젝트 루트에서:

```bash
cp .env.aws.example .env.aws
cp backend/server/.env.prod.example backend/server/.env.prod
```

`backend/server/.env.prod`에 운영 값 입력:

- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` (최소 32바이트 이상 권장)
- `ADMIN_SYNC_KEY`
- `HIRA_SERVICE_KEY`, `KAKAO_*`
- `CORS_ALLOWED_ORIGINS` (프론트 도메인)

`.env.aws`에는 포트와 Vite 빌드 변수 입력:

- `BACKEND_PORT`, `FRONTEND_PORT`
- `VITE_KAKAO_APP_KEY`, `VITE_KAKAO_REST_API_KEY`

## 3) 실행

```bash
docker compose --env-file .env.aws -f docker-compose.aws.yml up -d --build
```

상태 확인:

```bash
docker compose --env-file .env.aws -f docker-compose.aws.yml ps
docker compose --env-file .env.aws -f docker-compose.aws.yml logs -f backend
docker compose --env-file .env.aws -f docker-compose.aws.yml logs -f frontend
```

중지/재시작:

```bash
docker compose --env-file .env.aws -f docker-compose.aws.yml down
docker compose --env-file .env.aws -f docker-compose.aws.yml up -d
```

## 4) 네트워크/보안 체크

- EC2 보안그룹 인바운드: `80`(필수), `443`(TLS 사용 시), `22`(운영자 IP 제한)
- `8080`은 외부 공개 불필요 (백엔드는 컨테이너 내부 통신 중심)
- RDS 보안그룹에서 EC2 SG만 DB 포트 접근 허용

## 5) 배포 후 점검

- 프론트 접속: `http://<EC2_PUBLIC_IP>/`
- API 점검: `http://<EC2_PUBLIC_IP>/api/actuator/health` 또는 주요 API
- CORS 오류 발생 시 `CORS_ALLOWED_ORIGINS` 값 재확인

## 6) 운영 권장사항

- 실제 운영은 Route53 + ACM + ALB(or Nginx + Certbot)로 HTTPS 적용 권장
- 민감한 시크릿은 AWS SSM Parameter Store/Secrets Manager 사용 권장
