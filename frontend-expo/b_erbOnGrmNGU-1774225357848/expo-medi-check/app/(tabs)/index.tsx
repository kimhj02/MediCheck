import { useEffect, useState, useRef, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  Linking,
  Alert,
} from 'react-native'
import MapView, { Marker, Region } from 'react-native-maps'
import Constants from 'expo-constants'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getNearbyHospitals } from '@/lib/api'
import { NearbyHospital } from '@/types'
import HospitalCard from '@/components/HospitalCard'
import { KakaoMapView } from '@/components/KakaoMapView'

const { height } = Dimensions.get('window')

/**
 * 시뮬레이터·DB 테스트용 고정 좌표
 * 경상북도 구미시 옥계동 흥안로 46 부근 (OpenStreetMap 흥안로 옥계 구간 중심 근사)
 * iOS 시뮬레이터: Features → Location → Custom Location 에 동일 위도/경도 입력 가능
 */
const PRESET_OKGYE_HEUNGAN_46_LAT = 36.14715
const PRESET_OKGYE_HEUNGAN_46_LNG = 128.41799

const RADIUS_OPTIONS = [
  { value: 3000, label: '3km' },
  { value: 10000, label: '10km' },
  { value: 15000, label: '15km' },
  { value: 20000, label: '20km' },
  { value: 50000, label: '50km' },
] as const

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
  const useKakaoMap = kakaoMapAppKey.trim().length > 0
  const mapRef = useRef<MapView>(null)
  const locationRef = useRef<Location.LocationObject | null>(null)
  const [location, setLocation] = useState<Location.LocationObject | null>(null)
  const [region, setRegion] = useState<Region | null>(null)
  const [selectedHospital, setSelectedHospital] = useState<NearbyHospital | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [radiusMeters, setRadiusMeters] = useState(15000)

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

  const { data: hospitals, isLoading, isError, error, refetch } = useQuery({
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

  const handleMarkerPress = useCallback((hospital: NearbyHospital) => {
    setSelectedHospital(hospital)
  }, [])

  /** GPS 다시 읽고 지도 이동 */
  const handleRecenter = useCallback(() => {
    fetchGpsLocation()
  }, [fetchGpsLocation])

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
          showsUserLocation
          showsMyLocationButton={false}
          mapType="standard"
        >
          {hospitals?.map((item) => (
            <Marker
              key={item.hospital.id}
              coordinate={{
                latitude: item.hospital.latitude ?? 0,
                longitude: item.hospital.longitude ?? 0,
              }}
              title={item.hospital.name}
              description={item.hospital.department ?? ''}
              onPress={() => handleMarkerPress(item)}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.marker}>
                <Ionicons name="medical" size={9} color="#FFFFFF" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        disabled={locating}
      >
        {locating ? (
          <ActivityIndicator size="small" color="#0EA5E9" />
        ) : (
          <Ionicons name="locate" size={24} color="#0EA5E9" />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.refreshButton} onPress={() => refetch()}>
        <Ionicons name="refresh" size={24} color="#0EA5E9" />
      </TouchableOpacity>

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
  marker: {
    backgroundColor: '#0EA5E9',
    padding: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  recenterButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 80,
    right: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
