import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { getMyReviews } from '@/lib/api'
import type { MyHospitalReviewItem } from '@/types'

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return iso
  }
}

export default function MyReviewsScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const authLoading = useAuthStore((s) => s.isLoading)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['myReviews', user?.userId],
    queryFn: () => getMyReviews(0, 100),
    enabled: Boolean(user && token) && !authLoading,
    retry: 1,
  })

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0EA5E9" />
      </View>
    )
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="create-outline" size={56} color="#CBD5E1" />
        <Text style={styles.hintTitle}>로그인이 필요합니다</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
          <Text style={styles.loginBtnText}>로그인</Text>
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

  if (isError) {
    const msg =
      error instanceof Error ? error.message : '목록을 불러오지 못했습니다.'
    const is404 = /404/.test(msg)
    return (
      <View style={styles.centered}>
        <Text style={styles.err}>목록을 불러오지 못했습니다.</Text>
        <Text style={styles.errDetail}>{msg}</Text>
        {is404 ? (
          <Text style={styles.errHint}>
            • .env의 EXPO_PUBLIC_API_URL이 `http://IP:포트`만 있어도 자동으로 `/api`가 붙습니다. 그래도 404면
            백엔드를 최신 코드로 다시 빌드·실행했는지 확인하세요.{'\n'}
            (엔드포인트: GET /api/users/me/reviews)
          </Text>
        ) : null}
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retry}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const list = Array.isArray(data?.content) ? data!.content : []

  if (list.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="chatbubble-ellipses-outline" size={56} color="#CBD5E1" />
        <Text style={styles.hintTitle}>작성한 리뷰가 없습니다</Text>
        <Text style={styles.hintSub}>병원 상세에서 리뷰를 남겨 보세요.</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/search')}>
          <Text style={styles.loginBtnText}>병원 검색</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderItem = ({ item }: { item: MyHospitalReviewItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/hospital/${item.hospitalId}`)}
      activeOpacity={0.85}
    >
      <View style={styles.cardTop}>
        <Text style={styles.hospName} numberOfLines={1}>
          {item.hospitalName}
        </Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons
              key={n}
              name={n <= item.rating ? 'star' : 'star-outline'}
              size={14}
              color="#FBBF24"
            />
          ))}
        </View>
      </View>
      <Text style={styles.date}>{formatDate(item.updatedAt)}</Text>
      {item.comment ? (
        <Text style={styles.comment} numberOfLines={3}>
          {item.comment}
        </Text>
      ) : null}
      <View style={styles.rowEnd}>
        <Text style={styles.more}>상세 보기</Text>
        <Ionicons name="chevron-forward" size={18} color="#0EA5E9" />
      </View>
    </TouchableOpacity>
  )

  return (
    <FlatList
      data={list}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      contentContainerStyle={styles.listPad}
      refreshing={isFetching && !isLoading}
      onRefresh={() => refetch()}
    />
  )
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  listPad: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  hospName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  stars: { flexDirection: 'row', gap: 2 },
  date: { fontSize: 12, color: '#94A3B8', marginBottom: 8 },
  comment: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 10 },
  rowEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  more: { fontSize: 13, fontWeight: '600', color: '#0EA5E9' },
  hintTitle: { fontSize: 17, fontWeight: '600', color: '#334155' },
  hintSub: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  err: { color: '#DC2626', marginBottom: 8, textAlign: 'center' },
  errDetail: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  errHint: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'left',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 16,
    maxWidth: 340,
  },
  retry: { color: '#0EA5E9', fontWeight: '600' },
  loginBtn: {
    marginTop: 8,
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
})
