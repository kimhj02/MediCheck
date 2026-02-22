# MediCheck
심평원·건보 공공데이터 기반 안심 병원 찾기 서비스 (LBS Healthcare Platform)

## 로컬 실행

### Backend (Spring Boot)
- 실행 시 `--spring.profiles.active=local` 인자 필수 (`application-local.yaml`의 admin.sync-key 등 사용)
- VS Code: `com.medicheck.server.ServerApplication` Run, args에 `--spring.profiles.active=local` 설정
- IntelliJ: Run Configuration VM options 또는 Program arguments에 `--spring.profiles.active=local` 추가

### Frontend (React + Vite)
1. `frontend/.env` 생성 후 `VITE_KAKAO_APP_KEY=카카오_JavaScript_키` 설정 (`.env.example` 참고)
2. 카카오 디벨로퍼스에서 웹 플랫폼에 `http://localhost:5173` 등록
3. `cd frontend && npm install && npm run dev`
4. Backend가 `localhost:8080`에서 실행 중이어야 API 연동됨 (프록시)
