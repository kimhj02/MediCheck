import Constants from 'expo-constants'
import { useAuthStore } from '@/store/authStore'
import {
  Hospital,
  NearbyHospital,
  HospitalReview,
  Page,
  AuthResponse,
  AuthUser,
  LoginRequest,
  SignupRequest,
  HospitalReviewRequest,
  DirectionsResponse,
} from '@/types'

/** API 서버 주소. .env의 EXPO_PUBLIC_API_URL 또는 app.config.js extra.apiUrl */
const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8080/api'

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    let message = `API Error: ${response.status}`
    try {
      const parsed = JSON.parse(errBody)
      if (parsed?.message) message = parsed.message
    } catch {}
    throw new Error(message)
  }

  if (response.status === 204) return null as T
  return response.json()
}

// ─── 병원 API ────────────────────────────────────────────────────

export async function getHospitals(params?: {
  keyword?: string
  department?: string
  page?: number
  size?: number
}): Promise<Page<Hospital>> {
  const searchParams = new URLSearchParams()
  if (params?.keyword) searchParams.set('keyword', params.keyword)
  if (params?.department) searchParams.set('department', params.department)
  if (params?.page !== undefined) searchParams.set('page', String(params.page))
  if (params?.size) searchParams.set('size', String(params.size))

  return fetchApi(`/hospitals?${searchParams}`)
}

export async function getHospital(id: number): Promise<Hospital> {
  return fetchApi(`/hospitals/${id}`)
}

export async function getNearbyHospitals(
  lat: number,
  lng: number,
  radiusMeters = 3000
): Promise<NearbyHospital[]> {
  return fetchApi(
    `/hospitals/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`
  )
}

// ─── 리뷰 API ────────────────────────────────────────────────────

export async function getHospitalReviews(
  hospitalId: number,
  page = 0,
  size = 10
): Promise<Page<HospitalReview>> {
  return fetchApi(
    `/hospitals/${hospitalId}/reviews?page=${page}&size=${size}`
  )
}

export async function getMyReview(
  hospitalId: number
): Promise<HospitalReview | null> {
  try {
    const token = useAuthStore.getState().token
    if (!token) return null
    const res = await fetch(`${BASE_URL}/hospitals/${hospitalId}/reviews/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 204) return null
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function createOrUpdateReview(
  hospitalId: number,
  data: HospitalReviewRequest
): Promise<HospitalReview> {
  return fetchApi(`/hospitals/${hospitalId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteMyReview(hospitalId: number): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/hospitals/${hospitalId}/reviews/me`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${useAuthStore.getState().token}`,
      },
    }
  )
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
}

// ─── 즐겨찾기 API ────────────────────────────────────────────────────

export async function getFavorites(): Promise<Hospital[]> {
  return fetchApi('/users/me/favorites')
}

export async function addFavorite(hospitalId: number): Promise<void> {
  await fetchApi(`/users/me/favorites/${hospitalId}`, {
    method: 'POST',
  })
}

export async function removeFavorite(hospitalId: number): Promise<void> {
  await fetchApi(`/users/me/favorites/${hospitalId}`, {
    method: 'DELETE',
  })
}

// ─── 인증 API ────────────────────────────────────────────────────

/** 백엔드 응답: { token: string } 또는 { token: string, message: string } */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function signup(data: SignupRequest): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function loginWithKakao(
  code: string,
  redirectUri: string
): Promise<AuthResponse> {
  return fetchApi<AuthResponse>('/auth/login/kakao', {
    method: 'POST',
    body: JSON.stringify({ code, redirectUri }),
  })
}

/** 로그인 후 사용자 정보 조회. Bearer 토큰 필요 */
export async function getMe(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401 || !res.ok) return null
    const data = await res.json()
    if (data?.error) return null
    return {
      userId: data.userId,
      loginId: data.loginId,
      name: data.name ?? '',
    }
  } catch {
    return null
  }
}

// ─── 길찾기 API ────────────────────────────────────────────────────

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DirectionsResponse> {
  return fetchApi(
    `/directions?originLat=${originLat}&originLng=${originLng}&destLat=${destLat}&destLng=${destLng}`
  )
}
