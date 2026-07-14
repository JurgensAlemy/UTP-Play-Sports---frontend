import { useState, useEffect, useRef } from 'react'
import { User, Mail, GraduationCap, Trophy, Calendar, Star, Edit, Save, X, Award, Camera, Images, Trash2 } from 'lucide-react'
import { usuarioService, reservaService, matchmakingService } from '../services/api'
import { useToast } from './Toast'
import { createPortal } from 'react-dom'

const BASE_URL = 'http://localhost:8080'

interface ProfileProps {
    user: any
    onFotoChange: (url: string) => void
}

export function Profile({ user, onFotoChange }: ProfileProps) {
    const { showToast } = useToast()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [fotoPerfil, setFotoPerfil] = useState<string | null>(null)
    const [subiendoFoto, setSubiendoFoto] = useState(false)
    const fotoInputRef = useRef<HTMLInputElement>(null)
    const [formData, setFormData] = useState({
        name: '', email: '', faculty: '', favoriteSport: 'Fútbol', skillLevel: 'Intermedio',
    })
    const [reservas, setReservas] = useState<any[]>([])
    const [conexiones, setConexiones] = useState<any[]>([])
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [reservaAEliminar, setReservaAEliminar] = useState<number | null>(null)
    const [eliminando, setEliminando] = useState(false)

    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [previewPosts, setPreviewPosts] = useState<any[]>([])
    const [loadingPreviewPosts, setLoadingPreviewPosts] = useState(false)

    useEffect(() => {
        Promise.all([
            usuarioService.getPerfil(user.studentId),
            reservaService.getReservasByUsuario(user.studentId),
            matchmakingService.getConexiones(user.studentId),
        ]).then(([perfil, res, conex]) => {
            setFormData({
                name: perfil.nombre || '',
                email: perfil.email || '',
                faculty: perfil.facultad || '',
                favoriteSport: perfil.deporteFavorito || 'Fútbol',
                skillLevel: perfil.nivelHabilidad || 'Intermedio',
            })
            if (perfil.fotoPerfil) setFotoPerfil(perfil.fotoPerfil)
            setReservas(Array.isArray(res) ? res : [])
            setConexiones(Array.isArray(conex) ? conex : [])
        }).catch(() => { }).finally(() => setLoading(false))
    }, [user.studentId])

    const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setSubiendoFoto(true)
        try {
            const res = await usuarioService.subirFoto(user.studentId, file)
            if (res.fotoPerfil) {
                // Guardamos la ruta limpia del backend, sin cache-buster
                setFotoPerfil(res.fotoPerfil)
                // Al nav le pasamos con cache-buster para forzar recarga
                onFotoChange(res.fotoPerfil + '?t=' + Date.now())
                showToast('Foto actualizada', 'success')
            } else {
                showToast('No se pudo subir la foto', 'error')
            }
        } catch {
            showToast('No se pudo subir la foto', 'error')
        } finally {
            setSubiendoFoto(false)
            if (fotoInputRef.current) fotoInputRef.current.value = ''
        }
    }

    const abrirPreview = async () => {
        setShowPreviewModal(true)
        setLoadingPreviewPosts(true)
        try {
            const posts = await matchmakingService.getSolicitudesByUsuario(user.studentId)
            setPreviewPosts(Array.isArray(posts) ? posts.filter((p: any) => p.estado === 'ACTIVA') : [])
        } catch {
            setPreviewPosts([])
        } finally {
            setLoadingPreviewPosts(false)
        }
    }

    const handleSave = async () => {
        try {
            await usuarioService.actualizarPerfil(user.studentId, {
                nombre: formData.name,
                facultad: formData.faculty,
                deporteFavorito: formData.favoriteSport,
                nivelHabilidad: formData.skillLevel,
            })
            setIsEditing(false)
            showToast('Perfil actualizado correctamente', 'success')
        } catch {
            showToast('No se pudo guardar el perfil', 'error')
        }
    }

    const confirmarEliminacion = async () => {
        if (!reservaAEliminar) return
        setEliminando(true)

        try {
            await reservaService.eliminarReserva(reservaAEliminar, user.studentId)
            showToast('Reserva eliminada', 'success')

            // Recargar datos
            Promise.all([
                usuarioService.getPerfil(user.studentId),
                reservaService.getReservasByUsuario(user.studentId),
                matchmakingService.getConexiones(user.studentId),
            ]).then(([perfil, res, conex]) => {
                setReservas(Array.isArray(res) ? res : [])
            })
        } catch {
            showToast('No se pudo eliminar la reserva', 'error')
        } finally {
            setEliminando(false)
            setShowDeleteModal(false)
            setReservaAEliminar(null)
        }
    }

    const reservasConfirmadas = reservas.filter(r => r.estado === 'CONFIRMADA')
    const partidosJugados = reservas.length

    const stats = [
        { label: 'Reservas activas', value: reservasConfirmadas.length, icon: Calendar },
        { label: 'Horas reservadas', value: `${reservasConfirmadas.length}h`, icon: Trophy },
        { label: 'Conexiones', value: conexiones.length, icon: Star },
    ]

    const actividadReciente = [...reservas]
        .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
        .slice(0, 5).map(r => ({
            id: r.id,
            title: r.estado === 'CONFIRMADA' ? 'Reserva confirmada' : 'Reserva cancelada',
            description: `${r.cancha} — ${r.deporte}`,
            date: r.fecha, time: r.horario,
            cancelada: r.estado === 'CANCELADA',
        }))

    const achievements = [
        { id: 1, name: 'Primer Partido', icon: '🎯', unlocked: partidosJugados >= 1 },
        { id: 2, name: 'Jugador Regular', icon: '⚽', unlocked: partidosJugados >= 5 },
        { id: 3, name: 'Estrella Social', icon: '⭐', unlocked: conexiones.length >= 3 },
        { id: 4, name: 'Madrugador', icon: '🌅', unlocked: reservasConfirmadas.some(r => r.horario < '08:00') },
        { id: 5, name: 'Noctámbulo', icon: '🌙', unlocked: reservasConfirmadas.some(r => r.horario >= '20:00') },
        { id: 6, name: 'Polideportivo', icon: '🏆', unlocked: new Set(reservas.map(r => r.deporte)).size >= 3 },
    ]

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
    )

    return (
        <div className="space-y-5 lg:space-y-8 pb-8">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="flex flex-col lg:flex-row lg:items-center gap-5 relative z-10">
                    {/* Avatar con botón de cámara */}
                    <div className="relative flex-shrink-0 self-start lg:self-auto">
                        <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white/20 backdrop-blur-sm border-4 border-white/30 rounded-full overflow-hidden flex items-center justify-center text-white font-black text-3xl lg:text-4xl shadow-lg">
                            {fotoPerfil ? (
                                <img src={`${BASE_URL}${fotoPerfil}`} alt="perfil" className="w-full h-full object-cover" />
                            ) : (
                                formData.name?.charAt(0)
                            )}
                        </div>
                        <button
                            onClick={() => fotoInputRef.current?.click()}
                            disabled={subiendoFoto}
                            className="absolute bottom-0 right-0 w-7 h-7 bg-white text-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-red-600 active:scale-95 transition-all disabled:opacity-60"
                        >
                            {subiendoFoto
                                ? <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                : <Camera size={13} />}
                        </button>
                        <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                    </div>

                    <div className="flex-1">
                        <h1 className="text-2xl lg:text-4xl font-black tracking-tight">{formData.name}</h1>
                        <p className="text-red-100 text-sm lg:text-base font-medium opacity-90">{user.studentId}</p>
                        <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold shadow-sm">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Estudiante Verificado
                        </div>
                        <button
                            onClick={abrirPreview}
                            className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
                        >
                            👀 Ver cómo te ven otros jugadores
                        </button>
                    </div>

                    {!isEditing ? (
                        <button onClick={() => setIsEditing(true)} className="absolute lg:relative top-6 right-6 lg:top-0 lg:right-0 p-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-2xl active:scale-95 transition-all shadow-md">
                            <Edit size={20} className="text-white" />
                        </button>
                    ) : (
                        <div className="absolute lg:relative top-6 right-6 lg:top-0 lg:right-0 flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl active:scale-95 transition-all">
                                <X size={20} className="text-white" />
                            </button>
                            <button onClick={handleSave} className="p-3 bg-white text-red-600 hover:bg-gray-100 rounded-2xl active:scale-95 transition-all shadow-lg">
                                <Save size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="flex lg:grid lg:grid-cols-3 gap-3 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                {stats.map(stat => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="flex-shrink-0 lg:flex-shrink bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl px-5 py-4 lg:p-6 min-w-[120px] lg:min-w-0">
                            <Icon className="text-red-600 dark:text-red-500 mb-2" size={20} />
                            <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                            <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        </div>
                    )
                })}
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:gap-6 space-y-5 lg:space-y-0">
                <div className="lg:col-span-2 space-y-5">
                    {/* Info personal */}
                    <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-5 lg:p-7">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg mb-4">Información personal</h2>
                        <div className="space-y-4">
                            <div className="grid lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5"><User size={14} /> Nombre</label>
                                    {isEditing ? <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white" />
                                        : <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.name}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5"><Mail size={14} /> Correo</label>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.email}</p>
                                </div>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5"><GraduationCap size={14} /> Facultad</label>
                                    {isEditing ? <input type="text" value={formData.faculty} onChange={e => setFormData({ ...formData, faculty: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white" />
                                        : <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.faculty}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5"><Trophy size={14} /> Deporte</label>
                                    {isEditing ? <select value={formData.favoriteSport} onChange={e => setFormData({ ...formData, favoriteSport: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white">
                                        {['Fútbol', 'Básquetbol', 'Vóley', 'Tenis'].map(s => <option key={s}>{s}</option>)}
                                    </select> : <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.favoriteSport}</p>}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-1.5"><Star size={14} /> Nivel</label>
                                    {isEditing ? <select value={formData.skillLevel} onChange={e => setFormData({ ...formData, skillLevel: e.target.value })} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none text-gray-900 dark:text-white">
                                        {['Principiante', 'Intermedio', 'Avanzado'].map(l => <option key={l}>{l}</option>)}
                                    </select> : <p className="text-sm font-medium text-gray-900 dark:text-white">{formData.skillLevel}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actividad reciente */}
                    <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-5 lg:p-7">
                        <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg mb-4">Actividad reciente</h2>
                        {actividadReciente.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Aún no tienes actividad</p>
                        ) : (
                            <div className="space-y-3">
                                {actividadReciente.map(activity => {


                                    return (
                                        <div key={activity.id} className="flex items-start gap-3 p-3 lg:p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${activity.cancelada ? 'bg-gray-200 dark:bg-gray-800' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                                <Calendar className={activity.cancelada ? 'text-gray-500 dark:text-gray-400' : 'text-red-600 dark:text-red-400'} size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{activity.title}</p>
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                                                    {new Date(activity.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} · {activity.time}
                                                </p>
                                            </div>

                                            {activity.cancelada && (
                                                <button
                                                    onClick={() => { setReservaAEliminar(activity.id); setShowDeleteModal(true) }}
                                                    className="flex-shrink-0 ml-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all disabled:opacity-60"
                                                >
                                                    🗑️ Borrar
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Conexiones */}
                    <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-5 lg:p-7">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">Matchmaking</h2>
                            {conexiones.length > 0 && (
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                    {conexiones.length} solicitud{conexiones.length !== 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>
                        {conexiones.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">Aún no te has conectado con nadie</p>
                        ) : (
                            <div className="space-y-3">
                                {conexiones.slice(0, 4).map((c: any) => (
                                    <div key={c.id} className="flex items-center justify-between p-3 lg:p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{c.solicitud?.usuario?.nombre}</p>
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{c.solicitud?.deporte} · {c.solicitud?.disponibilidad}</p>
                                        </div>
                                        <span className={`ml-2 px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 ${c.estado === 'ACEPTADA' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : c.estado === 'RECHAZADA' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'}`}>
                                            {c.estado === 'ACEPTADA' ? '✓ Aceptada' : c.estado === 'RECHAZADA' ? '✗ Rechazada' : '⏳ Pendiente'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Logros */}
                <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-3xl p-5 lg:p-7">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="text-red-600 dark:text-red-500" size={20} />
                        <h2 className="font-bold text-gray-900 dark:text-white text-base lg:text-lg">Logros</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        {achievements.map(a => (
                            <div key={a.id} className={`flex flex-col items-center text-center gap-2 p-4 rounded-2xl border transition-colors ${a.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-700/50 shadow-sm' : 'bg-white/40 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 opacity-60 grayscale'}`}>
                                <span className="text-3xl drop-shadow-sm">{a.icon}</span>
                                <p className="font-bold text-gray-900 dark:text-white text-xs leading-tight">{a.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Modal Confirmación de ELIMINACIÓN */}
            {showDeleteModal && reservaAEliminar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="text-red-600" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Eliminar del historial?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción borrará la actividad cancelada de tu vista permanentemente.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setReservaAEliminar(null) }}
                                disabled={eliminando}
                                className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminacion}
                                disabled={eliminando}
                                className="flex-1 flex items-center justify-center px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-red-600/30 disabled:opacity-50"
                            >
                                {eliminando ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPreviewModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4" onClick={() => setShowPreviewModal(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Así te ven</h3>
                            <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-6">Vista previa de tu perfil en Matchmaking, tal como la ven otros jugadores</p>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                                {fotoPerfil
                                    ? <img src={`${BASE_URL}${fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                    : formData.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                }
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-lg">{formData.name}</h4>
                                <p className="text-xs font-medium text-gray-500">{formData.faculty || 'Sin facultad'} · {user.studentId}</p>
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Verificado
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-gray-400 mb-1">Deporte favorito</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formData.favoriteSport}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-gray-400 mb-1">Nivel</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formData.skillLevel}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Tus publicaciones activas (así las ven en Explorar)</p>
                            {loadingPreviewPosts ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                                </div>
                            ) : previewPosts.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    No tienes publicaciones activas — otros jugadores solo verán tu perfil si te buscan directamente
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {previewPosts.map((p: any) => (
                                        <div key={p.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{p.deporte} · {p.nivel}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{p.disponibilidad}</p>
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.descripcion}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}