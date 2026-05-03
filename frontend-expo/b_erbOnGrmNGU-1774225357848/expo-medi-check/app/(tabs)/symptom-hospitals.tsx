import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  useInfiniteQuery,
  keepPreviousData,
  type InfiniteData,
  type Query,
} from '@tanstack/react-query'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { getHospitalsBySymptom } from '@/lib/api'
import HospitalCard from '@/components/HospitalCard'
import type { Hospital, Page } from '@/types'

const SYMPTOM_QUERY_KEY_ROOT = 'hospitalsBySymptom' as const
const NO_COORDS_SENTINEL = 'no-coords' as const

/**
 * 심평원 진료 상위 질병명 매칭용 — 자주 찾는 증상·질환 라벨(검색어와 동일 문자열 전달)
 */
const SYMPTOM_CHOICES = [
  '감기',
  '기침',
  '인후통',
  '콧물',
  '코막힘',
  '두통',
  '편두통',
  '어지럼증',
  '발열',
  '가슴통증',
  '두근거림',
  '호흡곤란',
  '복통',
  '상복통',
  '소화불량',
  '설사',
  '변비',
  '구토',
  '메스꺼움',
  '요통',
  '목통증',
  '무릎통증',
  '관절통',
  '근육통',
  '피부가려움',
  '두드러기',
  '습진',
  '알레르기',
  '불면',
  '우울',
  '불안',
  '눈충혈',
  '시야흐림',
  '귀통증',
  '이명',
] as const

type SymptomHospitalInfiniteData = InfiniteData<Page<Hospital>, number>

type SymptomQueryKey =
  | readonly [typeof SYMPTOM_QUERY_KEY_ROOT, string, number, number]
  | readonly [typeof SYMPTOM_QUERY_KEY_ROOT, string, typeof NO_COORDS_SENTINEL]

/**
 * coords가 나중에 잡히면 queryKey가 바뀌어도 이전 페이지를 유지(전면 로딩 방지).
 * 증상 문자열이 바뀌면 이전 목록을 placeholder로 쓰지 않는다.
 */
function symptomSearchPlaceholderData(
  previousData: SymptomHospitalInfiniteData | undefined,
  previousQuery:
    | Query<SymptomHospitalInfiniteData, Error, SymptomHospitalInfiniteData, SymptomQueryKey>
    | undefined,
  symptomTrim: string,
  coords: { lat: number; lng: number } | null,
): SymptomHospitalInfiniteData | undefined {
  if (!previousData || !previousQuery) return undefined
  const key = previousQuery.queryKey
  if (!Array.isArray(key) || key[0] !== SYMPTOM_QUERY_KEY_ROOT) return undefined
  const prevSymptom = key[1]
  if (typeof prevSymptom !== 'string' || prevSymptom !== symptomTrim) return undefined
  const prevLoc = key[2]
  if (prevLoc === NO_COORDS_SENTINEL && coords != null) return previousData
  return keepPreviousData(previousData) as SymptomHospitalInfiniteData | undefined
}

function userFacingQueryErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes('서버 응답이 없습니다')) {
      return err.message
    }
    if (err.message.startsWith('API Error')) {
      return '서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.'
    }
  }
  return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export default function SymptomHospitalsScreen() {
  const router = useRouter()
  const [symptom, setSymptom] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') {
          return
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (!cancelled) {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          })
        }
      } catch {
        /* 거리 정렬 없이 검색 — coords 유지(null) */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const symptomTrim = symptom.trim()
  const symptomReady = symptomTrim.length >= 2

  const handleSymptomChoice = useCallback((label: string) => {
    setSymptom((prev) => (prev.trim() === label ? '' : label))
  }, [])

  const symptomQueryKey = useMemo(
    () =>
      coords != null
        ? ([SYMPTOM_QUERY_KEY_ROOT, symptomTrim, coords.lat, coords.lng] as const)
        : ([SYMPTOM_QUERY_KEY_ROOT, symptomTrim, NO_COORDS_SENTINEL] as const),
    [symptomTrim, coords],
  )

  const {
    data: hospitalPages,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isLoadingError,
    isRefetchError,
    isFetchNextPageError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: symptomQueryKey,
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getHospitalsBySymptom({
        symptom: symptomTrim,
        lat: coords?.lat,
        lng: coords?.lng,
        page: pageParam,
        size: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: symptomReady,
    placeholderData: (previousData, previousQuery) =>
      symptomSearchPlaceholderData(
        previousData,
        previousQuery as
          | Query<SymptomHospitalInfiniteData, Error, SymptomHospitalInfiniteData, SymptomQueryKey>
          | undefined,
        symptomTrim,
        coords,
      ),
  })

  const allHospitals = useMemo(
    () => hospitalPages?.pages.flatMap((p: Page<Hospital>) => p.content) ?? [],
    [hospitalPages?.pages]
  )

  const totalHits = (hospitalPages?.pages[0] as Page<Hospital> | undefined)?.totalElements ?? 0

  const dedupedHospitals = useMemo(() => {
    const seen = new Set<number>()
    return allHospitals.filter((h) => {
      if (seen.has(h.id)) return false
      seen.add(h.id)
      return true
    })
  }, [allHospitals])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const listLoading = isLoading && !hospitalPages
  const showFullScreenLoadError = isLoadingError && !hospitalPages
  const loadErrorMessage = error ? userFacingQueryErrorMessage(error) : ''

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <View style={styles.symptomPickerHeader}>
          <Ionicons name="medkit-outline" size={22} color="#0EA5E9" />
          <Text style={styles.symptomPickerTitle}>증상 선택</Text>
        </View>
        <ScrollView
          style={styles.symptomScroll}
          contentContainerStyle={styles.symptomScrollContent}
          showsVerticalScrollIndicator
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {SYMPTOM_CHOICES.map((label) => {
            const selected = symptomTrim === label
            return (
              <TouchableOpacity
                key={label}
                style={[styles.symptomRow, selected && styles.symptomRowSelected]}
                onPress={() => handleSymptomChoice(label)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`증상 ${label}${selected ? ', 선택됨. 다시 누르면 해제' : ''}`}
              >
                <Text style={[styles.symptomRowLabel, selected && styles.symptomRowLabelSelected]}>
                  {label}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
        <Text style={styles.hint}>
          아래에서 증상·질환을 한 가지 고르면 검색이 시작됩니다. 같은 항목을 다시 누르면
          선택이 해제됩니다. 심평원 「진료 상위 5개 질병명」과 비교하며, 매칭 순위가 높은
          병원이 먼저 나옵니다.
          {coords != null
            ? ' 같은 순위는 현재 위치 기준 가까운 순입니다.'
            : ' 위치 권한을 허용하면 같은 순위를 가까운 순으로 정렬합니다.'}
        </Text>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {!symptomReady
            ? '증상을 목록에서 선택해 주세요'
            : listLoading
              ? '검색 중…'
              : showFullScreenLoadError
                ? '검색을 불러오지 못했습니다. 아래에서 다시 시도해 주세요.'
                : isRefetchError && dedupedHospitals.length > 0
                  ? `검색 결과 ${totalHits}건 · 목록 새로고침에 실패했습니다`
                  : totalHits > 0
                    ? `검색 결과 ${totalHits}건`
                    : '검색 결과 0건'}
        </Text>
        {isRefetchError && dedupedHospitals.length > 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="목록 새로고침 다시 시도"
            onPress={() => refetch()}
            style={styles.inlineRetryRow}
          >
            <Text style={styles.inlineRetryText}>새로고침 다시 시도</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {!symptomReady ? (
        <View style={styles.centered}>
          <Ionicons name="list-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>병원 목록이 여기에 표시됩니다</Text>
          <Text style={styles.emptyText}>위 목록에서 증상을 한 가지 선택해 주세요.</Text>
        </View>
      ) : listLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : showFullScreenLoadError ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color="#F97316" />
          <Text style={styles.emptyText}>{loadErrorMessage}</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="검색 다시 시도"
            onPress={() => refetch()}
          >
            <Text style={[styles.emptyText, { color: '#0EA5E9', fontWeight: '600' }]}>
              다시 시도
            </Text>
          </TouchableOpacity>
        </View>
      ) : dedupedHospitals.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>조건에 맞는 병원이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          style={styles.hospitalList}
          data={dedupedHospitals}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <HospitalCard
              hospital={item}
              onPress={() => router.push(`/hospital/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color="#0EA5E9" style={styles.footer} />
            ) : isFetchNextPageError ? (
              <View style={styles.nextPageError}>
                <Text style={styles.nextPageErrorText}>
                  추가 목록을 불러오지 못했습니다.
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="다음 페이지 다시 불러오기"
                  onPress={() => fetchNextPage()}
                >
                  <Text style={styles.nextPageRetryText}>다시 시도</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  symptomPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  symptomPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  symptomScroll: {
    maxHeight: 240,
    marginHorizontal: -4,
  },
  symptomScrollContent: {
    paddingBottom: 4,
  },
  symptomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  symptomRowSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#7DD3FC',
  },
  symptomRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  symptomRowLabelSelected: {
    color: '#0369A1',
  },
  hint: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  resultHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#64748B',
  },
  inlineRetryRow: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  inlineRetryText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  nextPageError: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  nextPageErrorText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  nextPageRetryText: {
    fontSize: 14,
    color: '#0EA5E9',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  hospitalList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  footer: {
    paddingVertical: 20,
  },
})
