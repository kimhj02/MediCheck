import { View, StyleSheet } from 'react-native'
import type { Hospital } from '@/types'
import { isPharmacyLike } from '@/lib/mapPlaceKind'

const DOT = 10
const HALF = DOT / 2

type Props = {
  hospital: Hospital
}

/**
 * react-native-maps: 병원·약국 위치만 작은 점으로 표시 (이름은 하단 목록에서 확인)
 * 부모 Marker: anchor={{ x: 0.5, y: 0.5 }}
 */
export function MapPlaceMarker({ hospital }: Props) {
  const pharmacy = isPharmacyLike(hospital)
  return (
    <View
      style={[styles.dot, pharmacy ? styles.dotPharmacy : styles.dotHospital]}
      pointerEvents="none"
    />
  )
}

const styles = StyleSheet.create({
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: HALF,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  dotHospital: {
    backgroundColor: '#0EA5E9',
  },
  dotPharmacy: {
    backgroundColor: '#10B981',
  },
})
