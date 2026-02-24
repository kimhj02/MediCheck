import type { NearbyHospital } from '../types/hospital'
import { formatDistance } from '../utils/format'

interface HospitalListItemProps {
  item: NearbyHospital
  onClick?: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function HospitalListItem({
  item,
  onClick,
  isFavorite,
  onToggleFavorite,
}: HospitalListItemProps) {
  const h = item.hospital
  return (
    <div
      className="w-full px-4 py-3 rounded-xl hover:bg-sky-50 active:bg-sky-100 transition-colors border border-transparent hover:border-sky-100 cursor-pointer"
      onClick={onClick}
      role="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-800 text-sm truncate">{h.name}</div>
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-lg flex-shrink-0"
            aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
        <span className="truncate mr-2">{h.department ?? '-'}</span>
        <span className="text-sky-600 font-medium flex-shrink-0">
          {formatDistance(item.distanceMeters)}
        </span>
      </div>
      {h.address && (
        <div className="text-xs text-gray-400 truncate mt-0.5">{h.address}</div>
      )}
    </div>
  )
}
