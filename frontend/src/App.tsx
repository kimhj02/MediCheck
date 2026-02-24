import { Link, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { MapPage } from './pages/MapPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { KakaoCallbackPage } from './pages/KakaoCallbackPage'
import { FavoriteHospitalsPage } from './pages/FavoriteHospitalsPage'

function Header() {
  const { user, logout, isLoading } = useAuth()
  return (
    <header className="h-14 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center justify-between px-6 shadow-sm">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
          M
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800">MediCheck</h1>
          <span className="text-xs text-gray-500">내 주변 안심 병원 찾기</span>
        </div>
      </Link>
      <nav className="flex items-center gap-3">
        {isLoading ? (
          <span className="text-sm text-gray-400">...</span>
        ) : user ? (
          <>
            <span className="text-sm text-gray-600">{user.name || user.loginId}</span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
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
          <Route path="/favorites" element={<FavoriteHospitalsPage />} />
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
