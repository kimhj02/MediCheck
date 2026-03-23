/**
 * 지도 탭「검색 반경」옵션 (미터)
 * - 전체: 백엔드 상한(50km)과 동일 — 실질적으로 반경 제한 없이 조회
 */
export const RADIUS_OPTIONS = [
  { value: 1000, label: '1km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
  /** 서버 `MAX_RADIUS_METERS`(50_000)와 맞춤 */
  { value: 50_000, label: '전체' },
] as const

export const DEFAULT_RADIUS_METERS = 3000
