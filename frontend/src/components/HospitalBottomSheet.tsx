import type { NearbyHospital } from '../types/hospital'
import { formatDistance, formatDate } from '../utils/format'

interface HospitalBottomSheetProps {
  item: NearbyHospital
  onClose: () => void
  onOpenReviews: (hospitalId: number) => void
  onRequestDirections: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

function doctorSummary(h: NearbyHospital['hospital']): string | null {
  const total = h.doctorTotalCount ?? 0
  const specialist =
    (h.mdeptSpecialistCount ?? 0) +
    (h.detySpecialistCount ?? 0) +
    (h.cmdcSpecialistCount ?? 0)
  if (total === 0) return null
  if (specialist > 0) return `의사 ${total}명 · 전문의 ${specialist}명`
  return `의사 ${total}명`
}

export function HospitalBottomSheet({
  item,
  onClose,
  onOpenReviews,
  onRequestDirections,
  isFavorite,
  onToggleFavorite,
}: HospitalBottomSheetProps) {
  const h = item.hospital
  const lat = h.latitude ?? 0
  const lng = h.longitude ?? 0
  const hasDirections = lat !== 0 && lng !== 0
  const reviewText =
    h.reviewCount != null && h.reviewCount > 0
      ? `리뷰 ${h.reviewCount}개`
      : null
  const typeAndReview = [h.department, reviewText].filter(Boolean).join(' · ') || '병원'

  return (
    <>
      <div
        className="fixed inset-0 top-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-gray-900 text-white shadow-2xl safe-area-pb max-h-[85vh] flex flex-col sheet-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hospital-sheet-title"
      >
        {/* 드래그 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" aria-hidden />
        </div>

        {/* 헤더: 이름 + 즐겨찾기 + 닫기 */}
        <div className="flex items-start gap-3 px-4 pb-3">
          <h2
            id="hospital-sheet-title"
            className="flex-1 min-w-0 text-lg font-bold leading-snug break-words"
          >
            {h.name}
          </h2>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={onToggleFavorite}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 text-xl"
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
              >
                {isFavorite ? '★' : '☆'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 text-gray-300"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 부제: 타입 · 리뷰 / 거리 · 지역 */}
        <div className="px-4 pb-3 text-sm text-gray-300">
          <span>{typeAndReview}</span>
          <span className="mx-2">·</span>
          <span>{formatDistance(item.distanceMeters)}</span>
          {h.address && (
            <>
              <span className="mx-2">·</span>
              <span className="truncate block mt-0.5">{h.address}</span>
            </>
          )}
        </div>

        {/* 액션 버튼: 출발 / 도착 / 리뷰 (네이버 스타일 3버튼) */}
        <div className="px-4 pb-4 flex gap-2">
          {hasDirections && (
            <button
              type="button"
              onClick={() => {
                onRequestDirections()
                onClose()
              }}
              className="flex-1 min-h-[44px] rounded-xl bg-sky-500 hover:bg-sky-600 font-medium text-sm text-white"
            >
              앱 내 길찾기
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onOpenReviews(h.id)
            }}
            className="flex-1 min-h-[44px] rounded-xl bg-gray-700 hover:bg-gray-600 font-medium text-sm text-white"
          >
            리뷰 보기
          </button>
        </div>

        {/* 상세 정보 (흰 배경) */}
        <div className="flex-1 overflow-y-auto rounded-t-2xl bg-white text-gray-700 px-4 py-4">
          {h.phone && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100">
              <span className="text-gray-400" aria-hidden>📞</span>
              <a
                href={`tel:${h.phone.replace(/-/g, '')}`}
                className="text-sky-600 font-medium"
              >
                {h.phone}
              </a>
            </div>
          )}
          {h.address && (
            <div className="flex items-start gap-2 py-2 border-b border-gray-100">
              <span className="text-gray-400 shrink-0" aria-hidden>📍</span>
              <span className="text-sm break-words">{h.address}</span>
            </div>
          )}
          {doctorSummary(h) && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100 text-sm">
              <span className="text-gray-400" aria-hidden>👨‍⚕️</span>
              <span>{doctorSummary(h)}</span>
            </div>
          )}
          {h.establishedDate && (
            <div className="flex items-center gap-2 py-2 border-b border-gray-100 text-sm">
              <span className="text-gray-400" aria-hidden>📅</span>
              <span>{formatDate(h.establishedDate)}</span>
            </div>
          )}
          <p className="text-xs text-gray-400 pt-2">
            ※ 진료 시간은 병원에 문의해 주세요
          </p>
        </div>
      </div>
    </>
  )
}
