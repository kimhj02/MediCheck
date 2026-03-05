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
  /** 평균 별점 (1~5) */
  averageRating: number | null
  /** 리뷰 개수 */
  reviewCount: number | null
}

export interface NearbyHospital {
  hospital: Hospital
  distanceMeters: number
}
