import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { NearbyHospital } from '../types/hospital'
import { buildInfoWindowHtml } from './HospitalInfoWindow'

declare const kakao: {
  maps: {
    Map: new (container: HTMLElement, options: unknown) => {
      setCenter: (pos: unknown) => void
      getCenter: () => { getLat: () => number; getLng: () => number }
    }
    LatLng: new (lat: number, lng: number) => unknown
    Marker: new (options: { position: unknown; map: unknown }) => unknown
    CustomOverlay: new (options: {
      content: string | HTMLElement
      position: unknown
      xAnchor?: number
      yAnchor?: number
      zIndex?: number
    }) => { setMap: (map: unknown) => void }
    event: { addListener: (target: unknown, type: string, handler: () => void) => void }
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
    } | null>(null)
    const overlayRef = useRef<{ setMap: (m: unknown) => void } | null>(null)
    const ignoreMapClickRef = useRef(false)

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

      // 빈 지도 클릭 시 병원 정보 팝업 닫기 (마커 클릭 직후는 제외)
      const onMapClick = () => {
        if (ignoreMapClickRef.current) {
          ignoreMapClickRef.current = false
          return
        }
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
          overlayRef.current = null
        }
      }
      kakao.maps.event.addListener(map, 'click', onMapClick)

      return () => {
        myLocationOverlay.setMap(null)
        kakao.maps.event.removeListener(map, 'click', onMapClick)
        mapRef.current = null
      }
    }, [centerLat, centerLng])

    useEffect(() => {
      const map = mapRef.current
      if (!map || !window.kakao?.maps) return

      const cleanup = () => {
        if (overlayRef.current) {
          overlayRef.current.setMap(null)
          overlayRef.current = null
        }
      }

      hospitals.forEach((item) => {
        const h = item.hospital
        const lat = h.latitude ?? 0
        const lng = h.longitude ?? 0
        if (lat === 0 && lng === 0) return

        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(lat, lng),
          map,
        })

        kakao.maps.event.addListener(marker, 'click', () => {
          ignoreMapClickRef.current = true
          cleanup()

          const overlay = new kakao.maps.CustomOverlay({
            content: buildInfoWindowHtml({ hospital: h, distanceMeters: item.distanceMeters }),
            position: new kakao.maps.LatLng(lat, lng),
            xAnchor: 0.5,
            yAnchor: 1.2,
            zIndex: 10,
          })
          overlay.setMap(map)
          overlayRef.current = overlay
        })
      })

      return cleanup
    }, [hospitals])

    return <div ref={containerRef} className="w-full h-full min-h-[400px]" />
  }
)
