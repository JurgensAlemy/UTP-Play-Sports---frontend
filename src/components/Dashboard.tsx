import { Calendar, Users, Trophy, TrendingUp, MapPin, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { reservaService } from '../services/api'

interface DashboardProps {
    user: any
}

export function Dashboard({ user }: DashboardProps) {
    const [reservasActivas, setReservasActivas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        reservaService.getReservasByUsuario(user.studentId)
            .then(data => {
                const activas = Array.isArray(data) ? data.filter((r: any) => r.estado === 'CONFIRMADA') : []
                setReservasActivas(activas)
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }, [user.studentId])

    const stats = [
        { label: 'Reservas Activas', value: loading ? '...' : String(reservasActivas.length), icon: Calendar },
        { label: 'Partidos Jugados', value: '24', icon: Trophy },
        { label: 'Amigos Conectados', value: '18', icon: Users },
        { label: 'Horas Jugadas', value: `${reservasActivas.length}h`, icon: Clock },
    ]

    const matchmakingRequests = [
        { id: 1, user: 'Carlos M.', sport: 'Fútbol', level: 'Intermedio', time: 'Hace 2 horas' },
        { id: 2, user: 'Ana G.', sport: 'Básquetbol', level: 'Avanzado', time: 'Hace 5 horas' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Bienvenido, {user?.name?.split(' ')[0]}
                </h1>
                <p className="text-gray-600">Gestiona tus reservas y encuentra compañeros de juego</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                                    <Icon className="text-red-500" size={24} />
                                </div>
                                <TrendingUp className="text-green-500" size={18} />
                            </div>
                            <p className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-600">{stat.label}</p>
                        </div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Próximas reservas reales */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Próximas Reservas</h2>
                        <Link to="/reservations" className="text-red-600 hover:text-red-700 font-medium text-sm">
                            Ver todas
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : reservasActivas.length === 0 ? (
                        <div className="text-center py-10">
                            <Calendar className="mx-auto text-gray-300 mb-3" size={48} />
                            <p className="text-gray-500 font-medium">No tienes reservas activas</p>
                            <Link
                                to="/reservations"
                                className="inline-block mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
                            >
                                Reservar ahora
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reservasActivas.slice(0, 3).map((r) => (
                                <div key={r.id} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-800 mb-1">{r.deporte}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin size={14} />
                                                <span>{r.cancha}</span>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                            {r.estado}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            <span>{new Date(r.fecha).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>{r.horario}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Matchmaking (mock por ahora) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Matchmaking</h2>
                        <Link to="/matchmaking" className="text-red-600 hover:text-red-700 font-medium text-sm">
                            Ver más
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {matchmakingRequests.map((request) => (
                            <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-semibold text-gray-800">{request.user}</p>
                                        <p className="text-sm text-gray-600">{request.sport}</p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                        {request.level}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500">{request.time}</p>
                            </div>
                        ))}
                        <Link
                            to="/matchmaking"
                            className="block w-full py-3 text-center bg-gradient-to-r from-red-600 to-black text-white font-semibold rounded-lg hover:from-red-700 hover:to-gray-900 transition-all"
                        >
                            Buscar Compañeros
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}