import { useState, useEffect, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
  /** 최신 위치로 다시 조회 (길찾기 등에서 출발지 정확도 향상) */
  refetch: () => Promise<{ latitude: number; longitude: number } | null>
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<Omit<GeolocationState, 'refetch'>>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  })

  const fetchPosition = useCallback(() => {
    return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        setState((s) => ({ ...s, loading: false, error: '브라우저가 위치 기능을 지원하지 않습니다.' }))
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setState((s) => ({
            ...s,
            latitude: lat,
            longitude: lng,
            loading: false,
            error: null,
          }))
          resolve({ latitude: lat, longitude: lng })
        },
        (err) => {
          setState((s) => ({
            ...s,
            latitude: null,
            longitude: null,
            loading: false,
            error: err.message || '위치를 가져올 수 없습니다.',
          }))
          resolve(null)
        }
      )
    })
  }, [])

  useEffect(() => {
    fetchPosition()
  }, [fetchPosition])

  const refetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    const result = await fetchPosition()
    return result
  }, [fetchPosition])

  return { ...state, refetch }
}
