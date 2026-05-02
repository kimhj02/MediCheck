import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loginWithKakao } from '../api/auth'

/** Expo `app/login.tsx` — `state`는 `${PREFIX}.${uuid}` 또는 구버전 고정값 */
const KAKAO_OAUTH_EXPO_STATE_PREFIX = 'medichek_expo_webauth'

function isExpoInAppKakaoOAuthState(state: string | null): boolean {
  if (state == null) return false
  return (
    state === KAKAO_OAUTH_EXPO_STATE_PREFIX ||
    state.startsWith(`${KAKAO_OAUTH_EXPO_STATE_PREFIX}.`)
  )
}

export function KakaoCallbackPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login: setAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [expoInAppShell, setExpoInAppShell] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (!code) {
      setError('카카오에서 인증 코드를 받지 못했습니다.')
      return
    }

    /** Expo WebBrowser 인앱 창: 앱이 `result.url`로 code 교환·로그인 처리. 여기서 웹 API·홈 이동 하면 전체 SPA가 뜸 */
    if (isExpoInAppKakaoOAuthState(state)) {
      setExpoInAppShell(true)
      return
    }

    const redirectUri = `${window.location.origin}/oauth/kakao/callback`

    ;(async () => {
      try {
        const { token } = await loginWithKakao(code, redirectUri)
        setAuth(token)
        navigate('/', { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : '카카오 로그인에 실패했습니다.')
      }
    })()
  }, [location.search, navigate, setAuth])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-4">카카오 로그인</h2>
        {error ? (
          <>
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm mb-4">
              {error}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
              >
                이전 화면으로 돌아가기
              </button>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-2.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium"
              >
                다시 로그인 시도하기
              </button>
            </div>
          </>
        ) : expoInAppShell ? (
          <p className="text-sm text-gray-600">
            앱에서 로그인을 마무리하고 있습니다. 잠시 후 이 창이 닫히면 앱 화면으로 돌아갑니다.
          </p>
        ) : (
          <p className="text-sm text-gray-600">카카오 계정으로 로그인 중입니다...</p>
        )}
      </div>
    </div>
  )
}

