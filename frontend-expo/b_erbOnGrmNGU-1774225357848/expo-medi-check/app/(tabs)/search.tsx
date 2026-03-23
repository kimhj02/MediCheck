import { useState, useCallback } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { getHospitals } from '@/lib/api'
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
]

export default function SearchScreen() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('전체')
  const [page, setPage] = useState(0)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['hospitals', keyword, selectedDepartment, page],
    queryFn: () =>
      getHospitals({
        keyword: keyword || undefined,
        department: selectedDepartment === '전체' ? undefined : selectedDepartment,
        page,
        size: 20,
      }),
  })

  const handleDepartmentSelect = useCallback((dept: string) => {
    setSelectedDepartment(dept)
    setPage(0)
  }, [])

  const handleLoadMore = useCallback(() => {
    if (data && !data.last && !isFetching) {
      setPage((prev) => prev + 1)
    }
  }, [data, isFetching])

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="병원명, 주소 검색"
            placeholderTextColor="#94A3B8"
            value={keyword}
            onChangeText={setKeyword}
            returnKeyType="search"
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
          검색 결과 {data?.totalElements ?? 0}건
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0EA5E9" />
        </View>
      ) : data?.empty ? (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
        </View>
      ) : (
        <FlatList
          data={data?.content}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <HospitalCard
              hospital={item}
              onPress={() => router.push(`/hospital/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching ? (
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
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
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
  departmentContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  departmentList: {
    paddingHorizontal: 16,
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
  },
  emptyText: {
    fontSize: 16,
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  footer: {
    paddingVertical: 20,
  },
})
