import { ScrollView, Text, StyleSheet } from 'react-native'

export default function TermsScreen() {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>이용약관</Text>
      <Text style={styles.p}>
        본 약관은 MediCheck 서비스 이용과 관련한 기본적인 사항을 규정합니다.{'\n\n'}
        실제 서비스 오픈 전 법무 검토를 거쳐 내용이 보완·갱신될 수 있습니다.{'\n\n'}
        • 서비스는 병원·약국 정보 조회, 길찾기, 리뷰 작성 등의 기능을 제공합니다.{'\n'}
        • 회원은 계정 정보를 타인과 공유하지 않아야 합니다.{'\n'}
        • 게시한 리뷰는 운영 정책에 따라 삭제·비공개 처리될 수 있습니다.{'\n'}
        • 서비스는 예고 없이 변경되거나 중단될 수 있습니다.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20, paddingBottom: 40 },
  h1: { fontSize: 20, fontWeight: '700', color: '#1E293B', marginBottom: 16 },
  p: { fontSize: 15, color: '#475569', lineHeight: 24 },
})
