import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchFavoriteHospitals } from '../api/hospitals'
import { useAuth } from '../contexts/AuthContext'

export function FavoriteHospitalsPage() {
  const { token, user } = useAuth()

  const {
    data: hospitals = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['favoriteHospitals'],
    queryFn: () => fetchFavoriteHospitals(token!),
    enabled: !!token,
  })

  useEffect(() => {
    if (!token) {
      // 로그인이 풀렸을 때 캐시 초기화 용도로 refetch 비활성
    }
  }, [token])

  if (!token || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md text-center bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-8">
          <div className="text-lg font-semibold text-gray-800 mb-2">내 즐겨찾기 병원</div>
          <p className="text-sm text-gray-600 mb-4">
            즐겨찾기 병원은 로그인 후 확인할 수 있습니다.
          </p>
          <p className="text-xs text-gray-400">
            상단 메뉴의 로그인 버튼을 눌러 먼저 로그인해 주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] px-4 py-6 flex justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">내 즐겨찾기 병원</h2>
            <p className="text-xs text-gray-500 mt-1">
              {user.name || user.loginId}님이 저장한 병원 목록입니다.
            </p>
          </div>
          <div className="text-sm text-gray-500">
            총 <span className="font-semibold text-sky-600">{hospitals.length}</span>곳
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-6 text-center">
            <div className="text-amber-700 font-medium mb-2">즐겨찾기 목록을 불러오지 못했습니다</div>
            <p className="text-sm text-amber-700 mb-4">
              {error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium"
            >
              다시 시도
            </button>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl px-4 py-10 text-center text-sm text-gray-500">
            아직 즐겨찾기한 병원이 없습니다.
            <br />
            지도 화면에서 병원 옆의 별 버튼을 눌러 즐겨찾기를 추가해 보세요.
          </div>
        ) : (
          <div className="space-y-3">
            {hospitals.map((h) => (
              <div
                key={h.id}
                className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-gray-900 truncate">{h.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-amber-700">
                    즐겨찾기
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>{h.department ?? '진료과 정보 없음'}</span>
                  {h.phone && (
                    <>
                      <span className="text-gray-300">•</span>
                      <a
                        href={`tel:${h.phone.replace(/-/g, '')}`}
                        className="text-sky-600 hover:underline"
                      >
                        {h.phone}
                      </a>
                    </>
                  )}
                </div>
                {h.address && (
                  <div className="text-xs text-gray-400 truncate">{h.address}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

