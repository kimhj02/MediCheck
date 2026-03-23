// ─── 병원 관련 ────────────────────────────────────────────────────

export interface HospitalEvaluationSummary {
  ykiho: string | null
  yadmNm: string | null
  clCd: string | null
  clCdNm: string | null
  addr: string | null
  asmGrd01: string | null
  asmGrd03: string | null
  asmGrd04: string | null
  asmGrd05: string | null
  asmGrd06: string | null
  asmGrd07: string | null
  asmGrd08: string | null
  asmGrd09: string | null
  asmGrd10: string | null
  asmGrd12: string | null
  asmGrd13: string | null
  asmGrd14: string | null
  asmGrd15: string | null
  asmGrd16: string | null
  asmGrd17: string | null
  asmGrd18: string | null
  asmGrd19: string | null
  asmGrd20: string | null
  asmGrd21: string | null
  asmGrd22: string | null
  asmGrd23: string | null
  asmGrd24: string | null
}

export interface HospitalTop5Summary {
  crtrYm: string | null
  diseaseNm1: string | null
  diseaseNm2: string | null
  diseaseNm3: string | null
  diseaseNm4: string | null
  diseaseNm5: string | null
}

export interface Hospital {
  id: number
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  phone: string | null
  publicCode: string | null
  department: string | null
  doctorTotalCount: number | null
  establishedDate: string | null
  mdeptSpecialistCount: number | null
  mdeptGeneralCount: number | null
  mdeptInternCount: number | null
  mdeptResidentCount: number | null
  detySpecialistCount: number | null
  cmdcSpecialistCount: number | null
  averageRating: number | null
  reviewCount: number | null
  evaluation: HospitalEvaluationSummary | null
  top5: HospitalTop5Summary | null
}

export interface NearbyHospital {
  hospital: Hospital
  distanceMeters: number
}

// ─── 리뷰 관련 ────────────────────────────────────────────────────

export interface HospitalReview {
  id: number
  userId: number
  userDisplayName: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface HospitalReviewRequest {
  rating: number
  comment?: string
}

// ─── 페이지네이션 ────────────────────────────────────────────────────

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

// ─── 인증 관련 ────────────────────────────────────────────────────

export interface AuthUser {
  userId: number
  loginId: string
  name: string
}

export interface LoginRequest {
  loginId: string
  password: string
}

export interface SignupRequest {
  loginId: string
  password: string
  name: string
}

/** 백엔드 로그인/회원가입 응답 (user는 getMe()로 별도 조회) */
export interface AuthResponse {
  token: string
  message?: string
}

// ─── 길찾기 ────────────────────────────────────────────────────

export interface DirectionsResponse {
  path: [number, number][]
  distance: number
  duration: number
}
