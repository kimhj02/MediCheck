import type { Hospital, NearbyHospital } from '../types/hospital'

const API_BASE = '/api'

export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<NearbyHospital[]> {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radiusMeters: String(radiusMeters),
  })
  const res = await fetch(`${API_BASE}/hospitals/nearby?${params}`)
  if (!res.ok) throw new Error('근처 병원 조회 실패')
  return res.json()
}

export async function fetchHospitalById(id: number): Promise<Hospital | null> {
  const res = await fetch(`${API_BASE}/hospitals/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error('병원 상세 조회 실패')
  return res.json()
}

export async function fetchFavoriteHospitals(token: string): Promise<Hospital[]> {
  const res = await fetch(`${API_BASE}/users/me/favorites`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) throw new Error('로그인이 필요합니다.')
  if (!res.ok) throw new Error('즐겨찾기 병원 조회 실패')
  return res.json()
}

export async function addFavoriteHospital(token: string, hospitalId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/users/me/favorites/${hospitalId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) throw new Error('로그인이 필요합니다.')
  if (!res.ok) throw new Error('즐겨찾기 추가 실패')
}

export async function removeFavoriteHospital(token: string, hospitalId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/users/me/favorites/${hospitalId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (res.status === 401) throw new Error('로그인이 필요합니다.')
  if (!res.ok) throw new Error('즐겨찾기 해제 실패')
}
