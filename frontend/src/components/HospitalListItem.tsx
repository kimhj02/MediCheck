import type { NearbyHospital } from '../types/hospital'
import { formatDistance } from '../utils/format'

interface HospitalListItemProps {
  item: NearbyHospital
  onClick?: () => void
}

export function HospitalListItem({ item, onClick }: HospitalListItemProps) {
  const h = item.hospital
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 rounded-xl hover:bg-sky-50 active:bg-sky-100 transition-colors border border-transparent hover:border-sky-100"
    >
      <div className="font-semibold text-gray-800 text-sm truncate">{h.name}</div>
      <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
        <span>{h.department ?? '-'}</span>
        <span className="text-sky-600 font-medium">{formatDistance(item.distanceMeters)}</span>
      </div>
      {h.address && (
        <div className="text-xs text-gray-400 truncate mt-0.5">{h.address}</div>
      )}
    </button>
  )
}
