import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Navigation } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { Reservations } from './components/Reservations'
import { Matchmaking } from './components/Matchmaking'
import { Profile } from './components/Profile'
import { Chat } from './components/Chat'
import { Login } from './components/Login'
import { Register } from './components/Register'
import { SplashScreen } from './components/SplashScreen'
import { AnimatedBackground } from './components/AnimatedBackground'
import { PageTransition } from './components/PageTransition'

type AuthScreen = 'login' | 'register'

function AnimatedRoutes({ user, onFotoChange }: { user: any, onFotoChange: (url: string) => void }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard user={user} /></PageTransition>} />
        <Route path="/reservations" element={<PageTransition><Reservations user={user} /></PageTransition>} />
        <Route path="/matchmaking" element={<PageTransition><Matchmaking user={user} /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile user={user} onFotoChange={onFotoChange} /></PageTransition>} />
        <Route path="/chat" element={<PageTransition><Chat user={user} /></PageTransition>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null)

  const handleLogin = async (userData: any) => {
    setIsAuthenticated(true)
    setUser(userData)
    // Cargar foto de perfil al login
    try {
      const res = await fetch(`http://localhost:8080/api/usuarios/${userData.studentId}`)
      const perfil = await res.json()
      if (perfil.fotoPerfil) setFotoPerfil(perfil.fotoPerfil)
    } catch { }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    setFotoPerfil(null)
    setAuthScreen('login')
  }

  if (showSplash) return <SplashScreen onDone={() => setShowSplash(false)} />

  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return <Register onGoToLogin={() => setAuthScreen('login')} onRegistered={() => setAuthScreen('login')} />
    }
    return <Login onLogin={handleLogin} onGoToRegister={() => setAuthScreen('register')} />
  }

  return (
    <BrowserRouter>
      <AnimatedBackground />
      <div className="min-h-screen bg-transparent transition-colors">
        <Navigation user={user} onLogout={handleLogout} fotoPerfil={fotoPerfil} />
        <main className="lg:ml-64 pb-24 lg:pb-8 pt-4 lg:pt-8 px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <AnimatedRoutes user={user} onFotoChange={setFotoPerfil} />
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}