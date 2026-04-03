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
} from 'react-native'
import { useRouter } from 'expo-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getHospitalsBySymptom } from '@/lib/api'
import HospitalCard from '@/components/HospitalCard'

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

export default function SymptomHospitalsScreen() {
  const router = useRouter()
  const [symptom, setSymptom] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('전체')

  const symptomReady = symptom.trim().length >= 2

  const {
    data: hospitalPages,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['hospitalsBySymptom', symptom, keyword, selectedDepartment],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getHospitalsBySymptom({
        symptom: symptom.trim(),
        keyword: keyword || undefined,
        department:
          selectedDepartment === '전체' ? undefined : selectedDepartment,
        page: pageParam,
        size: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
    enabled: symptomReady,
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
            <TouchableOpacity onPress={() => setSymptom('')}>
              <Ionicons name="close-circle" size={22} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.hint}>
          심평원에 동기화된 병원의 「진료 상위 5개 질병명」과 비교합니다. 공백·쉼표로
          여러 키워드를 넣을 수 있으며, 2자 이상일 때 검색이 시작됩니다. Top5가 아직
          없는 병원은 결과에 나오지 않을 수 있습니다.
        </Text>

        <View style={styles.narrowRow}>
          <Ionicons name="search" size={18} color="#94A3B8" style={styles.narrowIcon} />
          <TextInput
            style={styles.narrowInput}
            placeholder="병원명·주소로 좁히기 (선택)"
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="done"
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => setKeyword('')}>
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
              onPress={() => setSelectedDepartment(dept)}
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
          {!symptomReady
            ? '증상을 2자 이상 입력해 주세요'
            : isLoading && !hospitalPages
              ? '검색 중…'
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
            위 칸에 증상이나 질환명을 입력하면, 해당 병원의 진료 상위 5개 질병
            데이터와 맞는 곳만 보여 드립니다.
          </Text>
        </View>
      ) : isLoading && !hospitalPages ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
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
  narrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  narrowIcon: {
    marginRight: 8,
  },
  narrowInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 6,
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
