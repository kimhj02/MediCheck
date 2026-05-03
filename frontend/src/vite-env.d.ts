/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_APP_KEY: string
  /** 카카오 redirect_uri 호스트(apex). 미설정 시 `window.location.origin` */
  readonly VITE_KAKAO_OAUTH_REDIRECT_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
