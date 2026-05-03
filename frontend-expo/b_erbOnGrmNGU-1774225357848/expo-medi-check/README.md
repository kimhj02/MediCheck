# MediCheck Expo (React Native)

심평원·건보 공공데이터 기반 안심 병원 찾기 - React Native (Expo) 앱

## 사전 요구사항

- Node.js 18+
- 백엔드 서버 실행 중 (`backend/server` → `http://localhost:8080`)
- iOS 시뮬레이터 / Android 에뮬레이터 / 실제 기기

## 설치 및 실행

```bash
# 의존성 설치
npm install

# API URL 설정 (선택)
cp .env.example .env
# .env에서 EXPO_PUBLIC_API_URL 수정 (실제 기기 테스트 시 개발 PC IP 사용)

# 앱 실행
npm start
# iOS: npm run ios
# Android: npm run android

# iOS 시뮬레이터만 쓸 때 Metro 끊김(Stream end / 1001) 줄이기
npm run start:sim
# (필요 시) 캐시 초기화: npx expo start --localhost --clear
```

## API 서버 주소

| 환경 | URL |
|------|-----|
| iOS 시뮬레이터 | `http://localhost:8080/api` |
| Android 에뮬레이터 | `http://10.0.2.2:8080/api` |
| 실제 기기 | `http://<개발PC_IP>:8080/api` (예: `http://192.168.0.10:8080/api`) |

`.env` 파일에 `EXPO_PUBLIC_API_URL`을 설정하거나, `app.config.js`의 `extra.apiUrl`을 수정하세요.

## 카카오맵 (내 주변 탭)

**카카오 JavaScript 키**가 있으면 **카카오 JavaScript API v2**를 `WebView`로 띄웁니다. 없으면 **react-native-maps**로 동작합니다.

키는 다음 순서로 읽습니다: `EXPO_PUBLIC_KAKAO_MAP_APP_KEY` → **`frontend/.env`의 `VITE_KAKAO_APP_KEY`**(웹 지도와 동일).

1. [카카오 디벨로퍼스](https://developers.kakao.com/) → **앱 키**에서 **JavaScript 키** 사용 (REST API 키와 다름)
2. **플랫폼**에 **「Web」** 이 없으면 추가 → **사이트 도메인**에 **`https://localhost`** 를 넣고 저장  
   - 웹(Vite)만 쓸 때 `http://localhost:5173`만 등록했다면, **앱 WebView용으로 `https://localhost`는 별도로 추가**해야 합니다.  
   - `app.config.js`의 `kakaoMapBaseUrl`(기본 `https://localhost`)과 **글자 하나라도 다르면** 지도가 회색으로 안 뜹니다. 바꿀 경우 `.env`에 `EXPO_PUBLIC_KAKAO_MAP_BASE_URL`로 동일 값을 맞추세요.
3. `frontend/.env`의 `VITE_KAKAO_APP_KEY`를 쓰면 키는 자동 연동됩니다. Metro 재시작 후에도 회색이면 상단 빨간 안내 또는 `npx expo start --clear`로 캐시를 비워 보세요.

키를 바꾼 뒤에는 `npx expo start --clear`로 캐시를 비우는 것이 안전합니다.

## 카카오 로그인 (Expo Go · 개발 빌드 · 스토어 빌드)

### Expo Go (`StoreClient`)

`exp://` 는 카카오 콘솔에 넣기 어렵습니다.

- **iOS**: `auth.expo.io` 프록시 카카오 플로우는 쿠키·Safari 정책 때문에 **완료되지 않는 경우가 많습니다.** 앱은 **`EXPO_PUBLIC_KAKAO_OAUTH_REDIRECT_ORIGIN`(예: `https://medicheck.life`)** 가 있을 때 **`https://…/oauth/kakao/callback`** 을 `redirect_uri`로 쓰고, **Safari 뷰(`openBrowserAsync`) + `Linking`** 으로 돌아옵니다. 운영 프론트의 **`/oauth/kakao/callback`** 은 `state`에 넣은 `exp://` 주소로 **리다이렉트**하도록 `expo-kakao-oauth.html` 이 배포돼 있어야 합니다(저장소 `frontend/public/expo-kakao-oauth.html`, Docker 프론트 재빌드).
- **Android**: `EXPO_PUBLIC_KAKAO_OAUTH_REDIRECT_ORIGIN` 으로 **`https://…/oauth/kakao/callback`** 를 쓰면 되며, 백엔드·콘솔의 **apex/www** 와 맞추면 됩니다.

### 개발 빌드(Bare) / 스토어(Standalone)

iOS `ASWebAuthenticationSession` 이 **https 콜백 페이지(SPA)까지 연 뒤 시트가 안 닫히는** 경우가 있어, 앱은 **`medicheck://app/oauth/kakao/callback`** 을 `redirect_uri`로 씁니다. **카카오 디벨로퍼스**와 **백엔드** `KAKAO_OAUTH_ALLOWED_REDIRECT_URIS`에 **문자 그대로** 추가해야 합니다.

1. [카카오 디벨로퍼스](https://developers.kakao.com/) → **리다이렉트 URI**에 위 앱 스킴 + 웹용 `https://<도메인>/oauth/kakao/callback` 등 필요한 항목 등록.
2. **백엔드** `KAKAO_OAUTH_ALLOWED_REDIRECT_URIS`에도 동일 문자열 포함.
3. 로컬 API만 쓸 때는 `https://auth.expo.io/@<owner>/<slug>` 폴백을 쓰려면 카카오·백엔드에 그 URL도 등록.

Metro 재시작(`npx expo start --clear`) 후 다시 로그인해 보세요.

### HTTPS 콜백 후 인증 시트가 안 닫힐 때 (운영 Docker 프론트)

`frontend/nginx.conf` 는 `state` 가 Expo 접두(`medichek_expo_webauth`)이면 **`public/expo-kakao-oauth.html`** 로 내부 rewrite 해 SPA 번들을 타지 않게 합니다. **호스트 Nginx만** 쓰는 경우 동일 규칙·같은 정적 파일 서빙을 맞춰야 합니다.
