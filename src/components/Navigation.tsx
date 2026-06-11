import { Link, useLocation } from 'react-router-dom'
import { Home, Calendar, Users, User, LogOut } from 'lucide-react'

interface NavigationProps {
    user: any
    onLogout: () => void
}

export function Navigation({ user, onLogout }: NavigationProps) {
    const location = useLocation()

    const navItems = [
        { path: '/', label: 'Inicio', icon: Home },
        { path: '/reservations', label: 'Reservas', icon: Calendar },
        { path: '/matchmaking', label: 'Matchmaking', icon: Users },
        { path: '/profile', label: 'Perfil', icon: User },
    ]

    return (
        <nav className="bg-white shadow-md border-b border-gray-200">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                <div className="w-8 h-10 bg-red-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">U</span>
                                </div>
                                <div className="w-8 h-10 bg-black flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">T</span>
                                </div>
                                <div className="w-8 h-10 bg-red-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">P</span>
                                </div>
                            </div>
                            <span className="font-bold text-xl text-gray-800">UTP Play</span>
                        </div>
                        <div className="hidden md:flex gap-2">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon size={18} />
                                        <span className="font-medium">{item.label}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-medium text-gray-800">{user?.name}</p>
                                <p className="text-sm text-gray-500">{user?.studentId}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold">
                                {user?.name?.charAt(0)}
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
                <div className="md:hidden flex gap-1 pb-2 overflow-x-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${isActive ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}