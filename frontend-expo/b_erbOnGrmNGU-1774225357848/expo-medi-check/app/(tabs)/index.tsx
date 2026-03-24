import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Platform,
} from 'react-native'
import MapView, { Marker, Region } from 'react-native-maps'
import Constants from 'expo-constants'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getNearbyHospitals } from '@/lib/api'
import { NearbyHospital } from '@/types'
import HospitalCard from '@/components/HospitalCard'
import { MapPlaceMarker } from '@/components/MapPlaceMarker'
import { KakaoMapView, type KakaoMapViewHandle } from '@/components/KakaoMapView'
import { RADIUS_OPTIONS, DEFAULT_RADIUS_METERS } from '@/lib/radiusOptions'
import {
  PRESET_OKGYE_HEUNGAN_46_LAT,
  PRESET_OKGYE_HEUNGAN_46_LNG,
} from '@/lib/presetTestLocation'
import { GOOGLE_MAP_HIDE_POI_STYLE } from '@/lib/mapHidePoiStyle'

const { height } = Dimensions.get('window')

/** FlatList scrollToIndex용 대략적 행 높이(카드+margin) — onScrollToIndexFailed 시에도 사용 */
const ESTIMATED_HOSPITAL_LIST_ROW = 200

/** 네이티브 MapView 줌 한계 (위·경도 델타) */
const MAP_MIN_LAT_DELTA = 0.0007
const MAP_MAX_LAT_DELTA = 0.85
/** 버튼 줌 애니메이션 (ms) — 짧으면 뚝 끊기는 느낌이 나서 여유 있게 둠 */
const MAP_ZOOM_ANIM_MS = 580
/** 한 번 탭당 델타 변화 비율 (작을수록 한 단계가 작아져 더 자연스러움) */
const MAP_ZOOM_IN_FACTOR = 0.78
const MAP_ZOOM_OUT_FACTOR = 1.32

function coordsToLocation(lat: number, lng: number): Location.LocationObject {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  }
}

const kakaoMapAppKey =
  (Constants.expoConfig?.extra as { kakaoMapAppKey?: string } | undefined)
    ?.kakaoMapAppKey ?? ''

export default function MapScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const useKakaoMap = kakaoMapAppKey.trim().length > 0
  const mapRef = useRef<MapView>(null)
  const kakaoMapRef = useRef<KakaoMapViewHandle>(null)
  const lastRegionRef = useRef<Region | null>(null)
  const hospitalListRef = useRef<FlatList<NearbyHospital>>(null)
  /** 마커 → 상세 진입 후 복귀 시에만 리스트 스크롤 */
  const pendingListScrollRef = useRef(false)
  const locationRef = useRef<Location.LocationObject | null>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [region, setRegion] = useState<Region | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<NearbyHospital | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS)

  const applyLocation = useCallback((loc: Location.LocationObject) => {
    setErrorMsg(null)
    locationRef.current = loc
    setLocation(loc)
    const next: Region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }
    setRegion(next)
    lastRegionRef.current = next
    if (!useKakaoMap) {
      requestAnimationFrame(() => {
        mapRef.current?.animateToRegion(next, 500)
      })
    }
  }, [useKakaoMap])

  const fetchGpsLocation = useCallback(async (): Promise<boolean> => {
    setLocating(true)
    const hadLocation = !!locationRef.current
    if (!hadLocation) setErrorMsg(null)
    try {
      const servicesOn = await Location.hasServicesEnabledAsync()
      if (!servicesOn) {
        const msg = '기기에서 위치 서비스(GPS)를 켜 주세요.'
        if (hadLocation) Alert.alert('위치', msg)
        else setErrorMsg(msg)
        return false
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        const msg = '설정에서 위치 권한을 허용해 주세요.'
        if (hadLocation) Alert.alert('위치 권한', msg)
        else setErrorMsg(msg)
        return false
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      })
      applyLocation(loc)
      return true
    } catch {
      const msg = '현재 위치를 가져오지 못했습니다. 다시 시도해 주세요.'
      if (hadLocation) Alert.alert('위치', msg)
      else setErrorMsg(msg)
      return false
    } finally {
      setLocating(false)
    }
  }, [applyLocation])

  useEffect(() => {
    fetchGpsLocation()
  }, [fetchGpsLocation])

  const { data: hospitals, isLoading, isError, error } = useQuery({
    queryKey: [
      'nearbyHospitals',
      location?.coords.latitude,
      location?.coords.longitude,
      radiusMeters,
    ],
    queryFn: () =>
      getNearbyHospitals(
        location!.coords.latitude,
        location!.coords.longitude,
        radiusMeters
      ),
    enabled: !!location,
  })

  const handleMarkerPress = useCallback(
    (nearby: NearbyHospital) => {
      setSelectedHospital(nearby)
      pendingListScrollRef.current = true
      router.push(`/hospital/${nearby.hospital.id}`)
    },
    [router]
  )

  useFocusEffect(
    useCallback(() => {
      if (!pendingListScrollRef.current || !selectedHospital || !hospitals?.length) {
        return
      }
      const index = hospitals.findIndex(
        (h) => h.hospital.id === selectedHospital.hospital.id
      )
      if (index < 0) {
        pendingListScrollRef.current = false
        return
      }
      pendingListScrollRef.current = false

      const scroll = () => {
        hospitalListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.15,
        })
      }
      const t = setTimeout(scroll, 120)
      return () => clearTimeout(t)
    }, [selectedHospital, hospitals])
  )

  /** GPS 다시 읽고 지도 이동 */
  const handleRecenter = useCallback(() => {
    fetchGpsLocation()
  }, [fetchGpsLocation])

  const handleZoomIn = useCallback(() => {
    if (useKakaoMap) {
      kakaoMapRef.current?.zoomIn()
      return
    }
    const r = lastRegionRef.current
    if (!r || !mapRef.current) return
    const next: Region = {
      ...r,
      latitudeDelta: Math.max(r.latitudeDelta * MAP_ZOOM_IN_FACTOR, MAP_MIN_LAT_DELTA),
      longitudeDelta: Math.max(r.longitudeDelta * MAP_ZOOM_IN_FACTOR, MAP_MIN_LAT_DELTA),
    }
    lastRegionRef.current = next
    mapRef.current.animateToRegion(next, MAP_ZOOM_ANIM_MS)
  }, [useKakaoMap])

  const handleZoomOut = useCallback(() => {
    if (useKakaoMap) {
      kakaoMapRef.current?.zoomOut()
      return
    }
    const r = lastRegionRef.current
    if (!r || !mapRef.current) return
    const next: Region = {
      ...r,
      latitudeDelta: Math.min(r.latitudeDelta * MAP_ZOOM_OUT_FACTOR, MAP_MAX_LAT_DELTA),
      longitudeDelta: Math.min(r.longitudeDelta * MAP_ZOOM_OUT_FACTOR, MAP_MAX_LAT_DELTA),
    }
    lastRegionRef.current = next
    mapRef.current.animateToRegion(next, MAP_ZOOM_ANIM_MS)
  }, [useKakaoMap])

  const handleUsePresetOkgye = useCallback(() => {
    applyLocation(
      coordsToLocation(PRESET_OKGYE_HEUNGAN_46_LAT, PRESET_OKGYE_HEUNGAN_46_LNG)
    )
  }, [applyLocation])

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Ionicons name="location-outline" size={48} color="#94A3B8" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchGpsLocation()}>
            <Text style={styles.retryBtnText}>다시 시도</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsBtnText}>설정 열기</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hintMuted}>
          iOS 시뮬레이터: Features → Location → Custom Location → 위도 {PRESET_OKGYE_HEUNGAN_46_LAT},
          경도 {PRESET_OKGYE_HEUNGAN_46_LNG} (옥계 흥안로 46 부근)
        </Text>
        <TouchableOpacity style={styles.gumiLink} onPress={handleUsePresetOkgye}>
          <Text style={styles.gumiLinkText}>옥계 흥안로 46으로 이동 (테스트)</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!location || !region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>현재 위치를 가져오는 중...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {useKakaoMap ? (
        <KakaoMapView
          ref={kakaoMapRef}
          appKey={kakaoMapAppKey}
          centerLat={region.latitude}
          centerLng={region.longitude}
          hospitals={hospitals}
          zoomLevel={6}
          onMarkerPress={handleMarkerPress}
        />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onRegionChangeComplete={(r) => {
            lastRegionRef.current = r
          }}
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
          /** 앱 병원 마커와 지도 기본 POI(병원·상점 아이콘) 겹침 완화 — 카카오 WebView 지도는 API로 POI 끄기 불가 */
          showsPointsOfInterest={false}
          customMapStyle={
            Platform.OS === 'android' ? GOOGLE_MAP_HIDE_POI_STYLE : undefined
          }
        >
          {hospitals?.map((item) => (
            <Marker
              key={item.hospital.id}
              coordinate={{
                latitude: item.hospital.latitude ?? 0,
                longitude: item.hospital.longitude ?? 0,
              }}
              onPress={() => handleMarkerPress(item)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <MapPlaceMarker hospital={item.hospital} />
            </Marker>
          ))}
        </MapView>
      )}

      <View
        style={[
          styles.mapControlsColumn,
          { top: 8, right: insets.right + 10 },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={handleZoomIn}
          accessibilityRole="button"
          accessibilityLabel="지도 확대"
        >
          <Ionicons name="add" size={26} color="#0EA5E9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={handleZoomOut}
          accessibilityRole="button"
          accessibilityLabel="지도 축소"
        >
          <Ionicons name="remove" size={26} color="#0EA5E9" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapControlBtn}
          onPress={handleRecenter}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
        >
          {locating ? (
            <ActivityIndicator size="small" color="#0EA5E9" />
          ) : (
            <Ionicons name="locate" size={22} color="#0EA5E9" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>
          주변 병원 {hospitals?.length ?? 0}곳
        </Text>

        <Text style={styles.radiusSectionLabel}>검색 반경</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((opt) => {
            const selected = radiusMeters === opt.value
            return (
              <TouchableOpacity
                key={opt.value}
                activeOpacity={0.85}
                style={[styles.radiusChip, selected && styles.radiusChipActive]}
                onPress={() => setRadiusMeters(opt.value)}
              >
                <Text
                  style={[styles.radiusChipText, selected && styles.radiusChipTextActive]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {isError && (
          <Text style={styles.apiError}>
            병원 정보를 불러오지 못했습니다. 백엔드(8080)가 켜져 있는지 확인해 주세요.
            {error instanceof Error ? `\n${error.message}` : ''}
          </Text>
        )}

        {!isLoading &&
          !isError &&
          (hospitals?.length ?? 0) === 0 && (
            <Text style={styles.zeroHint}>
              이 반경에 등록된 병원이 없습니다. 반경을 넓히거나, 시뮬레이터 위치가 샌프란시스코
              등 기본값이면 DB(한국)와 맞지 않을 수 있습니다. 「옥계 흥안로 테스트」로 맞춰 보세요.
            </Text>
          )}

        <TouchableOpacity style={styles.gumiMini} onPress={handleUsePresetOkgye}>
          <Text style={styles.gumiMiniText}>옥계 흥안로 46으로 이동 (테스트)</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator size="small" color="#0EA5E9" />
        ) : (
          <FlatList
            ref={hospitalListRef}
            style={styles.hospitalList}
            data={hospitals}
            keyExtractor={(item) => String(item.hospital.id)}
            renderItem={({ item }) => (
              <HospitalCard
                hospital={item.hospital}
                distance={item.distanceMeters}
                onPress={() => router.push(`/hospital/${item.hospital.id}`)}
                isSelected={selectedHospital?.hospital.id === item.hospital.id}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            getItemLayout={(_, index) => ({
              length: ESTIMATED_HOSPITAL_LIST_ROW,
              offset: ESTIMATED_HOSPITAL_LIST_ROW * index,
              index,
            })}
            onScrollToIndexFailed={({ index }) => {
              hospitalListRef.current?.scrollToOffset({
                offset: Math.max(0, index * ESTIMATED_HOSPITAL_LIST_ROW),
                animated: true,
              })
            }}
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  map: {
    flex: 1,
  },
  mapControlsColumn: {
    position: 'absolute',
    zIndex: 10,
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
  },
  mapControlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  hospitalList: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.42,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  retryBtn: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingsBtn: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  hintMuted: {
    marginTop: 20,
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  gumiLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  gumiLinkText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  radiusSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  radiusRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'stretch',
    marginBottom: 10,
    columnGap: 4,
  },
  radiusChip: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 5,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radiusChipActive: {
    backgroundColor: '#0EA5E9',
    borderColor: '#0284C7',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  radiusChipTextActive: {
    color: '#FFFFFF',
  },
  apiError: {
    fontSize: 12,
    color: '#DC2626',
    marginBottom: 8,
  },
  zeroHint: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  gumiMini: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  gumiMiniText: {
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '600',
  },
})
