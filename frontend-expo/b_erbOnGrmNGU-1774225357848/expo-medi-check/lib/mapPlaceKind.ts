import type { Hospital } from '@/types'

/** 지도 마커용: 약국 vs 그 외(병원·의원 등) */
export function isPharmacyLike(h: Hospital): boolean {
  const nm = (h.name ?? '').trim()
  if (nm.includes('약국')) return true
  const dept = (h.department ?? '').trim()
  if (dept.includes('약국')) return true
  const cl = h.evaluation?.clCdNm?.trim() ?? ''
  if (cl.includes('약국')) return true
  return false
}
