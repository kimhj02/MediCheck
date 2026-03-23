/** Expo 앱 설정. .env에서 EXPO_PUBLIC_* 로드 (dotenv 없어도 동작) */
const path = require('path')
try {
  // 웹 프론트(frontend)와 동일한 카카오 지도 키: VITE_KAKAO_APP_KEY
  require('dotenv').config({ path: path.join(__dirname, '../../../frontend/.env') })
} catch (_) {}
try {
  require('dotenv').config()
} catch (_) {}

const appJson = require('./app.json')

module.exports = {
  expo: {
    ...appJson.expo,
    /** expo-router / Linking — scheme 없으면 createURL 등에서 경고·크래시 가능 */
    scheme: appJson.expo.scheme || 'medicheck',
    extra: {
      ...(appJson.expo.extra || {}),
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api',
      /** 카카오맵 JS 키: Expo 전용 또는 웹과 동일한 VITE_KAKAO_APP_KEY. Web 플랫폼에 https://localhost 등록 */
      kakaoMapAppKey:
        process.env.EXPO_PUBLIC_KAKAO_MAP_APP_KEY ||
        process.env.VITE_KAKAO_APP_KEY ||
        '',
      /**
       * WebView document origin. 카카오 콘솔 Web 사이트 도메인과 반드시 일치 (기본 https://localhost)
       * 안 되면 http://localhost 로 바꾸고 콘솔에도 동일하게 등록해 보세요.
       */
      kakaoMapBaseUrl:
        process.env.EXPO_PUBLIC_KAKAO_MAP_BASE_URL || 'https://localhost',
    },
  },
}
