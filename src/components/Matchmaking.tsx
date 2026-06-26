import { useState, useEffect } from 'react'
import { Trophy, Clock, Search, UserPlus, X, Check, MessageCircle, ChevronRight, Bell, Trash2, AlertTriangle } from 'lucide-react'
import { matchmakingService, usuarioService } from '../services/api'
import { useToast } from './Toast'
import { useNavigate } from 'react-router-dom'

interface MatchmakingProps {
    user: any
}

type Tab = 'explorar' | 'mispublicaciones' | 'recibidas' | 'enviadas'
type FiltroEstado = 'todas' | 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA'
type ExploreMode = 'publicaciones' | 'jugadores'

export function Matchmaking({ user }: MatchmakingProps) {
    const { showToast } = useToast()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState<Tab>('explorar')
    const [exploreMode, setExploreMode] = useState<ExploreMode>('publicaciones')
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showConectarModal, setShowConectarModal] = useState<any>(null)
    const [conectarMensaje, setConectarMensaje] = useState('')
    const [solicitudes, setSolicitudes] = useState<any[]>([])
    const [recibidas, setRecibidas] = useState<any[]>([])
    const [enviadas, setEnviadas] = useState<any[]>([])
    const [misPublicaciones, setMisPublicaciones] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')
    const [newSolicitud, setNewSolicitud] = useState({
        deporte: 'Fútbol',
        nivel: 'Intermedio',
        disponibilidad: 'Tardes',
        descripcion: '',
    })

    // Filtros de estado para Recibidas/Enviadas
    const [filtroRecibidas, setFiltroRecibidas] = useState<FiltroEstado>('todas')
    const [filtroEnviadas, setFiltroEnviadas] = useState<FiltroEstado>('todas')

    // Cerrar publicación propia
    const [showCerrarModal, setShowCerrarModal] = useState(false)
    const [publicacionACerrar, setPublicacionACerrar] = useState<any>(null)

    // Buscador de jugadores registrados
    const [userSearchQuery, setUserSearchQuery] = useState('')
    const [userResults, setUserResults] = useState<any[]>([])
    const [searchingUsers, setSearchingUsers] = useState(false)
    const [showPerfilModal, setShowPerfilModal] = useState<any>(null)
    const [perfilPosts, setPerfilPosts] = useState<any[]>([])
    const [loadingPerfilPosts, setLoadingPerfilPosts] = useState(false)

    const sports = ['Todos', 'Fútbol', 'Básquetbol', 'Vóley', 'Tenis']
    const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado']
    const filtrosEstado: { value: FiltroEstado; label: string }[] = [
        { value: 'todas', label: 'Todas' },
        { value: 'PENDIENTE', label: 'Pendientes' },
        { value: 'ACEPTADA', label: 'Aceptadas' },
        { value: 'RECHAZADA', label: 'Rechazadas' },
    ]

    const cargarDatos = async () => {
        setLoading(true)
        try {
            const [sols, recv, env, mias] = await Promise.all([
                matchmakingService.getSolicitudesActivas(),
                matchmakingService.getSolicitudesRecibidas(user.studentId),
                matchmakingService.getConexiones(user.studentId),
                matchmakingService.getSolicitudesByUsuario(user.studentId),
            ])
            setSolicitudes(Array.isArray(sols) ? sols : [])
            setRecibidas(Array.isArray(recv) ? recv : [])
            setEnviadas(Array.isArray(env) ? env : [])
            setMisPublicaciones(Array.isArray(mias) ? mias : [])
        } catch { }
        setLoading(false)
    }

    useEffect(() => { cargarDatos() }, [user.studentId])

    // Buscador de jugadores registrados — debounced, solo activo en modo "jugadores"
    useEffect(() => {
        if (exploreMode !== 'jugadores') return
        if (userSearchQuery.trim().length < 2) {
            setUserResults([])
            return
        }
        const timeout = setTimeout(async () => {
            setSearchingUsers(true)
            try {
                const res = await usuarioService.buscarUsuarios(userSearchQuery.trim(), user.studentId)
                setUserResults(Array.isArray(res) ? res : [])
            } catch {
                setUserResults([])
            } finally {
                setSearchingUsers(false)
            }
        }, 400)
        return () => clearTimeout(timeout)
    }, [userSearchQuery, exploreMode])

    const yaEnvie = (solicitudId: number) =>
        enviadas.some(c => Number(c.solicitud?.id) === Number(solicitudId))

    const estadoEnviado = (solicitudId: number) =>
        enviadas.find(c => Number(c.solicitud?.id) === Number(solicitudId))?.estado || ''

    const handleConectar = async () => {
        if (!showConectarModal) return
        try {
            const res = await matchmakingService.conectar(showConectarModal.id, user.studentId, conectarMensaje)
            if (typeof res === 'string') {
                showToast(res, 'error')
            } else {
                showToast('Solicitud enviada', 'success')
            }
        } catch {
            showToast('Error al conectar', 'error')
        }
        setShowConectarModal(null)
        setConectarMensaje('')
        cargarDatos()
    }

    const handleResponder = async (conexionId: number, estado: 'ACEPTADA' | 'RECHAZADA') => {
        try {
            await matchmakingService.responderConexion(conexionId, user.studentId, estado)
            showToast(estado === 'ACEPTADA' ? 'Conexión aceptada' : 'Solicitud rechazada', estado === 'ACEPTADA' ? 'success' : 'info')
        } catch {
            showToast('Error al responder', 'error')
        }
        cargarDatos()
    }

    const handleEliminarEnviada = async (conexionId: number, esRechazada: boolean) => {
        try {
            await matchmakingService.eliminarConexion(conexionId, user.studentId)
            showToast(esRechazada ? 'Solicitud eliminada' : 'Solicitud retirada', 'info')
            cargarDatos()
        } catch {
            showToast('No se pudo eliminar', 'error')
        }
    }

    const handleCrear = async () => {
        setCreateError('')
        if (!newSolicitud.descripcion.trim()) {
            setCreateError('Describe qué tipo de compañeros buscas.')
            return
        }
        setCreating(true)
        try {
            const res = await matchmakingService.crearSolicitud({
                studentId: user.studentId,
                ...newSolicitud,
            })
            if (typeof res === 'string') {
                setCreateError(res)
            } else {
                setShowCreateModal(false)
                setNewSolicitud({ deporte: 'Fútbol', nivel: 'Intermedio', disponibilidad: 'Tardes', descripcion: '' })
                cargarDatos()
                showToast('Publicación creada', 'success')
            }
        } catch {
            setCreateError('Error de conexión con el servidor.')
        } finally {
            setCreating(false)
        }
    }

    // Cerrar (despublicar) una de mis propias publicaciones
    const pedirConfirmacionCerrar = (solicitud: any) => {
        setPublicacionACerrar(solicitud)
        setShowCerrarModal(true)
    }

    const confirmarCierre = async () => {
        if (!publicacionACerrar) return
        try {
            await matchmakingService.cerrarSolicitud(publicacionACerrar.id, user.studentId)
            showToast('Publicación cerrada', 'info')
            cargarDatos()
        } catch {
            showToast('No se pudo cerrar la publicación', 'error')
        }
        setShowCerrarModal(false)
        setPublicacionACerrar(null)
    }

    // Ver perfil de un jugador encontrado en el buscador
    const abrirPerfil = async (usuario: any) => {
        setShowPerfilModal(usuario)
        setLoadingPerfilPosts(true)
        try {
            const posts = await matchmakingService.getSolicitudesByUsuario(usuario.studentId)
            setPerfilPosts(Array.isArray(posts) ? posts.filter((p: any) => p.estado === 'ACTIVA') : [])
        } catch {
            setPerfilPosts([])
        } finally {
            setLoadingPerfilPosts(false)
        }
    }

    const handleConectarDesdePerfil = (post: any) => {
        setShowPerfilModal(null)
        setShowConectarModal(post)
    }

    const filteredSolicitudes = solicitudes.filter(s => {
        const matchesSport = selectedSport === 'all' || s.deporte?.toLowerCase() === selectedSport.toLowerCase()
        const matchesLevel = selectedLevel === 'all' || s.nivel?.toLowerCase() === selectedLevel.toLowerCase()
        const matchesSearch =
            s.usuario?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.descripcion?.toLowerCase().includes(searchQuery.toLowerCase())
        const noEsMia = s.usuario?.studentId !== user.studentId
        return matchesSport && matchesLevel && matchesSearch && noEsMia
    })

    const recibidasFiltradas = filtroRecibidas === 'todas' ? recibidas : recibidas.filter(c => c.estado === filtroRecibidas)
    const enviadasFiltradas = filtroEnviadas === 'todas' ? enviadas : enviadas.filter(c => c.estado === filtroEnviadas)

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Principiante': return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            case 'Intermedio': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            case 'Avanzado': return 'bg-black dark:bg-white text-white dark:text-black'
            default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }
    }

    const getEstadoStyle = (estado: string) => {
        switch (estado) {
            case 'ACEPTADA': return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            case 'RECHAZADA': return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
            default: return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
        }
    }

    const getEstadoLabel = (estado: string) => {
        switch (estado) {
            case 'ACEPTADA': return '✓ Aceptada'
            case 'RECHAZADA': return '✗ Rechazada'
            default: return '⏳ Pendiente'
        }
    }

    const handleChatDirecto = (usuarioPerfil: any) => {
        // Buscar si hay conexión aceptada con este usuario (en enviadas o recibidas)
        const conexion = [
            ...enviadas,
            ...recibidas,
        ].find(c =>
            c.estado === 'ACEPTADA' && (
                c.solicitud?.usuario?.studentId?.toUpperCase() === usuarioPerfil.studentId?.toUpperCase() ||
                c.usuario?.studentId?.toUpperCase() === usuarioPerfil.studentId?.toUpperCase()
            )
        )

        if (conexion) {
            setShowPerfilModal(null)
            navigate('/chat', { state: { abrirConexionId: conexion.id } })
        } else {
            showToast('No tienes una conexión aceptada con este jugador aún', 'info')
        }
    }

    const timeAgo = (fecha: string) => {
        const diff = Date.now() - new Date(fecha).getTime()
        const horas = Math.floor(diff / 3600000)
        if (horas < 1) return 'Hace un momento'
        if (horas < 24) return `Hace ${horas}h`
        return `Hace ${Math.floor(horas / 24)}d`
    }

    const pendientesCount = recibidas.filter(c => c.estado === 'PENDIENTE').length

    const tabs = [
        { id: 'explorar' as Tab, label: 'Explorar', badge: 0 },
        { id: 'mispublicaciones' as Tab, label: 'Mis posts', badge: 0 },
        { id: 'recibidas' as Tab, label: 'Recibidas', badge: pendientesCount },
        { id: 'enviadas' as Tab, label: 'Enviadas', badge: 0 },
    ]

    return (
        <div className="space-y-5 lg:space-y-6">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl flex items-center justify-between">
                <div>
                    <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-1 lg:mb-2">Matchmaking</h1>
                    <p className="text-red-100 text-sm lg:text-base opacity-90">Encuentra compañeros de juego</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 lg:px-5 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg border border-white/20"
                >
                    <UserPlus size={18} />
                    <span className="hidden sm:inline">Publicar</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 shadow-sm rounded-2xl p-1.5 gap-1 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                        {tab.badge > 0 && (
                            <span className="bg-red-600 text-white text-[10px] font-black rounded-full px-2 py-0.5 shadow-sm">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
            ) : (
                <>
                    {/* TAB: EXPLORAR */}
                    {activeTab === 'explorar' && (
                        <div className="space-y-4">
                            {/* Toggle Publicaciones / Jugadores */}
                            <div className="flex gap-2 bg-white/50 dark:bg-[#1a1a1a]/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/50 dark:border-white/5 w-fit">
                                <button
                                    onClick={() => setExploreMode('publicaciones')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${exploreMode === 'publicaciones' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    Publicaciones
                                </button>
                                <button
                                    onClick={() => setExploreMode('jugadores')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${exploreMode === 'jugadores' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    Jugadores
                                </button>
                            </div>

                            {exploreMode === 'publicaciones' ? (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar publicaciones..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none shadow-sm dark:text-white"
                                        />
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                                        {sports.map(sport => {
                                            const value = sport === 'Todos' ? 'all' : sport
                                            const isActive = selectedSport === value
                                            return (
                                                <button key={sport} onClick={() => setSelectedSport(value)}
                                                    className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-red-600 text-white shadow-md' : 'bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-md text-gray-700 dark:text-gray-300 border border-white/50 dark:border-white/5 hover:bg-white dark:hover:bg-gray-800'
                                                        }`}
                                                >{sport}</button>
                                            )
                                        })}
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                                        {levels.map(level => {
                                            const value = level === 'Todos' ? 'all' : level
                                            const isActive = selectedLevel === value
                                            return (
                                                <button key={level} onClick={() => setSelectedLevel(value)}
                                                    className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isActive ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-md' : 'bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-md text-gray-700 dark:text-gray-300 border border-white/50 dark:border-white/5 hover:bg-white dark:hover:bg-gray-800'
                                                        }`}
                                                >{level}</button>
                                            )
                                        })}
                                    </div>

                                    {filteredSolicitudes.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-16">
                                            <Trophy className="text-gray-400" size={40} />
                                            <p className="text-base font-bold text-gray-700 dark:text-gray-300">No hay solicitudes activas</p>
                                            <button onClick={() => setShowCreateModal(true)} className="text-sm text-red-600 font-bold hover:underline">
                                                Sé el primero en publicar
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                                            {filteredSolicitudes.map(s => {
                                                const enviado = yaEnvie(s.id)
                                                const estadoActual = estadoEnviado(s.id)
                                                return (
                                                    <div key={s.id} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex items-start justify-between mb-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-inner">
                                                                    {s.usuario?.fotoPerfil
                                                                        ? <img src={`http://localhost:8080${s.usuario.fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                                                        : s.usuario?.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                                                    }
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-black text-gray-900 dark:text-white text-base">{s.usuario?.nombre}</h3>
                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{s.usuario?.facultad}</p>
                                                                </div>
                                                            </div>
                                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold ${getLevelColor(s.nivel)}`}>
                                                                {s.nivel}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4 mb-3 text-xs font-bold bg-gray-50/50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                                                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
                                                                <Trophy size={14} className="text-red-600" />{s.deporte}
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                                <Clock size={14} />{s.disponibilidad}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 line-clamp-2">
                                                            {s.descripcion}
                                                        </p>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-medium text-gray-400">{timeAgo(s.creadoEn)}</span>
                                                            {enviado ? (
                                                                <span className={`px-4 py-2 rounded-xl text-xs font-bold border ${getEstadoStyle(estadoActual)}`}>
                                                                    {getEstadoLabel(estadoActual)}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setShowConectarModal(s)}
                                                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all shadow-md shadow-red-600/20"
                                                                >
                                                                    <MessageCircle size={16} /> Conectar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Busca por nombre o código de estudiante..."
                                            value={userSearchQuery}
                                            onChange={(e) => setUserSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none shadow-sm dark:text-white"
                                        />
                                    </div>

                                    {searchingUsers ? (
                                        <div className="flex items-center justify-center h-24">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                                        </div>
                                    ) : userSearchQuery.trim().length < 2 ? (
                                        <div className="flex flex-col items-center justify-center gap-2 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-14">
                                            <Search className="text-gray-400" size={32} />
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Escribe al menos 2 letras para buscar</p>
                                        </div>
                                    ) : userResults.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center gap-2 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-14">
                                            <UserPlus className="text-gray-400" size={32} />
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Nadie coincide con "{userSearchQuery}"</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                                            {userResults.map((u: any) => (
                                                <div key={u.studentId} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-4 shadow-sm flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                                                        {u.fotoPerfil
                                                            ? <img src={`http://localhost:8080${u.fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                                            : u.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-black text-gray-900 dark:text-white text-sm truncate">{u.nombre}</h3>
                                                        <p className="text-xs font-medium text-gray-500 truncate">{u.facultad || 'Sin facultad'} · {u.studentId}</p>
                                                        {u.deporteFavorito && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold">
                                                                {u.deporteFavorito}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => abrirPerfil(u)}
                                                        className="flex-shrink-0 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold rounded-xl active:scale-95 transition-all"
                                                    >
                                                        Ver perfil
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* TAB: MIS PUBLICACIONES — el fix del bug */}
                    {activeTab === 'mispublicaciones' && (
                        <div className="space-y-4">
                            {misPublicaciones.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-16">
                                    <UserPlus className="text-gray-400" size={40} />
                                    <p className="text-base font-bold text-gray-700 dark:text-gray-300">Aún no tienes publicaciones</p>
                                    <button onClick={() => setShowCreateModal(true)} className="text-sm text-red-600 font-bold hover:underline">
                                        Crea tu primera publicación
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                                    {misPublicaciones.map(s => {
                                        const conexionesDeEsta = recibidas.filter(c => Number(c.solicitud?.id) === Number(s.id))
                                        const pendientesDeEsta = conexionesDeEsta.filter(c => c.estado === 'PENDIENTE').length
                                        return (
                                            <div key={s.id} className={`bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border rounded-3xl p-5 shadow-sm ${s.estado === 'CERRADA' ? 'border-gray-200 dark:border-gray-800 opacity-70' : 'border-white/50 dark:border-white/5'
                                                }`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <Trophy size={16} className="text-red-600" />
                                                        <h3 className="font-black text-gray-900 dark:text-white text-base">{s.deporte}</h3>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${s.estado === 'CERRADA'
                                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                        }`}>
                                                        {s.estado === 'CERRADA' ? 'Cerrada' : 'Activa'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 mb-3 text-xs font-bold text-gray-500 dark:text-gray-400">
                                                    <span className={`px-2 py-1 rounded-lg ${getLevelColor(s.nivel)}`}>{s.nivel}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} />{s.disponibilidad}</span>
                                                </div>

                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{s.descripcion}</p>

                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-medium text-gray-400">{timeAgo(s.creadoEn)}</span>
                                                        {pendientesDeEsta > 0 && (
                                                            <span className="bg-red-600 text-white text-[10px] font-black rounded-full px-2 py-0.5">
                                                                {pendientesDeEsta} pendiente{pendientesDeEsta !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {s.estado !== 'CERRADA' && (
                                                        <button
                                                            onClick={() => pedirConfirmacionCerrar(s)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 size={13} /> Cerrar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB: RECIBIDAS */}
                    {activeTab === 'recibidas' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                                {filtrosEstado.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFiltroRecibidas(f.value)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filtroRecibidas === f.value ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-white/70 dark:bg-[#1a1a1a]/70 text-gray-600 dark:text-gray-300 border border-white/50 dark:border-white/5'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                                {recibidasFiltradas.length === 0 ? (
                                    <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-16">
                                        <Bell className="text-gray-400" size={40} />
                                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">Sin solicitudes en esta categoría</p>
                                    </div>
                                ) : (
                                    recibidasFiltradas.map(c => (
                                        <div key={c.id} className="bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                                                    {c.usuario?.fotoPerfil
                                                        ? <img src={`http://localhost:8080${c.usuario.fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                                        : c.usuario?.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-black text-gray-900 dark:text-white text-base truncate">{c.usuario?.nombre}</h3>
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${getEstadoStyle(c.estado)}`}>
                                                            {getEstadoLabel(c.estado)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-500 truncate">{c.usuario?.facultad} · {c.usuario?.studentId}</p>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-4 border border-gray-100 dark:border-gray-800">
                                                <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mb-1">Para tu publicación de {c.solicitud?.deporte}</p>
                                                {c.mensaje ? (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">"{c.mensaje}"</p>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Sin mensaje adicional</p>
                                                )}
                                            </div>

                                            <p className="text-[11px] font-medium text-gray-400 mb-4">{timeAgo(c.creadoEn)}</p>

                                            {c.estado === 'PENDIENTE' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleResponder(c.id, 'RECHAZADA')}
                                                        className="flex-1 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={() => handleResponder(c.id, 'ACEPTADA')}
                                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-green-600/20"
                                                    >
                                                        <Check size={16} /> Aceptar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB: ENVIADAS */}
                    {activeTab === 'enviadas' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                                {filtrosEstado.map(f => (
                                    <button
                                        key={f.value}
                                        onClick={() => setFiltroEnviadas(f.value)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${filtroEnviadas === f.value ? 'bg-gray-900 dark:bg-white text-white dark:text-black' : 'bg-white/70 dark:bg-[#1a1a1a]/70 text-gray-600 dark:text-gray-300 border border-white/50 dark:border-white/5'
                                            }`}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                                {enviadasFiltradas.length === 0 ? (
                                    <div className="lg:col-span-2 flex flex-col items-center justify-center gap-3 bg-white/40 dark:bg-[#1a1a1a]/40 backdrop-blur-md border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl py-16">
                                        <ChevronRight className="text-gray-400" size={40} />
                                        <p className="text-base font-bold text-gray-700 dark:text-gray-300">Sin solicitudes en esta categoría</p>
                                    </div>
                                ) : (
                                    enviadasFiltradas.map(c => (
                                        <div key={c.id} className={`bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-xl border rounded-3xl p-5 shadow-sm ${c.estado === 'ACEPTADA' ? 'border-green-200 dark:border-green-800' :
                                            c.estado === 'RECHAZADA' ? 'border-red-100 dark:border-red-900/50' : 'border-white/50 dark:border-white/5'
                                            }`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 mb-1">Solicitud a</p>
                                                    <h3 className="font-black text-gray-900 dark:text-white text-base">{c.solicitud?.usuario?.nombre}</h3>
                                                    <p className="text-xs font-medium text-gray-500 mt-0.5">{c.solicitud?.deporte} · {c.solicitud?.disponibilidad}</p>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${getEstadoStyle(c.estado)}`}>
                                                    {getEstadoLabel(c.estado)}
                                                </span>
                                            </div>

                                            {c.mensaje && (
                                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mt-2 border border-gray-100 dark:border-gray-800">
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">"{c.mensaje}"</p>
                                                </div>
                                            )}

                                            {c.estado === 'ACEPTADA' && (
                                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                                                    <p className="text-sm text-green-700 dark:text-green-400 font-bold">🎉 ¡Conexión aceptada! Coordina con {c.solicitud?.usuario?.nombre} para jugar.</p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-[11px] font-medium text-gray-400">{timeAgo(c.creadoEn)}</p>

                                                {(c.estado === 'PENDIENTE' || c.estado === 'RECHAZADA') && (
                                                    <button
                                                        onClick={() => handleEliminarEnviada(c.id, c.estado === 'RECHAZADA')}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                                    >
                                                        <Trash2 size={13} />
                                                        {c.estado === 'PENDIENTE' ? 'Retirar' : 'Borrar'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal: perfil de jugador encontrado en el buscador */}
            {showPerfilModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Perfil</h3>
                            <button onClick={() => setShowPerfilModal(null)} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-2xl flex-shrink-0">
                                {showPerfilModal.fotoPerfil
                                    ? <img src={`http://localhost:8080${showPerfilModal.fotoPerfil}`} alt="" className="w-full h-full object-cover" />
                                    : showPerfilModal.nombre?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                                }
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 dark:text-white text-lg">{showPerfilModal.nombre}</h4>
                                <p className="text-xs font-medium text-gray-500">{showPerfilModal.facultad || 'Sin facultad'} · {showPerfilModal.studentId}</p>
                                {showPerfilModal.verificado && (
                                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                                        <Check size={12} /> Verificado
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-gray-400 mb-1">Deporte favorito</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{showPerfilModal.deporteFavorito || 'No indicado'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                <p className="text-[10px] font-bold text-gray-400 mb-1">Nivel</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{showPerfilModal.nivelHabilidad || 'No indicado'}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3">Publicaciones activas</p>
                            {loadingPerfilPosts ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                                </div>
                            ) : perfilPosts.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                                    Sin publicaciones activas por ahora
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {perfilPosts.map((p: any) => {
                                        const enviado = yaEnvie(p.id)
                                        return (
                                            <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-3 border border-gray-100 dark:border-gray-800">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{p.deporte}</p>
                                                    <p className="text-xs text-gray-500 truncate">{p.disponibilidad} · {p.nivel}</p>
                                                </div>
                                                {enviado ? (
                                                    <span className="text-[10px] font-bold text-gray-400 flex-shrink-0 ml-2">Ya enviada</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleConectarDesdePerfil(p)}
                                                        className="flex-shrink-0 ml-2 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
                                                    >
                                                        Conectar
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleChatDirecto(showPerfilModal)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-black text-white font-bold rounded-2xl active:scale-95 transition-all shadow-md"
                        >
                            <MessageCircle size={16} /> Chat directo
                        </button>
                    </div>
                </div>
            )}

            {/* Modal: conectar con mensaje opcional */}
            {showConectarModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 lg:p-8 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Conectar</h3>
                            <button onClick={() => { setShowConectarModal(null); setConectarMensaje('') }} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-bold text-gray-500 mb-1">Uniéndote a la publicación de</p>
                            <p className="font-black text-gray-900 dark:text-white text-base">{showConectarModal.usuario?.nombre}</p>
                            <p className="text-xs font-medium text-gray-500 mt-1">{showConectarModal.deporte} · {showConectarModal.disponibilidad}</p>
                        </div>

                        <div className="mb-8">
                            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Mensaje (opcional)
                            </label>
                            <textarea
                                placeholder="Ej: Hola, soy delantero y busco equipo para jugar los martes..."
                                rows={3}
                                value={conectarMensaje}
                                onChange={e => setConectarMensaje(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none dark:text-white"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowConectarModal(null); setConectarMensaje('') }}
                                className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-95 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConectar}
                                className="flex-1 px-4 py-4 bg-gradient-to-r from-red-600 to-black text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-600/30"
                            >
                                Enviar solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: confirmar cierre de publicación propia */}
            {showCerrarModal && publicacionACerrar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Cerrar esta publicación?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Dejará de aparecer en Explorar para otros jugadores. No se borra tu historial de conexiones.</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{publicacionACerrar.deporte} · {publicacionACerrar.nivel}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{publicacionACerrar.descripcion}</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCerrarModal(false); setPublicacionACerrar(null) }}
                                className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                No, mantenerla
                            </button>
                            <button
                                onClick={confirmarCierre}
                                className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-red-600/30"
                            >
                                Sí, cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: crear publicación */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 lg:p-8 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Nueva publicación</h3>
                            <button onClick={() => { setShowCreateModal(false); setCreateError('') }} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Deporte</label>
                                <select value={newSolicitud.deporte} onChange={e => setNewSolicitud({ ...newSolicitud, deporte: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none dark:text-white">
                                    {['Fútbol', 'Básquetbol', 'Vóley', 'Tenis'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Nivel</label>
                                    <select value={newSolicitud.nivel} onChange={e => setNewSolicitud({ ...newSolicitud, nivel: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none dark:text-white">
                                        {['Principiante', 'Intermedio', 'Avanzado'].map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Horario</label>
                                    <select value={newSolicitud.disponibilidad} onChange={e => setNewSolicitud({ ...newSolicitud, disponibilidad: e.target.value })}
                                        className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none dark:text-white">
                                        {['Mañanas', 'Tardes', 'Noches', 'Fines de semana'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">¿Qué buscas?</label>
                                <textarea
                                    placeholder="Ej: Busco 2 jugadores para completar equipo de fútbol 7..."
                                    rows={3}
                                    value={newSolicitud.descripcion}
                                    onChange={e => setNewSolicitud({ ...newSolicitud, descripcion: e.target.value })}
                                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none dark:text-white"
                                />
                            </div>

                            {createError && <p className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl border border-red-100 dark:border-red-800">{createError}</p>}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowCreateModal(false); setCreateError('') }}
                                    className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-95 transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleCrear} disabled={creating}
                                    className="flex-1 px-4 py-4 bg-gradient-to-r from-red-600 to-black text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-600/30 disabled:opacity-50 disabled:scale-100">
                                    {creating ? 'Publicando...' : 'Publicar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}