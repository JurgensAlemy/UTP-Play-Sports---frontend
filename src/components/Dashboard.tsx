import { Calendar, Trophy, Clock, MapPin, ChevronRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { reservaService, matchmakingService } from '../services/api'
import { LiveMatch } from './LiveMatch'

interface DashboardProps {
    user: any
}

const parseHorario = (horario: string) => {
    const partes = horario.split('-').map(p => p.trim())
    return partes.length === 2 ? { inicio: partes[0], fin: partes[1] } : null
}

const combinarFechaHora = (fecha: string, hora: string) => {
    const [h, m] = hora.split(':').map(Number)
    const d = new Date(fecha + 'T00:00:00')
    d.setHours(h, m, 0, 0)
    return d
}

const getInicioFin = (fecha: string, horario: string) => {
    const rango = parseHorario(horario)
    if (!rango) return null
    return { inicio: combinarFechaHora(fecha, rango.inicio), fin: combinarFechaHora(fecha, rango.fin) }
}

const estaEnCurso = (fecha: string, horario: string) => {
    const rango = getInicioFin(fecha, horario)
    if (!rango) return false
    const now = new Date()
    return now >= rango.inicio && now <= rango.fin
}

const yaVencio = (fecha: string, horario: string) => {
    const rango = getInicioFin(fecha, horario)
    if (!rango) return false
    return new Date() > rango.fin
}

export function Dashboard({ user }: DashboardProps) {
    const [reservasActivas, setReservasActivas] = useState<any[]>([])
    const [conexiones, setConexiones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const cargarDatos = () => {
        Promise.all([
            reservaService.getReservasByUsuario(user.studentId),
            matchmakingService.getConexiones(user.studentId),
        ])
            .then(([reservas, conex]) => {
                const activas = Array.isArray(reservas) ? reservas.filter((r: any) => r.estado === 'CONFIRMADA') : []
                setReservasActivas(activas)
                setConexiones(Array.isArray(conex) ? conex : [])

                // Limpieza automática: borra del historial las reservas confirmadas cuyo bloque ya pasó
                const vencidas = activas.filter((r: any) => yaVencio(r.fecha, r.horario))
                if (vencidas.length > 0) {
                    Promise.all(vencidas.map((r: any) => reservaService.eliminarReserva(r.id, user.studentId).catch(() => { })))
                        .then(() => {
                            // Recarga silenciosa tras limpiar, sin pedir confirmación al usuario
                            reservaService.getReservasByUsuario(user.studentId).then((res: any) => {
                                setReservasActivas(Array.isArray(res) ? res.filter((r: any) => r.estado === 'CONFIRMADA') : [])
                            })
                        })
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        cargarDatos()
        // Revisa cada minuto si alguna reserva venció, para que se vaya borrando sola sin recargar la página
        const t = setInterval(cargarDatos, 60000)
        return () => clearInterval(t)
    }, [user.studentId])

    const horasJugadas = reservasActivas.length
    const proximaReserva = reservasActivas
        .slice()
        .sort((a, b) => new Date(a.fecha + 'T' + a.horario.split('-')[0].trim()).getTime() - new Date(b.fecha + 'T' + b.horario.split('-')[0].trim()).getTime())[0]

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        )
    }

    const enCurso = proximaReserva ? estaEnCurso(proximaReserva.fecha, proximaReserva.horario) : false

    return (
        <div className="space-y-5 lg:space-y-8">
            {/* Header Hero al estilo Login */}
            <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl">
                <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-1 lg:mb-2">
                    Hola, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-red-100 text-sm lg:text-base opacity-90">¿Listo para jugar hoy?</p>
            </div>

            {/* Partido en vivo — solo aparece si hay alguno en curso ahora mismo */}
            <LiveMatch />

            {/* Stats con Glassmorphism */}
            <div className="flex lg:grid lg:grid-cols-3 gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                <div className="flex-shrink-0 lg:flex-shrink bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/5 shadow-sm px-5 py-4 lg:p-6 min-w-[120px] lg:min-w-0">
                    <Calendar className="text-red-600 dark:text-red-500 mb-2" size={20} />
                    <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{reservasActivas.length}</p>
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Reservas activas</p>
                </div>
                <div className="flex-shrink-0 lg:flex-shrink bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/5 shadow-sm px-5 py-4 lg:p-6 min-w-[120px] lg:min-w-0">
                    <Clock className="text-red-600 dark:text-red-500 mb-2" size={20} />
                    <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{horasJugadas}h</p>
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Próximas horas</p>
                </div>
                <div className="flex-shrink-0 lg:flex-shrink bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl rounded-3xl border border-white/50 dark:border-white/5 shadow-sm px-5 py-4 lg:p-6 min-w-[120px] lg:min-w-0">
                    <Trophy className="text-red-600 dark:text-red-500 mb-2" size={20} />
                    <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{conexiones.length}</p>
                    <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">Conexiones</p>
                </div>
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-5 lg:space-y-0">
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">Tu próxima reserva</h2>
                        {reservasActivas.length > 0 && (
                            <Link to="/reservations" className="text-red-600 dark:text-red-400 text-xs lg:text-sm font-bold flex items-center gap-0.5 hover:text-red-700 dark:hover:text-red-300 transition-colors">
                                Ver todas <ChevronRight size={16} />
                            </Link>
                        )}
                    </div>
                    {!proximaReserva ? (
                        <Link
                            to="/reservations"
                            className="flex flex-col items-center justify-center gap-3 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-10 lg:py-16 hover:border-red-400 dark:hover:border-red-500 active:scale-[0.98] transition-all group"
                        >
                            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white dark:bg-gray-800 shadow-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="text-red-600" size={24} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm lg:text-base font-bold text-gray-900 dark:text-white">No tienes reservas</p>
                                <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Toca para separar una cancha</p>
                            </div>
                        </Link>
                    ) : (
                        <Link
                            to="/reservations"
                            className="block bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 lg:p-7 shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="inline-block px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] lg:text-xs font-bold mb-3">
                                        {proximaReserva.deporte}
                                    </span>
                                    <p className="font-black text-xl lg:text-3xl text-gray-900 dark:text-white">{proximaReserva.cancha}</p>
                                </div>
                                {enCurso ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-full text-[10px] lg:text-xs font-bold uppercase">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                        En curso
                                    </span>
                                ) : (
                                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-[10px] lg:text-xs font-bold">
                                        {proximaReserva.estado}
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-sm lg:text-base text-gray-600 dark:text-gray-300 font-medium">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-red-600" size={16} />
                                    <span>{new Date(proximaReserva.fecha + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="text-red-600" size={16} />
                                    <span>{proximaReserva.horario}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="text-red-600" size={16} />
                                    <span>{proximaReserva.cancha}</span>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>

                <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg mb-3 lg:mb-4">Accesos rápidos</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                        <Link
                            to="/reservations"
                            className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 hover:border-red-300 dark:hover:border-red-500 active:scale-[0.98] transition-all"
                        >
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Calendar className="text-red-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Reservar</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Cancha disponible</p>
                            </div>
                        </Link>
                        <Link
                            to="/matchmaking"
                            className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-4 lg:p-5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 hover:border-red-300 dark:hover:border-red-500 active:scale-[0.98] transition-all"
                        >
                            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Trophy className="text-red-600" size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Matchmaking</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">Busca compañeros</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}