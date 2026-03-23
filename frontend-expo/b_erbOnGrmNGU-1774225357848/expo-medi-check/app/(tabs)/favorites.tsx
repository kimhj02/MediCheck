import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { getFavorites } from '@/lib/api'
import HospitalCard from '@/components/HospitalCard'

export default function FavoritesScreen() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const { data: favorites, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: getFavorites,
    enabled: !!user,
  })

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>로그인이 필요합니다</Text>
        <Text style={styles.emptyDescription}>
          즐겨찾기 기능을 사용하려면{'\n'}로그인해 주세요
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>로그인</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    )
  }

  if (!favorites || favorites.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="heart-outline" size={64} color="#CBD5E1" />
        <Text style={styles.emptyTitle}>즐겨찾기가 없습니다</Text>
        <Text style={styles.emptyDescription}>
          자주 가는 병원을 즐겨찾기에{'\n'}추가해 보세요
        </Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchButtonText}>병원 찾기</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>즐겨찾기</Text>
        <Text style={styles.headerCount}>{favorites.length}곳</Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <HospitalCard
            hospital={item}
            onPress={() => router.push(`/hospital/${item.id}`)}
            showFavorite
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
      />
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
    paddingHorizontal: 24,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerCount: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchButton: {
    marginTop: 20,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
})
