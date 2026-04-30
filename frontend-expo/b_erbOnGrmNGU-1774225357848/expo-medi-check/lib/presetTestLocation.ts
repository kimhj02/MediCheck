/**
 * 시뮬레이터·DB 테스트용 (구미 옥계 흥안로 46 부근)
 * @see app/(tabs)/index.tsx 동일 좌표
 */
import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra || {}) as {
  testPresetLat?: string
  testPresetLng?: string
}

function parseCoord(raw: string | undefined, fallback: number): number {
  if (raw == null) return fallback
  const s = String(raw).trim()
  if (s === '') return fallback
  const n = Number(s)
  return Number.isFinite(n) ? n : fallback
}

export const PRESET_OKGYE_HEUNGAN_46_LAT = parseCoord(extra.testPresetLat, 36.14715)
export const PRESET_OKGYE_HEUNGAN_46_LNG = parseCoord(extra.testPresetLng, 128.41799)
