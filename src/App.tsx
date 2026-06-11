import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { Login } from './components/Login'
import { Navigation } from './components/Navigation'
import { Dashboard } from './components/Dashboard'
import { Reservations } from './components/Reservations'
import { Matchmaking } from './components/Matchmaking'
import { Profile } from './components/Profile'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<any>(null)

  const handleLogin = (userData: any) => {
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50">
        <Navigation user={user} onLogout={handleLogout} />
        <main className="container mx-auto px-4 py-6 max-w-7xl">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/reservations" element={<Reservations user={user} />} />
            <Route path="/matchmaking" element={<Matchmaking user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}