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
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Keyboard,
  Dimensions,
  Platform,
  type KeyboardEvent,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { getHospitalsBySymptom } from '@/lib/api'
import { SYMPTOM_PICKER_LABELS } from '@/lib/symptomPickerLabels'
import HospitalCard from '@/components/HospitalCard'
import type { Hospital, Page } from '@/types'

const SYMPTOM_QUERY_KEY_ROOT = 'hospitalsBySymptom' as const
const NO_COORDS_SENTINEL = 'no-coords' as const

type SymptomHospitalInfiniteData = InfiniteData<Page<Hospital>, number>

type SymptomQueryKey =
  | readonly [typeof SYMPTOM_QUERY_KEY_ROOT, string, number, number]
  | readonly [typeof SYMPTOM_QUERY_KEY_ROOT, string, typeof NO_COORDS_SENTINEL]

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

const MODAL_LIST_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.52)
/** 모달 상단(그랩바·제목·부제·검색창·여백) 대략 높이 — 키보드 열릴 때 목록 가용 높이 계산용 */
const PICKER_MODAL_CHROME = 248

export default function SymptomHospitalsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [symptom, setSymptom] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [pickerVisible, setPickerVisible] = useState(false)
  const [pickerFilter, setPickerFilter] = useState('')
  const [pickerKeyboardHeight, setPickerKeyboardHeight] = useState(0)

  useEffect(() => {
    if (pickerVisible) {
      setPickerFilter('')
    }
  }, [pickerVisible])

  useEffect(() => {
    if (!pickerVisible) {
      setPickerKeyboardHeight(0)
      return
    }
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const onShow = (e: KeyboardEvent) =>
      setPickerKeyboardHeight(e.endCoordinates.height)
    const onHide = () => setPickerKeyboardHeight(0)
    const subShow = Keyboard.addListener(showEvent, onShow)
    const subHide = Keyboard.addListener(hideEvent, onHide)
    return () => {
      subShow.remove()
      subHide.remove()
    }
  }, [pickerVisible])

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
        /* 거리 정렬 없이 검색 */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const symptomTrim = symptom.trim()
  const symptomReady = symptomTrim.length >= 2

  const filteredPickerKeywords = useMemo(() => {
    const f = pickerFilter.trim().toLowerCase()
    if (!f) return [...SYMPTOM_PICKER_LABELS]
    return SYMPTOM_PICKER_LABELS.filter((k) => k.toLowerCase().includes(f))
  }, [pickerFilter])

  const pickerModalListMaxHeight = useMemo(() => {
    if (pickerKeyboardHeight <= 0) {
      return MODAL_LIST_MAX_HEIGHT
    }
    const winH = Dimensions.get('window').height
    const chrome =
      PICKER_MODAL_CHROME +
      Math.max(insets.top, 8) +
      Math.max(insets.bottom, 12) +
      12
    const available = winH - pickerKeyboardHeight - chrome
    return Math.max(200, Math.min(MODAL_LIST_MAX_HEIGHT, available))
  }, [pickerKeyboardHeight, insets.top, insets.bottom])

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

  const handlePickSymptom = useCallback((label: string) => {
    setSymptom(label)
    setPickerVisible(false)
    Keyboard.dismiss()
  }, [])

  const listLoading = isLoading && !hospitalPages
  const showFullScreenLoadError = isLoadingError && !hospitalPages
  const loadErrorMessage = error ? userFacingQueryErrorMessage(error) : ''

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <View style={styles.symptomPickerHeader}>
          <Ionicons name="medkit-outline" size={22} color="#0EA5E9" />
          <Text style={styles.symptomPickerTitle}>증상별 병원찾기</Text>
        </View>

        <TouchableOpacity
          style={styles.selectTrigger}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="증상·질환 목록 열기"
        >
          <View style={styles.selectTriggerTextBlock}>
            <Text style={styles.selectTriggerCaption}>선택</Text>
            <Text
              style={[
                styles.selectTriggerValue,
                !symptomTrim && styles.selectTriggerPlaceholder,
              ]}
              numberOfLines={2}
            >
              {symptomTrim || '탭하여 DB에 있는 질병명 목록 열기'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={22} color="#64748B" />
        </TouchableOpacity>

        {symptomTrim ? (
          <TouchableOpacity
            style={styles.clearSelectionBtn}
            onPress={() => setSymptom('')}
            accessibilityRole="button"
            accessibilityLabel="선택한 증상 해제"
          >
            <Text style={styles.clearSelectionBtnText}>선택 해제</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.hint}>
          항목을 고르면 해당 질병명과 부분 일치하는 병원만 검색됩니다. 매칭 순위(1위→5위)가 높은
          병원이 먼저 나옵니다.
          {coords != null
            ? ' 같은 순위는 현재 위치 기준 가까운 순입니다.'
            : ' 위치 권한을 허용하면 같은 순위를 가까운 순으로 정렬합니다.'}
        </Text>
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {!symptomReady
            ? '증상을 선택해 주세요'
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
          <Text style={styles.emptyText}>
            위「선택」을 눌러 실제 데이터에 있는 질병명을 고르세요.
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

      <Modal
        visible={pickerVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          Keyboard.dismiss()
          setPickerVisible(false)
        }}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => {
              Keyboard.dismiss()
              setPickerVisible(false)
            }}
          />
          <View
            style={[
              styles.modalSheet,
              {
                paddingTop: Math.max(insets.top, 8),
                paddingBottom: Math.max(insets.bottom, 12) + 8,
                marginBottom: pickerKeyboardHeight,
              },
            ]}
          >
            <View style={styles.modalGrabber} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>질병명 선택</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss()
                  setPickerVisible(false)
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="닫기"
              >
                <Ionicons name="close" size={28} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              앱에 포함된 질병명만 표시됩니다. 아래에서 검색할 수 있습니다.
            </Text>
            <View style={styles.modalSearchWrap}>
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="목록에서 찾기…"
                placeholderTextColor="#94A3B8"
                value={pickerFilter}
                onChangeText={setPickerFilter}
                returnKeyType="search"
              />
            </View>
            <FlatList
              style={{ maxHeight: pickerModalListMaxHeight }}
              data={filteredPickerKeywords}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalRow,
                    item === symptomTrim && styles.modalRowSelected,
                  ]}
                  onPress={() => handlePickSymptom(item)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.modalRowLabel,
                      item === symptomTrim && styles.modalRowLabelSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {item}
                  </Text>
                  {item === symptomTrim ? (
                    <Ionicons name="checkmark-circle" size={22} color="#0EA5E9" />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.modalEmptyText}>일치하는 항목이 없습니다.</Text>
              }
              contentContainerStyle={styles.modalListContent}
            />
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
    marginBottom: 10,
  },
  symptomPickerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectTriggerTextBlock: {
    flex: 1,
    marginRight: 10,
  },
  selectTriggerCaption: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  selectTriggerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 22,
  },
  selectTriggerPlaceholder: {
    color: '#64748B',
    fontWeight: '500',
  },
  clearSelectionBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 4,
  },
  clearSelectionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0EA5E9',
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
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    maxHeight: '88%',
    minHeight: 360,
  },
  modalGrabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 18,
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#1E293B',
  },
  modalLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  modalEmptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  modalRetry: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  modalListContent: {
    paddingBottom: 24,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  modalRowSelected: {
    backgroundColor: '#F0F9FF',
    marginHorizontal: -8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  modalRowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  modalRowLabelSelected: {
    color: '#0369A1',
    fontWeight: '700',
  },
})
