export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/** 예상 소요 시간 포맷 (초 → "약 N분") */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return '1분 미만'
  const min = Math.round(seconds / 60)
  return min >= 60 ? `약 ${Math.floor(min / 60)}시간 ${min % 60}분` : `약 ${min}분`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = dateStr.split('-')
  if (d.length >= 1 && d[0]) return `${d[0]}년 개원`
  return '-'
}
