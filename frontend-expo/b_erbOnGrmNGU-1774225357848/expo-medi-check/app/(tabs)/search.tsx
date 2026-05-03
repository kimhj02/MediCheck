import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Modal,
  Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { getNearbyHospitals } from '@/lib/api'
import HospitalCard from '@/components/HospitalCard'
import type { Hospital, NearbyHospital } from '@/types'

const DEPARTMENTS = [
  '전체',
  '내과',
  '외과',
  '소아과',
  '정형외과',
  '피부과',
  '이비인후과',
  '안과',
  '치과',
  '산부인과',
  '비뇨기과',
  '신경과',
  '정신건강의학과',
] as const

/** 검색 탭 반경 — 플로팅 버튼 (미터) */
const RADIUS_KM_OPTIONS = [
  { meters: 1000, label: '1km' },
  { meters: 3000, label: '3km' },
  { meters: 5000, label: '5km' },
  { meters: 10_000, label: '10km' },
] as const

const DEFAULT_RADIUS_METERS = 3000

/** 검색 반경 플로팅 트리거 — 정원 */
const RADIUS_FAB_SIZE = 64

function normalizeSearchInput(s: string): string {
  return s
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

function nearbyDepartmentChipMatches(hospital: Hospital, needleRaw: string): boolean {
  const needle = needleRaw.trim().toLowerCase()
  if (!needle) return true

  const name = (hospital.name ?? '').trim().toLowerCase()
  const dept = (hospital.department ?? '').trim().toLowerCase()

  if (!name.includes(needle) && !dept.includes(needle)) {
    return false
  }

  if (needle === '외과') {
    if (
      name.includes('정형외과') ||
      dept.includes('정형외과') ||
      name.includes('성형외과') ||
      dept.includes('성형외과') ||
      name.includes('신경외과') ||
      dept.includes('신경외과') ||
      name.includes('흉부외과') ||
      dept.includes('흉부외과')
    ) {
      return false
    }
  }

  return true
}

function filterNearbyResults(
  items: NearbyHospital[],
  keyword: string,
  department: string
): NearbyHospital[] {
  let list = items
  const kw = normalizeSearchInput(keyword)
  if (kw) {
    list = list.filter(({ hospital }) => {
      const name = (hospital.name ?? '').toLowerCase()
      const addr = (hospital.address ?? '').toLowerCase()
      const dept = (hospital.department ?? '').toLowerCase()
      return name.includes(kw) || addr.includes(kw) || dept.includes(kw)
    })
  }
  const deptTrim = department.trim()
  if (deptTrim !== '' && deptTrim !== '전체') {
    list = list.filter(({ hospital }) => nearbyDepartmentChipMatches(hospital, deptTrim))
  }
  return list
}

function radiusLabel(meters: number): string {
  const found = RADIUS_KM_OPTIONS.find((o) => o.meters === meters)
  return found?.label ?? `${meters / 1000}km`
}

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [keyword, setKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('전체')
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null)
  const [radiusMeters, setRadiusMeters] = useState(DEFAULT_RADIUS_METERS)
  const [radiusMenuVisible, setRadiusMenuVisible] = useState(false)
  const [locPending, setLocPending] = useState(true)
  const [locDenied, setLocDenied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLocPending(true)
      setLocDenied(false)
      try {
        const servicesOn = await Location.hasServicesEnabledAsync()
        if (!servicesOn) {
          if (!cancelled) setLocDenied(true)
          return
        }
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          if (!cancelled) setLocDenied(true)
          return
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (!cancelled) setUserLocation(loc)
      } catch {
        if (!cancelled) setLocDenied(true)
      } finally {
        if (!cancelled) setLocPending(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const {
    data: nearbyRaw,
    isLoading: nearbyLoading,
    isFetching: nearbyFetching,
    refetch: refetchNearby,
  } = useQuery({
    queryKey: [
      'searchNearby',
      userLocation?.coords.latitude,
      userLocation?.coords.longitude,
      radiusMeters,
    ],
    queryFn: () =>
      getNearbyHospitals(
        userLocation!.coords.latitude,
        userLocation!.coords.longitude,
        radiusMeters
      ),
    enabled: !!userLocation,
    placeholderData: keepPreviousData,
  })

  const filteredNearby = useMemo(
    () => filterNearbyResults(nearbyRaw ?? [], keyword, selectedDepartment),
    [nearbyRaw, keyword, selectedDepartment]
  )

  const handleDepartmentSelect = useCallback((dept: string) => {
    setSelectedDepartment(dept)
  }, [])

  const handleKeywordChange = useCallback((text: string) => {
    setKeyword(text)
  }, [])

  /** 테스트: 하단에 최대한 붙임(안전 영역만). 커밋 전 여백 조정 권장 */
  const fabBottom = insets.bottom
  const fabRight = 12

  const listLoading = locPending || (nearbyLoading && nearbyRaw === undefined)

  if (locPending) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
          <Text style={styles.loadingHint}>현재 위치를 확인하는 중…</Text>
        </View>
      </View>
    )
  }

  if (locDenied || !userLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>
            내 주변 병원을 보려면 위치 권한과 기기 위치 서비스를 켜 주세요.
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setLocPending(true)
                setLocDenied(false)
                setUserLocation(null)
                void (async () => {
                  try {
                    const { status } = await Location.requestForegroundPermissionsAsync()
                    if (status !== 'granted') {
                      setLocDenied(true)
                      return
                    }
                    const loc = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.Balanced,
                    })
                    setUserLocation(loc)
                    setLocDenied(false)
                  } catch {
                    setLocDenied(true)
                  } finally {
                    setLocPending(false)
                  }
                })()
              }}
            >
              <Text style={styles.retryBtnText}>다시 시도</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.settingsBtnText}>설정 열기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="병원명·주소로 좁히기 (선택)"
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={handleKeywordChange}
            returnKeyType="search"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => handleKeywordChange('')}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.departmentContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.departmentList}
        >
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.departmentChip,
                selectedDepartment === dept && styles.departmentChipActive,
              ]}
              onPress={() => handleDepartmentSelect(dept)}
            >
              <Text
                style={[
                  styles.departmentText,
                  selectedDepartment === dept && styles.departmentTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {listLoading
            ? '불러오는 중…'
            : `내 주변 ${filteredNearby.length}건 (${radiusLabel(radiusMeters)} · 현재 위치 기준)${
                nearbyRaw && nearbyRaw.length !== filteredNearby.length
                  ? ` — 반경 내 ${nearbyRaw.length}곳 중 필터`
                  : ''
              }`}
        </Text>
        <TouchableOpacity onPress={() => refetchNearby()}>
          <Text style={styles.refetchLink}>새로고침</Text>
        </TouchableOpacity>
      </View>

      {listLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : filteredNearby.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="map-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {nearbyRaw?.length === 0
              ? `${radiusLabel(radiusMeters)} 내 병원이 없습니다.`
              : '조건에 맞는 병원이 없습니다. 검색어나 진료과를 바꿔 보세요.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNearby}
          keyExtractor={(item) => String(item.hospital.id)}
          renderItem={({ item }) => (
            <HospitalCard
              hospital={item.hospital}
              distance={item.distanceMeters}
              onPress={() => router.push(`/hospital/${item.hospital.id}`)}
            />
          )}
          contentContainerStyle={[styles.listContent, styles.listContentWithFab]}
          refreshing={nearbyFetching}
          onRefresh={() => refetchNearby()}
          ListFooterComponent={
            nearbyFetching ? (
              <ActivityIndicator size="small" color="#0EA5E9" style={styles.footer} />
            ) : null
          }
        />
      )}

      <View
        style={[styles.radiusFabWrap, { bottom: fabBottom, right: fabRight }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.radiusFabTrigger}
          onPress={() => setRadiusMenuVisible(true)}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={`검색 반경 ${radiusLabel(radiusMeters)}, 탭하면 변경`}
        >
          <Ionicons name="locate" size={22} color="#FFFFFF" />
          <Text style={styles.radiusFabTriggerLabel} numberOfLines={1}>
            {radiusLabel(radiusMeters)}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={radiusMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRadiusMenuVisible(false)}
      >
        <View style={styles.radiusMenuOverlay} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setRadiusMenuVisible(false)} />
          <View
            style={[
              styles.radiusMenuCard,
              { bottom: fabBottom + RADIUS_FAB_SIZE + 10, right: fabRight },
            ]}
          >
            <Text style={styles.radiusMenuTitle}>검색 반경</Text>
            {RADIUS_KM_OPTIONS.map((opt) => {
              const selected = radiusMeters === opt.meters
              return (
                <TouchableOpacity
                  key={opt.meters}
                  style={[styles.radiusMenuRow, selected && styles.radiusMenuRowActive]}
                  onPress={() => {
                    setRadiusMeters(opt.meters)
                    setRadiusMenuVisible(false)
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[styles.radiusMenuRowLabel, selected && styles.radiusMenuRowLabelActive]}
                  >
                    {opt.label}
                  </Text>
                  <View style={styles.radiusMenuRowTrail}>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
                    ) : null}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1E293B',
  },
  radiusFabWrap: {
    position: 'absolute',
    zIndex: 20,
  },
  radiusFabTrigger: {
    width: RADIUS_FAB_SIZE,
    height: RADIUS_FAB_SIZE,
    borderRadius: RADIUS_FAB_SIZE / 2,
    backgroundColor: '#0EA5E9',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 10,
  },
  radiusFabTriggerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textAlign: 'center',
    maxWidth: RADIUS_FAB_SIZE - 8,
  },
  radiusMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  radiusMenuCard: {
    position: 'absolute',
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  radiusMenuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  radiusMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  radiusMenuRowActive: {
    backgroundColor: '#F0F9FF',
  },
  radiusMenuRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  radiusMenuRowLabelActive: {
    color: '#0369A1',
  },
  radiusMenuRowTrail: {
    width: 24,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  departmentContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  departmentList: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  departmentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
  },
  departmentChipActive: {
    backgroundColor: '#0EA5E9',
  },
  departmentText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  departmentTextActive: {
    color: '#FFFFFF',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  refetchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingHint: {
    fontSize: 15,
    color: '#64748B',
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContentWithFab: {
    paddingBottom: 100,
  },
  footer: {
    paddingVertical: 20,
  },
})
