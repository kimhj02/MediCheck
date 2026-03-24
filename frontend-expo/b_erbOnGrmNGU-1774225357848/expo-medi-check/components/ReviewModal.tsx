import { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyReview, createOrUpdateReview, deleteMyReview } from '@/lib/api'

interface ReviewModalProps {
  visible: boolean
  hospitalId: number
  onClose: () => void
}

export default function ReviewModal({
  visible,
  hospitalId,
  onClose,
}: ReviewModalProps) {
  const queryClient = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const { data: myReview, isLoading } = useQuery({
    queryKey: ['myReview', hospitalId],
    queryFn: () => getMyReview(hospitalId),
    enabled: visible,
  })

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating)
      setComment(myReview.comment ?? '')
    } else {
      setRating(5)
      setComment('')
    }
  }, [myReview])

  const submitMutation = useMutation({
    mutationFn: () => createOrUpdateReview(hospitalId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['myReview', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['myReviews'] })
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] })
      Alert.alert('완료', '리뷰가 등록되었습니다.')
      onClose()
    },
    onError: () => {
      Alert.alert('오류', '리뷰 등록에 실패했습니다.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMyReview(hospitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['myReview', hospitalId] })
      queryClient.invalidateQueries({ queryKey: ['myReviews'] })
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] })
      Alert.alert('완료', '리뷰가 삭제되었습니다.')
      onClose()
    },
    onError: () => {
      Alert.alert('오류', '리뷰 삭제에 실패했습니다.')
    },
  })

  const handleSubmit = () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('알림', '별점을 선택해 주세요.')
      return
    }
    submitMutation.mutate()
  }

  const handleDelete = () => {
    Alert.alert('리뷰 삭제', '정말 리뷰를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ])
  }

  const isSubmitting = submitMutation.isPending || deleteMutation.isPending

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {myReview ? '리뷰 수정' : '리뷰 작성'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#0EA5E9" />
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.ratingSection}>
                <Text style={styles.label}>별점</Text>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setRating(star)}
                    >
                      <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={36}
                        color={star <= rating ? '#FBBF24' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.commentSection}>
                <Text style={styles.label}>후기 (선택)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="병원 이용 후기를 작성해 주세요"
                  placeholderTextColor="#94A3B8"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={500}
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
              </View>

              <View style={styles.actions}>
                {myReview && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={handleDelete}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitting && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {myReview ? '수정하기' : '등록하기'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  loading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  content: {
    paddingTop: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    gap: 8,
  },
  commentSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0EA5E9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
})
