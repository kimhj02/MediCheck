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
  TextInput,
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
        <View style={styles.symptomInputWrapper}>
          <Ionicons
            name="medkit-outline"
            size={22}
            color="#0EA5E9"
            style={styles.symptomIcon}
          />
          <TextInput
            style={styles.symptomInput}
            placeholder="증상·질환을 입력하세요 (예: 두통, 감기)"
            placeholderTextColor="#94A3B8"
            value={symptom}
            onChangeText={setSymptom}
            returnKeyType="search"
            multiline={false}
          />
          {symptom.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="증상 입력 지우기"
              onPress={() => setSymptom('')}
            >
              <Ionicons name="close-circle" size={22} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.hint}>
          심평원에 동기화된 병원의 「진료 상위 5개 질병명」과 비교합니다. 공백·쉼표로 여러
          키워드를 넣을 수 있으며, 2자 이상일 때 검색이 시작됩니다. 결과는 매칭된 순위가 더
          높은 병원(1위→5위)이 먼저 오고,
          {coords != null
            ? ' 같은 순위는 현재 위치 기준 가까운 순입니다.'
            : ' 위치 권한을 허용하면 같은 순위를 가까운 순으로 정렬합니다(미허용 시 거리 정렬 없음).'}
          Top5가 없는 병원은 결과에 나오지 않을 수 있습니다.
        </Text>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {!symptomReady
            ? '증상을 2자 이상 입력해 주세요'
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
          <Ionicons name="pulse-outline" size={52} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>증상별 병원 찾기</Text>
          <Text style={styles.emptyText}>
            위 칸에 증상이나 질환명을 입력하면, 해당 병원의 진료 상위 5개 질병 데이터와 맞는
            곳만 보여 드립니다.
          </Text>
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
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  symptomInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  symptomIcon: {
    marginRight: 10,
  },
  symptomInput: {
    flex: 1,
    minHeight: 44,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  footer: {
    paddingVertical: 20,
  },
})
