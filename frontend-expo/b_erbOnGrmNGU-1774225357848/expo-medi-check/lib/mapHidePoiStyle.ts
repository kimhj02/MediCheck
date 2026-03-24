/**
 * Google Maps(Android 등)에서 지도 타일의 POI(가게·병원 등)를 숨길 때 사용.
 * react-native-maps `customMapStyle`용 — 앱 마커와 카카오/구글 기본 장소 표시가 겹치는 현상 완화.
 * @see https://developers.google.com/maps/documentation/javascript/style-reference
 */
export const GOOGLE_MAP_HIDE_POI_STYLE: object[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
]
