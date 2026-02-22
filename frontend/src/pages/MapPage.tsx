import { useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchNearbyHospitals } from '../api/hospitals'
import { HospitalMap, type HospitalMapHandle } from '../components/HospitalMap'
import { HospitalListItem } from '../components/HospitalListItem'
import { useGeolocation } from '../hooks/useGeolocation'
import { useKakaoMapScript } from '../hooks/useKakaoMapScript'
import type { NearbyHospital } from '../types/hospital'

const RADIUS_OPTIONS = [
  { value: 1000, label: '1km' },
  { value: 3000, label: '3km' },
  { value: 5000, label: '5km' },
  { value: 10000, label: '10km' },
]

function filterHospitals(
  items: NearbyHospital[],
  keyword: string,
  department: string
): NearbyHospital[] {
  let result = items
  if (keyword.trim()) {
    const k = keyword.trim().toLowerCase()
    result = result.filter(
      (i) =>
        i.hospital.name.toLowerCase().includes(k) ||
        (i.hospital.address?.toLowerCase().includes(k) ?? false) ||
        (i.hospital.department?.toLowerCase().includes(k) ?? false)
    )
  }
  if (department) {
    result = result.filter(
      (i) => i.hospital.department?.toLowerCase().includes(department.toLowerCase()) ?? false
    )
  }
  return result
}

export function MapPage() {
  const [radius, setRadius] = useState(3000)
  const [isListOpen, setIsListOpen] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const mapRef = useRef<HospitalMapHandle>(null)

  const { loaded: mapLoaded, error: mapError } = useKakaoMapScript()
  const { latitude, longitude, loading: geoLoading, error: geoError } = useGeolocation()

  const { data: hospitals = [], isLoading: hospitalsLoading } = useQuery({
    queryKey: ['nearbyHospitals', latitude, longitude, radius],
    queryFn: () => fetchNearbyHospitals(latitude!, longitude!, radius),
    enabled: !!latitude && !!longitude,
  })

  const departments = useMemo(() => {
    const set = new Set<string>()
    hospitals.forEach((i) => {
      if (i.hospital.department?.trim()) set.add(i.hospital.department.trim())
    })
    return Array.from(set).sort()
  }, [hospitals])

  const filteredHospitals = useMemo(
    () => filterHospitals(hospitals, searchKeyword, departmentFilter),
    [hospitals, searchKeyword, departmentFilter]
  )

  if (mapError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="text-center max-w-md">
          <div className="text-red-500 font-medium">카카오 지도 로드 실패</div>
          <p className="mt-2 text-sm text-gray-500">
            .env에 VITE_KAKAO_APP_KEY를 설정하고 카카오 디벨로퍼스에 localhost:5173을 등록하세요.
          </p>
        </div>
      </div>
    )
  }

  if (geoError) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-6">
        <div className="text-center max-w-md bg-amber-50 rounded-2xl p-8 border border-amber-100">
          <div className="text-amber-700 font-medium">위치 권한이 필요합니다</div>
          <p className="mt-2 text-sm text-amber-600">
            브라우저에서 위치 접근을 허용해 주세요.
          </p>
        </div>
      </div>
    )
  }

  if (!mapLoaded || geoLoading || (latitude === null && longitude === null)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">지도 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (latitude === null || longitude === null) {
    return null
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* 병원 목록 패널 */}
      <aside
        className={`shrink-0 bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ${
          isListOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">근처 병원</h2>
              <button
                type="button"
                onClick={() => setIsListOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label="목록 닫기"
              >
                ◀
              </button>
            </div>
            <button
              type="button"
              onClick={() => mapRef.current?.panTo(latitude, longitude)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium shadow-sm"
              aria-label="내 위치로 이동"
            >
              <span aria-hidden>📍</span>
              내 위치로 이동
            </button>

            <div className="mt-3 space-y-2">
              <input
                type="search"
                placeholder="병원명, 주소, 진료과 검색"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white"
              >
                <option value="">전체 진료과</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
            {hospitalsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">병원이 없습니다</div>
            ) : filteredHospitals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                검색 결과가 없습니다
              </div>
            ) : (
              filteredHospitals.map((item) => (
                <HospitalListItem
                  key={item.hospital.id}
                  item={item}
                  onClick={() => mapRef.current?.showHospitalPopup(item)}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <HospitalMap
          ref={mapRef}
          centerLat={latitude}
          centerLng={longitude}
          hospitals={filteredHospitals}
        />

        {/* 플로팅 컨트롤 */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRadius(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  radius === opt.value
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'bg-white/95 text-gray-600 hover:bg-white shadow'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="px-4 py-2 bg-white/95 rounded-xl shadow text-sm text-gray-600">
              <span className="font-semibold text-sky-600">{filteredHospitals.length}</span>
              {filteredHospitals.length !== hospitals.length
                ? ` / ${hospitals.length}`
                : ''}
              개 병원
            </div>
            {!isListOpen && (
              <button
                type="button"
                onClick={() => setIsListOpen(true)}
                className="p-2.5 bg-white/95 rounded-xl shadow hover:bg-white"
                aria-label="목록 열기"
              >
                ▶
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
