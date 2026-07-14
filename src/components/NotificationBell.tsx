import { useState } from 'react'
import { Bell } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from './NotificationContext'

const sportEmoji = (s: string) => {
    switch (s) {
        case 'Fútbol': return '⚽'
        case 'Básquetbol': return '🏀'
        case 'Vóley': return '🏐'
        case 'Tenis': return '🎾'
        default: return '🏆'
    }
}

const timeAgo = (fecha: string) => {
    const diff = Date.now() - new Date(fecha).getTime()
    const horas = Math.floor(diff / 3600000)
    if (horas < 1) return 'Hace un momento'
    if (horas < 24) return `Hace ${horas}h`
    return `Hace ${Math.floor(horas / 24)}d`
}

export function NotificationBell({ variant = 'icon' }: { variant?: 'icon' | 'sidebar' }) {
    const { nuevasPublicaciones, unseenCount, marcarVistas } = useNotifications()
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    const irAPublicacion = () => {
        setOpen(false)
        marcarVistas()
        navigate('/matchmaking')
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={variant === 'sidebar'
                    ? 'relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white transition-colors'
                    : 'relative p-2 text-gray-400 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white active:scale-95 transition-all'
                }
            >
                <Bell size={18} />
                {variant === 'sidebar' && 'Publicaciones nuevas'}
                {unseenCount > 0 && (
                    <span className={variant === 'sidebar'
                        ? 'ml-auto w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center'
                        : 'absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center'
                    }>
                        {unseenCount > 9 ? '9+' : unseenCount}
                    </span>
                )}
            </button>

            {open && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-start lg:justify-end z-[100] p-4 lg:p-6 lg:pt-20" onClick={() => setOpen(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl w-full lg:w-96 max-h-[75vh] overflow-hidden flex flex-col shadow-2xl border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-900 dark:text-white">Publicaciones nuevas</h3>
                            {unseenCount > 0 && (
                                <button onClick={marcarVistas} className="text-xs font-bold text-red-600 hover:underline">
                                    Marcar leídas
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto p-3 space-y-2">
                            {nuevasPublicaciones.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-10">No hay publicaciones nuevas por ahora</p>
                            ) : (
                                nuevasPublicaciones.map((s: any) => (
                                    <button
                                        key={s.id}
                                        onClick={irAPublicacion}
                                        className="w-full flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                                            {s.usuario?.fotoPerfil
                                                ? <img src={`http://localhost:8080${s.usuario.fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                                : s.usuario?.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                            }
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {sportEmoji(s.deporte)} {s.usuario?.nombre} busca gente para {s.deporte}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{s.disponibilidad} · {s.nivel}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(s.creadoEn)}</p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}