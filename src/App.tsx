import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Navigation } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { Reservations } from './components/Reservations'
import { Matchmaking } from './components/Matchmaking'
import { Profile } from './components/Profile'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { SplashScreen } from './components/SplashScreen'
import { AnimatedBackground } from './components/AnimatedBackground'

type AuthScreen = 'login' | 'register'

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setAuthScreen('login')
  }

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />
  }

  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return (
        <Register
          onGoToLogin={() => setAuthScreen('login')}
          onRegistered={() => setAuthScreen('login')}
        />
      )
    }
    return (
      <Login
        onLogin={handleLogin}
        onGoToRegister={() => setAuthScreen('register')}
      />
    )
  }

  return (
    <BrowserRouter>
      {/* Fondo animado global — una sola vez, fixed e independiente del resto */}
      <AnimatedBackground />

      <div className="min-h-screen bg-transparent transition-colors">
        <Navigation user={user} onLogout={handleLogout} />
        <main className="lg:ml-64 pb-24 lg:pb-8 pt-4 lg:pt-8 px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/reservations" element={<Reservations user={user} />} />
              <Route path="/matchmaking" element={<Matchmaking user={user} />} />
              <Route path="/profile" element={<Profile user={user} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}