import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { useInfiniteQuery } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { getHospitalsBySymptom } from '@/lib/api'
import {
  PRESET_OKGYE_HEUNGAN_46_LAT,
  PRESET_OKGYE_HEUNGAN_46_LNG,
} from '@/lib/presetTestLocation'
import HospitalCard from '@/components/HospitalCard'

export default function SymptomHospitalsScreen() {
  const router = useRouter()
  const [symptom, setSymptom] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
          if (!cancelled) {
            setCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            })
          }
          return
        }
      } catch {
        /* 아래 프리셋으로 대체 */
      }
      if (!cancelled) {
        setCoords({
          lat: PRESET_OKGYE_HEUNGAN_46_LAT,
          lng: PRESET_OKGYE_HEUNGAN_46_LNG,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const symptomReady = symptom.trim().length >= 2

  const {
    data: hospitalPages,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['hospitalsBySymptom', symptom, coords?.lat, coords?.lng],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getHospitalsBySymptom({
        symptom: symptom.trim(),
        lat: coords?.lat,
        lng: coords?.lng,
        page: pageParam,
        size: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: symptomReady && coords != null,
  })

  const allHospitals = useMemo(
    () => hospitalPages?.pages.flatMap((p) => p.content) ?? [],
    [hospitalPages?.pages]
  )

  const totalHits = hospitalPages?.pages[0]?.totalElements ?? 0

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

  const waitingCoords = symptomReady && coords == null
  const listLoading = isLoading && !hospitalPages

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
          높은 병원(1위→5위)이 먼저 오고, 같은 순위는 현재 위치에서 가까운 순입니다. Top5가
          없는 병원은 결과에 나오지 않을 수 있습니다.
        </Text>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {!symptomReady
            ? '증상을 2자 이상 입력해 주세요'
            : waitingCoords
              ? '위치 확인 중…'
              : listLoading
                ? '검색 중…'
                : isError
                  ? '검색 중 오류가 발생했습니다. 다시 시도해 주세요.'
                  : totalHits > 0
                    ? `검색 결과 ${totalHits}건`
                    : '검색 결과 0건'}
        </Text>
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
      ) : waitingCoords || listLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color="#F97316" />
          <Text style={styles.emptyText}>
            데이터를 불러오는 중 오류가 발생했습니다.
          </Text>
          {error && (
            <Text style={styles.emptyText}>{String(error.message ?? '잠시 후 다시 시도해 주세요.')}</Text>
          )}
          <TouchableOpacity onPress={() => refetch()}>
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
