import { Link, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MapPage } from './pages/MapPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { KakaoCallbackPage } from './pages/KakaoCallbackPage'
import { FavoriteHospitalsPage } from './pages/FavoriteHospitalsPage'

function Header() {
  const { user, logout, isLoading } = useAuth()
  return (
    <header className="h-14 min-h-[44px] bg-white/95 backdrop-blur border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 shadow-sm safe-area-pt">
      <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-labelledby="app-logo-title">
            <title id="app-logo-title">MediCheck 로고</title>
            <path d="M11 4v16h2V4h-2zm-7 7h16v2H4v-2z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-gray-800 truncate">MediCheck</h1>
          <span className="hidden sm:inline text-xs text-gray-500">내 주변 안심 병원 찾기</span>
        </div>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
        {isLoading ? (
          <span className="text-sm text-gray-400">...</span>
        ) : user ? (
          <>
            <span className="text-sm text-gray-600 truncate min-w-0 max-w-[120px] sm:max-w-none" title={user.name || user.loginId}>
              {user.name || user.loginId}
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700 shrink-0 whitespace-nowrap"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-sky-600">
              로그인
            </Link>
            <span className="text-gray-300">|</span>
            <Link to="/signup" className="text-sm font-medium text-sky-600 hover:underline">
              회원가입
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <span className="text-sm text-gray-400">...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/oauth/kakao/callback" element={<KakaoCallbackPage />} />
          <Route
            path="/favorites"
            element={
              <RequireAuth>
                <FavoriteHospitalsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
