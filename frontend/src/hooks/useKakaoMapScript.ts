import { useEffect, useState } from 'react'

declare global {
  interface Window {
    kakao?: {
      maps: {
        load: (callback: () => void) => void
      }
    }
  }
}

export function useKakaoMapScript() {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_APP_KEY
    if (!key) {
      setError('VITE_KAKAO_APP_KEY가 설정되지 않았습니다.')
      return
    }
    if (window.kakao?.maps) {
      setLoaded(true)
      return
    }
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
    script.async = true
    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => setLoaded(true))
      } else {
        setError('카카오 지도 초기화 실패')
      }
    }
    script.onerror = () => setError('카카오 지도 스크립트 로드 실패')
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])

  return { loaded, error }
}
