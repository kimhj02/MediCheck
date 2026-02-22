const API_BASE = '/api'

export interface DirectionsResponse {
  path: [number, number][] // [lat, lng][]
  distance: number
  duration: number
}

export async function fetchDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DirectionsResponse> {
  const params = new URLSearchParams({
    originLat: String(originLat),
    originLng: String(originLng),
    destLat: String(destLat),
    destLng: String(destLng),
  })
  const res = await fetch(`${API_BASE}/directions?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? '경로 조회 실패')
  }
  return res.json()
}
