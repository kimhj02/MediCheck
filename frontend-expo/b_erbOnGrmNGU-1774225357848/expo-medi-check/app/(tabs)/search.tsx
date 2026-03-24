import { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { getHospitals, getNearbyHospitals } from '@/lib/api'
import {
  PRESET_OKGYE_HEUNGAN_46_LAT,
  PRESET_OKGYE_HEUNGAN_46_LNG,
} from '@/lib/presetTestLocation'

/** 검색 탭「주변」모드 반경 (고정) */
const NEARBY_SEARCH_RADIUS_METERS = 3000
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

type SearchMode = 'all' | 'nearby'

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

function normalizeSearchInput(s: string): string {
  return s
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase()
}

/**
 * 주변 모드 진료과 칩 매칭.
 * - clCdNm(`department`)만으로는 「내과」 등과 안 맞는 경우가 많고, 상호에만 진료과가 붙는 경우가 많음 → 이름도 함께 검사.
 * - 「외과」칩은 「정형외과」「성형외과」 등과 구분.
 */
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

/**
 * 주변 목록 클라이언트 필터.
 */
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

export default function SearchScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [mode, setMode] = useState<SearchMode>('all')
  const [keyword, setKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('전체')
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null)
  const [modeMenuVisible, setModeMenuVisible] = useState(false)

  const {
    data: hospitalPages,
    fetchNextPage,
    hasNextPage,
    isLoading: hospitalsLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hospitals', keyword, selectedDepartment],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getHospitals({
        keyword: keyword || undefined,
        department: selectedDepartment === '전체' ? undefined : selectedDepartment,
        page: pageParam,
        size: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: mode === 'all',
  })

  const allHospitals = useMemo(
    () => hospitalPages?.pages.flatMap((p) => p.content) ?? [],
    [hospitalPages?.pages]
  )

  const totalSearchHits = hospitalPages?.pages[0]?.totalElements ?? 0

  /** 동일 병원이 페이지 경계에 중복될 때를 대비 (안전) */
  const dedupedHospitals = useMemo(() => {
    const seen = new Set<number>()
    return allHospitals.filter((h) => {
      if (seen.has(h.id)) return false
      seen.add(h.id)
      return true
    })
  }, [allHospitals])

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
      NEARBY_SEARCH_RADIUS_METERS,
    ],
    queryFn: () =>
      getNearbyHospitals(
        userLocation!.coords.latitude,
        userLocation!.coords.longitude,
        NEARBY_SEARCH_RADIUS_METERS
      ),
    enabled: mode === 'nearby' && !!userLocation,
  })

  const filteredNearby = useMemo(
    () => filterNearbyResults(nearbyRaw ?? [], keyword, selectedDepartment),
    [nearbyRaw, keyword, selectedDepartment]
  )

  const handleDepartmentSelect = useCallback((dept: string) => {
    setSelectedDepartment(dept)
  }, [])

  const handleModeChange = useCallback((next: SearchMode) => {
    setMode(next)
    if (next === 'nearby') {
      /** 전체 검색에서 고른 진료과가 그대로면 DB department(clCdNm)와 불일치해 주변 0건이 되는 경우 방지 */
      setSelectedDepartment('전체')
      setUserLocation(
        coordsToLocation(PRESET_OKGYE_HEUNGAN_46_LAT, PRESET_OKGYE_HEUNGAN_46_LNG)
      )
    }
  }, [])

  const handleLoadMore = useCallback(() => {
    if (mode !== 'all') return
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [mode, hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleKeywordChange = useCallback((text: string) => {
    setKeyword(text)
  }, [])

  const listLoading = mode === 'all' ? hospitalsLoading : nearbyLoading

  /** 탭바·홈 인디케이터 위 우측 하단 */
  const fabBottom = 2
  const fabRight = 8

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              mode === 'nearby'
                ? '병원명·주소로 좁히기 (선택)'
                : '병원명, 주소 검색'
            }
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
          {mode === 'all'
            ? hospitalsLoading && !hospitalPages
              ? '검색 중…'
              : totalSearchHits > 0
                ? `검색 결과 ${totalSearchHits}건`
                : '검색 결과 0건'
            : `내 주변 ${filteredNearby.length}건 (3km · 옥계 흥안로 46 기준)${
                  nearbyRaw && nearbyRaw.length !== filteredNearby.length
                    ? ` — 반경 내 ${nearbyRaw.length}곳 중 필터`
                    : ''
                }`}
        </Text>
        {mode === 'nearby' && userLocation && (
          <TouchableOpacity onPress={() => refetchNearby()}>
            <Text style={styles.refetchLink}>새로고침</Text>
          </TouchableOpacity>
        )}
      </View>

      {listLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : mode === 'all' ? (
        !hospitalsLoading && dedupedHospitals.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={dedupedHospitals}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <HospitalCard
                hospital={item}
                onPress={() => router.push(`/hospital/${item.id}`)}
              />
            )}
            contentContainerStyle={[styles.listContent, styles.listContentWithFab]}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator size="small" color="#0EA5E9" style={styles.footer} />
              ) : null
            }
          />
        )
      ) : filteredNearby.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="map-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>
            {nearbyRaw?.length === 0
              ? '3km 내 병원이 없습니다.'
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
        style={[
          styles.modeFabWrap,
          { bottom: fabBottom + insets.bottom, right: fabRight },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.modeFabSingle}
          onPress={() => setModeMenuVisible(true)}
          activeOpacity={0.9}
        >
          <Ionicons
            name={mode === 'all' ? 'search' : 'location'}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.modeFabSingleLabel} numberOfLines={1}>
            {mode === 'all' ? '전체' : '주변'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#FFFFFF" style={styles.modeFabChevron} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modeMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModeMenuVisible(false)}
      >
        <View style={styles.modeMenuOverlay} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModeMenuVisible(false)} />
          <View
            style={[
              styles.modeMenuCard,
              {
                bottom: fabBottom + insets.bottom + 52,
                right: fabRight,
              },
            ]}
          >
            <Text style={styles.modeMenuTitle}>검색 범위</Text>
            <TouchableOpacity
              style={[styles.modeMenuRow, mode === 'all' && styles.modeMenuRowActive]}
              onPress={() => {
                handleModeChange('all')
                setModeMenuVisible(false)
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="search"
                size={18}
                color={mode === 'all' ? '#0EA5E9' : '#64748B'}
              />
              <Text
                style={[styles.modeMenuRowLabel, mode === 'all' && styles.modeMenuRowLabelActive]}
              >
                전체
              </Text>
              {mode === 'all' && (
                <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeMenuRow, mode === 'nearby' && styles.modeMenuRowActive]}
              onPress={() => {
                handleModeChange('nearby')
                setModeMenuVisible(false)
              }}
              activeOpacity={0.85}
            >
              <Ionicons
                name="location"
                size={18}
                color={mode === 'nearby' ? '#0EA5E9' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeMenuRowLabel,
                  mode === 'nearby' && styles.modeMenuRowLabelActive,
                ]}
              >
                주변
              </Text>
              {mode === 'nearby' && (
                <Ionicons name="checkmark-circle" size={20} color="#0EA5E9" />
              )}
            </TouchableOpacity>
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
  modeFabWrap: {
    position: 'absolute',
    zIndex: 20,
  },
  modeFabSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#0EA5E9',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 10,
  },
  modeFabSingleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 56,
  },
  modeFabChevron: {
    marginLeft: -2,
    opacity: 0.95,
  },
  modeMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  modeMenuCard: {
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
  modeMenuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  modeMenuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modeMenuRowActive: {
    backgroundColor: '#F0F9FF',
  },
  modeMenuRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  modeMenuRowLabelActive: {
    color: '#0369A1',
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
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listContentWithFab: {
    paddingBottom: 120,
  },
  footer: {
    paddingVertical: 20,
  },
})
