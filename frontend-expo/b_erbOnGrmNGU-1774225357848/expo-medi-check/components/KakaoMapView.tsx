import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { StyleSheet, View, Text, ActivityIndicator, ScrollView } from 'react-native'
import { WebView } from 'react-native-webview'
import Constants from 'expo-constants'
import { buildKakaoMapHtml, type KakaoMapHospitalPin } from '@/lib/kakaoMapHtml'
import type { NearbyHospital } from '@/types'

type Extra = {
  kakaoMapBaseUrl?: string
}

function getKakaoMapBaseUrl(): string {
  const url = (Constants.expoConfig?.extra as Extra | undefined)?.kakaoMapBaseUrl
  const trimmed = typeof url === 'string' ? url.trim() : ''
  return trimmed.length > 0 ? trimmed : 'https://localhost'
}

type Props = {
  /** 카카오 디벨로퍼스 JavaScript 키 */
  appKey: string
  centerLat: number
  centerLng: number
  hospitals: NearbyHospital[] | undefined
  /** 카카오 지도 확대 레벨 (숫자 클수록 멀리) */
  zoomLevel?: number
  onMarkerPress: (item: NearbyHospital) => void
}

/**
 * 카카오맵 JavaScript API v2 + MarkerClusterer (WebView)
 * 카카오 콘솔: 플랫폼 Web → 사이트 도메인 = `getKakaoMapBaseUrl()` (기본 https://localhost)
 */
export function KakaoMapView({
  appKey,
  centerLat,
  centerLng,
  hospitals,
  zoomLevel = 6,
  onMarkerPress,
}: Props) {
  const webBaseUrl = getKakaoMapBaseUrl()
  const webRef = useRef<WebView>(null)
  const [mapReady, setMapReady] = useState(false)
  const mapReadyRef = useRef(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const hospitalsRef = useRef(hospitals)
  hospitalsRef.current = hospitals

  useEffect(() => {
    mapReadyRef.current = mapReady
  }, [mapReady])

  const pins: KakaoMapHospitalPin[] = useMemo(
    () =>
      (hospitals ?? [])
        .filter(
          (h) =>
            h.hospital.latitude != null &&
            h.hospital.longitude != null &&
            !Number.isNaN(Number(h.hospital.latitude)) &&
            !Number.isNaN(Number(h.hospital.longitude))
        )
        .map((h) => ({
          id: h.hospital.id,
          lat: Number(h.hospital.latitude),
          lng: Number(h.hospital.longitude),
          name: h.hospital.name,
        })),
    [hospitals]
  )

  const html = useMemo(
    () => buildKakaoMapHtml(appKey, centerLat, centerLng, zoomLevel, pins, webBaseUrl),
    [appKey, centerLat, centerLng, zoomLevel, pins, webBaseUrl]
  )

  useEffect(() => {
    setMapReady(false)
    setLoadError(null)
  }, [html])

  /** 지도가 오래 비어 있으면(콘솔 미등록 등) 안내 */
  useEffect(() => {
    if (!appKey.trim()) return
    const t = setTimeout(() => {
      if (!mapReadyRef.current) {
        setLoadError(
          (prev) =>
            prev ??
            `지도 응답이 없습니다. 카카오 디벨로퍼스 → 플랫폼 → Web → 사이트 도메인에\n「${webBaseUrl}」을(를) 추가했는지 확인하세요.`
        )
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [appKey, html, webBaseUrl])

  useEffect(() => {
    if (!mapReady || !webRef.current) return
    const script = `(function(){
      try {
        if (window.kakaoMap && window.kakao && window.kakao.maps) {
          window.kakaoMap.setCenter(new kakao.maps.LatLng(${centerLat}, ${centerLng}));
        }
      } catch(e) {}
      true;
    })();`
    webRef.current.injectJavaScript(script)
  }, [centerLat, centerLng, mapReady])

  const onMessage = useCallback(
    (e: { nativeEvent: { data: string } }) => {
      try {
        const data = JSON.parse(e.nativeEvent.data)
        if (data.type === 'ready') {
          setLoadError(null)
          setMapReady(true)
          return
        }
        if (data.type === 'kakaoError') {
          const msg =
            typeof data.message === 'string' ? data.message : '카카오 지도 초기화 오류'
          setLoadError(`${msg}\n\n등록 도메인: ${webBaseUrl}`)
          return
        }
        if (data.type === 'marker' && data.id != null) {
          const item = hospitalsRef.current?.find((h) => h.hospital.id === data.id)
          if (item) onMarkerPress(item)
        }
      } catch {
        /* ignore */
      }
    },
    [onMarkerPress, webBaseUrl]
  )

  if (!appKey.trim()) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackText}>
          카카오 JavaScript 키가 없습니다.{'\n'}
          frontend/.env의 VITE_KAKAO_APP_KEY 또는{'\n'}
          expo-medi-check/.env의 EXPO_PUBLIC_KAKAO_MAP_APP_KEY를 넣고 Metro를 재시작하세요.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      {loadError ? (
        <View style={styles.errorBanner} pointerEvents="box-none">
          <ScrollView style={styles.errorScroll} nestedScrollEnabled>
            <Text style={styles.errorTitle}>카카오 지도를 불러오지 못했습니다</Text>
            <Text style={styles.errorBody}>{loadError}</Text>
            <Text style={styles.errorHint}>
              • 사용 키: JavaScript 키{'\n'}• 플랫폼: Web (Android/iOS 네이티브 앱 키만 있으면 JS API가 막힐 수 있음){'\n'}
              • 사이트 도메인에 반드시 「{webBaseUrl}」 추가 후 저장{'\n'}• 변경 후 앱 완전 재시작 (expo start --clear)
            </Text>
          </ScrollView>
        </View>
      ) : null}
      <WebView
        ref={webRef}
        style={styles.web}
        source={{ html, baseUrl: webBaseUrl }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        startInLoadingState
        onError={(ev) => {
          setLoadError(
            `WebView 오류: ${ev.nativeEvent.description || 'unknown'}\n등록 도메인: ${webBaseUrl}`
          )
        }}
        onHttpError={(ev) => {
          if (ev.nativeEvent.statusCode >= 400) {
            setLoadError(
              `HTTP ${ev.nativeEvent.statusCode}: ${ev.nativeEvent.description || ''}\n등록 도메인: ${webBaseUrl}`
            )
          }
        }}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#0EA5E9" />
            <Text style={styles.loadingHint}>카카오 지도 로딩 중…</Text>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  loadingHint: {
    fontSize: 13,
    color: '#64748B',
  },
  errorBanner: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    maxHeight: 220,
    zIndex: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
  },
  errorScroll: {
    maxHeight: 200,
  },
  errorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B91C1C',
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
    marginBottom: 10,
  },
  errorHint: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F1F5F9',
  },
  fallbackText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 22,
  },
})
