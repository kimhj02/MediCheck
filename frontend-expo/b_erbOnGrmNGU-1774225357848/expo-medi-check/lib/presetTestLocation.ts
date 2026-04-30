/**
 * 시뮬레이터·DB 테스트용 (구미 옥계 흥안로 46 부근)
 * @see app/(tabs)/index.tsx 동일 좌표
 */
import Constants from 'expo-constants'

const extra = (Constants.expoConfig?.extra || {}) as {
  testPresetLat?: string
  testPresetLng?: string
}

const parsedLat = Number(extra.testPresetLat)
const parsedLng = Number(extra.testPresetLng)

export const PRESET_OKGYE_HEUNGAN_46_LAT = Number.isFinite(parsedLat) ? parsedLat : 36.14715
export const PRESET_OKGYE_HEUNGAN_46_LNG = Number.isFinite(parsedLng) ? parsedLng : 128.41799
