export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = dateStr.split('-')
  if (d.length >= 1 && d[0]) return `${d[0]}년 개원`
  return '-'
}
