/**
 * 카카오 OAuth redirect_uri 에 넣을 사이트 오리진.
 * www 로 접속해도 백엔드·카카오에 등록한 apex(또는 단일 캐논 URL)와 맞추려면
 * 빌드 시 `VITE_KAKAO_OAUTH_REDIRECT_ORIGIN` 을 설정한다.
 */
export function getKakaoOAuthSiteOrigin(): string {
  const raw = import.meta.env.VITE_KAKAO_OAUTH_REDIRECT_ORIGIN as string | undefined
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().replace(/\/$/, '')
  }
  return window.location.origin
}

export function getKakaoOAuthRedirectUri(): string {
  return `${getKakaoOAuthSiteOrigin()}/oauth/kakao/callback`
}
