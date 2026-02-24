import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { NearbyHospital } from '../types/hospital'
import { buildInfoWindowHtml } from './HospitalInfoWindow'
import { fetchDirections } from '../api/directions'
import { addFavoriteHospital, removeFavoriteHospital } from '../api/hospitals'
import { useAuth } from '../contexts/AuthContext'
import { formatDistance, formatDuration } from '../utils/format'

declare const kakao: {
  maps: {
    Map: new (container: HTMLElement, options: unknown) => {
      setCenter: (pos: unknown) => void
      getCenter: () => { getLat: () => number; getLng: () => number }
      setBounds: (bounds: unknown) => void
    }
    LatLng: new (lat: number, lng: number) => unknown
    LatLngBounds: new (sw: unknown, ne?: unknown) => {
      extend: (point: unknown) => void
    }
    Marker: new (options: { position: unknown; map: unknown }) => unknown
    Polyline: new (options: {
      path: unknown[]
      strokeWeight?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeStyle?: string
      map?: unknown
    }) => { setMap: (map: unknown) => void }
    CustomOverlay: new (options: {
      content: string | HTMLElement
      position: unknown
      xAnchor?: number
      yAnchor?: number
      zIndex?: number
    }) => { setMap: (map: unknown) => void }
    event: {
      addListener: (target: unknown, type: string, handler: () => void) => void
      removeListener?: (target: unknown, type: string, handler: () => void) => void
    }
  }
}

export interface HospitalMapHandle {
  panTo: (lat: number, lng: number) => void
  showHospitalPopup: (item: NearbyHospital) => void
}

interface HospitalMapProps {
  centerLat: number
  centerLng: number
  hospitals: NearbyHospital[]
}

export const HospitalMap = forwardRef<HospitalMapHandle, HospitalMapProps>(
  function HospitalMap({ centerLat, centerLng, hospitals }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<{
      setCenter: (pos: unknown) => void
      getCenter: () => { getLat: () => number; getLng: () => number }
      setBounds: (bounds: unknown) => void
    } | null>(null)
    const routePolylineRef = useRef<{ setMap: (m: unknown) => void } | null>(null)
    const [routeInfo, setRouteInfo] = useState<{ duration: number; distance: number } | null>(null)
    const overlayRef = useRef<{ setMap: (m: unknown) => void } | null>(null)
    const markersRef = useRef<Array<{ setMap: (m: unknown) => void }>>([])
    const ignoreMapClickRef = useRef(false)
    const { token } = useAuth()

    const panToWithAnimation = (targetLat: number, targetLng: number) => {
      const map = mapRef.current
      if (!map || !window.kakao?.maps) return

      const center = map.getCenter()
      const startLat = center.getLat()
      const startLng = center.getLng()

      const duration = 450
      const startTime = performance.now()

      const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = easeOutCubic(progress)

        const lat = startLat + (targetLat - startLat) * eased
        const lng = startLng + (targetLng - startLng) * eased
        map.setCenter(new kakao.maps.LatLng(lat, lng))

        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }

    const clearRoute = () => {
      setRouteInfo(null)
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null)
        routePolylineRef.current = null
      }
    }

    const showRouteOnMap = async (destLat: number, destLng: number) => {
      const map = mapRef.current
      if (!map || !window.kakao?.maps) return
      clearRoute()
      try {
        const res = await fetchDirections(centerLat, centerLng, destLat, destLng)
        const path = res.path
        if (!path || path.length < 2) return

        const linePath = path.map(([lat, lng]) => new kakao.maps.LatLng(lat, lng))
        const polyline = new kakao.maps.Polyline({
          path: linePath,
          strokeWeight: 5,
          strokeColor: '#0ea5e9',
          strokeOpacity: 0.9,
          strokeStyle: 'solid',
          map,
        })
        routePolylineRef.current = polyline

        const bounds = new kakao.maps.LatLngBounds(linePath[0], linePath[0])
        linePath.forEach((p) => bounds.extend(p))
        map.setBounds(bounds)

        setRouteInfo({ duration: res.duration, distance: res.distance })
      } catch (err) {
        const msg = err instanceof Error ? err.message : '경로를 불러올 수 없습니다'
        if (msg.includes('설정되지') || msg.includes('503')) {
          alert('길찾기 API가 설정되지 않았습니다. 카카오맵/네이버지도 버튼을 이용해 주세요.')
        } else {
          alert(msg)
        }
      }
    }

    useImperativeHandle(ref, () => ({
      panTo(lat: number, lng: number) {
        panToWithAnimation(lat, lng)
      },
      showHospitalPopup(item: NearbyHospital) {
        const h = item.hospital
        const lat = h.latitude ?? 0
        const lng = h.longitude ?? 0
        if (lat === 0 && lng === 0) return
        if (!mapRef.current || !window.kakao?.maps) return

        clearRoute()
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
          overlayRef.current = null
        }

        const overlay = new kakao.maps.CustomOverlay({
          content: buildInfoWindowHtml({ hospital: h, distanceMeters: item.distanceMeters }),
          position: new kakao.maps.LatLng(lat, lng),
          xAnchor: 0.5,
          yAnchor: 1.2,
          zIndex: 10,
        })
        overlay.setMap(mapRef.current as unknown)
        overlayRef.current = overlay

        panToWithAnimation(lat, lng)
      },
    }), [])

    useEffect(() => {
      if (!containerRef.current || !window.kakao?.maps) return

      const map = new kakao.maps.Map(containerRef.current, {
        center: new kakao.maps.LatLng(centerLat, centerLng),
        level: 5,
      })
      mapRef.current = map

      // 내 위치 마커 (파란 동그라미)
      const myLocationEl = document.createElement('div')
      myLocationEl.innerHTML = `
        <div style="
          width: 20px; height: 20px;
          border-radius: 50%;
          background: #4285f4;
          border: 3px solid white;
          box-shadow: 0 1px 6px rgba(0,0,0,0.35);
        " title="내 위치"></div>
      `
      const myLocationOverlay = new kakao.maps.CustomOverlay({
        content: myLocationEl.firstElementChild as HTMLElement,
        position: new kakao.maps.LatLng(centerLat, centerLng),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 5,
      })
      myLocationOverlay.setMap(map)

      // 앱 내 길찾기 버튼 클릭 (이벤트 위임)
      const onDocClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement
        const directionsBtn = target.closest('[data-action="directions"]')
        if (directionsBtn instanceof HTMLElement) {
          const destLat = parseFloat(directionsBtn.dataset.destLat ?? '0')
          const destLng = parseFloat(directionsBtn.dataset.destLng ?? '0')
          if (destLat && destLng) showRouteOnMap(destLat, destLng)
          return
        }

        const favoriteBtn = target.closest('[data-action="favorite"]')
        if (favoriteBtn instanceof HTMLElement) {
          const idRaw = favoriteBtn.getAttribute('data-hospital-id')
          const hospitalId = idRaw ? Number(idRaw) : NaN
          if (!hospitalId || Number.isNaN(hospitalId)) return
          if (!token) {
            alert('즐겨찾기는 로그인 후 이용해 주세요.')
            return
          }
          const isActive = favoriteBtn.getAttribute('data-active') === 'true'
          favoriteBtn.setAttribute('data-active', isActive ? 'false' : 'true')
          favoriteBtn.textContent = isActive ? '★' : '★'
          ;(async () => {
            try {
              if (isActive) {
                await removeFavoriteHospital(token, hospitalId)
              } else {
                await addFavoriteHospital(token, hospitalId)
              }
            } catch (err) {
              alert(
                err instanceof Error ? err.message : '즐겨찾기 처리 중 오류가 발생했습니다.'
              )
            }
          })()
        }
      }
      document.addEventListener('click', onDocClick)

      // 빈 지도 클릭 시 병원 정보 팝업 닫기 및 경로 제거
      const onMapClick = () => {
        if (ignoreMapClickRef.current) {
          ignoreMapClickRef.current = false
          return
        }
        clearRoute()
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
          overlayRef.current = null
        }
      }
      kakao.maps.event.addListener(map, 'click', onMapClick)

      return () => {
        document.removeEventListener('click', onDocClick)
        myLocationOverlay.setMap(null)
        clearRoute()
        if (kakao.maps.event.removeListener) {
          kakao.maps.event.removeListener(map, 'click', onMapClick)
        }
        mapRef.current = null
      }
    }, [centerLat, centerLng])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !window.kakao?.maps) return

      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

      hospitals.forEach((item) => {
        const h = item.hospital
        const lat = h.latitude ?? 0
        const lng = h.longitude ?? 0
        if (lat === 0 && lng === 0) return

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(lat, lng),
          map,
        }) as { setMap: (m: unknown) => void }
        markersRef.current.push(marker)

        kakao.maps.event.addListener(marker, 'click', () => {
          ignoreMapClickRef.current = true
          if (overlayRef.current) {
            overlayRef.current.setMap(null)
            overlayRef.current = null
          }

          const overlay = new kakao.maps.CustomOverlay({
            content: buildInfoWindowHtml({ hospital: h, distanceMeters: item.distanceMeters }),
            position: new kakao.maps.LatLng(lat, lng),
            xAnchor: 0.5,
            yAnchor: 1.2,
            zIndex: 10,
          })
          overlay.setMap(map)
          overlayRef.current = overlay

          panToWithAnimation(lat, lng)
        })
      })

      return () => {
        markersRef.current.forEach((m) => m.setMap(null))
        markersRef.current = []
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
          overlayRef.current = null
        }
      }
    }, [hospitals])

    return (
      <div className="relative w-full h-full min-h-[400px]">
        <div ref={containerRef} className="w-full h-full min-h-[400px]" />
        {routeInfo && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/95 rounded-xl shadow-lg text-sm font-medium text-gray-700 z-10">
            예상 {formatDuration(routeInfo.duration)} · {formatDistance(routeInfo.distance)}
          </div>
        )}
      </div>
    )
  }
)
