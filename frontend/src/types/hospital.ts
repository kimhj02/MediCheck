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
}

export interface NearbyHospital {
  hospital: Hospital
  distanceMeters: number
}
