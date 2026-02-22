import { Routes, Route } from 'react-router-dom'
import { MapPage } from './pages/MapPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-14 bg-white/95 backdrop-blur border-b border-gray-100 flex items-center px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800">MediCheck</h1>
            <span className="text-xs text-gray-500">내 주변 안심 병원 찾기</span>
          </div>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<MapPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
