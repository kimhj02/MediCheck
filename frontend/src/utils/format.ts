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

/** 카카오맵 길찾기 URL */
export function getKakaoMapUrl(name: string, lat: number, lng: number): string {
  const place = encodeURIComponent(name)
  return `https://map.kakao.com/link/map/${place},${lat},${lng}`
}

/** 네이버지도 길찾기/검색 URL (주소 또는 좌표) */
export function getNaverMapUrl(address: string | null, lat: number | null, lng: number | null): string {
  if (address && address.trim()) {
    return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`
  }
  if (lat != null && lng != null) {
    return `https://map.naver.com/v5/directions/-/-/-/car?c=${lng},${lat},15,0,0,0,dh`
  }
  return 'https://map.naver.com/v5/'
}
