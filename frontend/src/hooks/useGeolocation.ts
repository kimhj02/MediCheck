import { useState, useEffect } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, loading: false, error: '브라우저가 위치 기능을 지원하지 않습니다.' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState({
          latitude: null,
          longitude: null,
          loading: false,
          error: err.message || '위치를 가져올 수 없습니다.',
        })
      }
    )
  }, [])

  return state
}
