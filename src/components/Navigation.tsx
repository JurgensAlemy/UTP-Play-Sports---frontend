import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Users, User, LogOut, Moon, Sun, MessageCircle } from 'lucide-react'
import { useTheme } from './ThemeProvider'

import { useUnread } from './UnreadContext'

interface NavigationProps {
    user: any
    onLogout: () => void
    fotoPerfil: string | null
}

export function Navigation({ user, onLogout, fotoPerfil }: NavigationProps) {
    const location = useLocation()
    const { isDark, toggle } = useTheme()
    const { totalUnread } = useUnread()

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home, badge: 0 },
        { path: '/reservations', label: 'Reservas', icon: Calendar, badge: 0 },
        { path: '/matchmaking', label: 'Match', icon: Users, badge: 0 },
        { path: '/chat', label: 'Chat', icon: MessageCircle, badge: totalUnread },
        { path: '/profile', label: 'Perfil', icon: User, badge: 0 },
    ]

    return (
        <>
            {/* Top bar móvil */}
            <header className="lg:hidden sticky top-0 z-40 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between h-20 px-4">
                    <Link to="/">
                        <img
                            src="/utp-play.png"
                            alt="UTP Play"
                            className="h-30 w-auto object-contain active:scale-95 transition-transform"
                            style={{ filter: isDark ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6)) brightness(1.3)' : 'none' }}
                        />
                    </Link>

                    <div className="flex items-center gap-1">
                        <button onClick={toggle} className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white active:scale-95 transition-all" aria-label="Cambiar tema">
                            {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <Link to="/profile" className="flex items-center gap-2 ml-1">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {fotoPerfil
                                    ? <img src={`http://localhost:8080${fotoPerfil}`} alt="perfil" className="w-full h-full object-cover" />
                                    : user?.name?.charAt(0)
                                }
                            </div>
                        </Link>
                        <button onClick={onLogout} className="p-2 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white active:scale-95 transition-all" aria-label="Cerrar sesión">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Bottom tabs móvil — ahora con 5 items, ajustamos texto más pequeño */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full active:scale-95 transition-transform">
                                <div className={`relative p-1.5 rounded-xl transition-colors ${isActive ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                    <Icon size={20} className={isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Sidebar desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 bg-white/80 dark:bg-[#0f0f0f]/80 backdrop-blur-xl border-r border-gray-100 dark:border-white/5 z-40">
                <div className="flex items-center justify-center px-6 h-20 border-b border-gray-100 dark:border-white/5">
                    <Link to="/">
                        <img
                            src="/utp-play.png"
                            alt="UTP Play"
                            className="h-40 w-auto object-contain active:scale-95 transition-transform"
                            style={{ filter: isDark ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6)) brightness(1.3)' : 'none' }}
                        />
                    </Link>
                </div>

                <div className="flex-1 px-3 py-6 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link key={item.path} to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${isActive ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
                                    }`}
                            >
                                <div className="relative">
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                    {item.badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </span>
                                    )}
                                </div>
                                {item.label}
                            </Link>
                        )
                    })}
                </div>

                <div className="px-3 py-4 border-t border-gray-100 dark:border-white/5 space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-700 rounded-full overflow-hidden flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {fotoPerfil
                                ? <img src={`http://localhost:8080${fotoPerfil}`} alt="perfil" className="w-full h-full object-cover" />
                                : user?.name?.charAt(0)
                            }
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-white text-sm truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.studentId}</p>
                        </div>
                    </div>
                    <button onClick={toggle} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white transition-colors">
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                        {isDark ? 'Modo claro' : 'Modo oscuro'}
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        <LogOut size={18} />
                        Cerrar sesión
                    </button>
                </div>
            </aside>
        </>
    )
}