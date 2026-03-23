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
