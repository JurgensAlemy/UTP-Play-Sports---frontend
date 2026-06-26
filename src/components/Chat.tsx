import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Send, Image, X, MessageCircle, Images } from 'lucide-react'
import { chatService, matchmakingService } from '../services/api'
import { useLocation } from 'react-router-dom'

import { useUnread } from './UnreadContext'

interface ChatProps {
    user: any
}

const BASE_URL = 'http://localhost:8080'

// Ahora recibe el studentId del usuario logueado como parámetro explícito,
// en vez de depender de un campo `conexion.user` que nunca existió.
const getOtroFoto = (conexion: any, miStudentId: string) => {
    const duenio = conexion.solicitud?.usuario
    const conector = conexion.usuario
    const esDuenio = duenio?.studentId?.toUpperCase() === miStudentId?.toUpperCase()
    const otro = esDuenio ? conector : duenio
    return otro?.fotoPerfil || null
}

export function Chat({ user }: ChatProps) {
    // Lista de conexiones aceptadas (son los "chats" disponibles)
    const [conexiones, setConexiones] = useState<any[]>([])
    const [loadingConexiones, setLoadingConexiones] = useState(true)

    // Chat activo
    const [activeChat, setActiveChat] = useState<any>(null)
    const [mensajes, setMensajes] = useState<any[]>([])
    const [loadingMensajes, setLoadingMensajes] = useState(false)
    const [texto, setTexto] = useState('')
    const [imagenPreview, setImagenPreview] = useState<string | null>(null)
    const [imagenFile, setImagenFile] = useState<File | null>(null)
    const [enviando, setEnviando] = useState(false)

    // Mobile: mostrar lista o chat
    const [showChatMobile, setShowChatMobile] = useState(false)

    const mensajesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const location = useLocation()
    const { setUnreadForChat, clearUnreadForChat } = useUnread()

    // Referencia para saber el último mensaje visto por chat
    const lastSeenRef = useRef<Record<number, number>>({})

    // Abrir chat automáticamente si viene desde Matchmaking
    useEffect(() => {
        const conexionId = location.state?.abrirConexionId
        if (!conexionId || conexiones.length === 0) return
        const conexion = conexiones.find(c => c.id === conexionId)
        if (conexion) abrirChat(conexion)
    }, [conexiones, location.state])

    // Cargar conexiones aceptadas
    const cargarConexiones = useCallback(async () => {
        try {
            const env = await matchmakingService.getConexiones(user.studentId)
            const recv = await matchmakingService.getSolicitudesRecibidas(user.studentId)
            const todas = [
                ...(Array.isArray(env) ? env : []),
                ...(Array.isArray(recv) ? recv : []),
            ]
            const aceptadas = todas.filter(c => c.estado === 'ACEPTADA')
            // Deduplicar por id
            const unicas = Array.from(new Map(aceptadas.map(c => [c.id, c])).values())
            setConexiones(unicas)
        } catch { }
        setLoadingConexiones(false)
    }, [user.studentId])

    useEffect(() => {
        cargarConexiones()
    }, [cargarConexiones])

    // Polling de mensajes cada 4 segundos cuando hay chat activo
    const cargarMensajes = useCallback(async (conexionId: number) => {
        try {
            const msgs = await chatService.getMensajes(conexionId, user.studentId)
            const lista = Array.isArray(msgs) ? msgs : []
            setMensajes(lista)

            // Contar mensajes no leídos (del otro, más nuevos que el último visto)
            const lastSeen = lastSeenRef.current[conexionId] || 0
            const noLeidos = lista.filter(
                (m: any) =>
                    m.remitente?.studentId?.toUpperCase() !== user.studentId?.toUpperCase() &&
                    m.id > lastSeen
            ).length
            setUnreadForChat(conexionId, noLeidos)
        } catch { }
    }, [user.studentId, setUnreadForChat])

    useEffect(() => {
        if (!activeChat) return
        setLoadingMensajes(true)
        cargarMensajes(activeChat.id).finally(() => setLoadingMensajes(false))

        pollingRef.current = setInterval(() => {
            cargarMensajes(activeChat.id)
        }, 4000)

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current)
        }
    }, [activeChat, cargarMensajes])

    // Scroll al último mensaje
    useEffect(() => {
        mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [mensajes])

    const abrirChat = (conexion: any) => {
        setActiveChat(conexion)
        setMensajes([])
        setTexto('')
        setImagenPreview(null)
        setImagenFile(null)
        setShowChatMobile(true)

        // Marcar como leído: guardamos el ID del último mensaje actual
        const ultimoMensaje = mensajes[mensajes.length - 1]
        if (ultimoMensaje) {
            lastSeenRef.current[conexion.id] = ultimoMensaje.id
        }
        clearUnreadForChat(conexion.id)
    }

    useEffect(() => {
        if (!activeChat || mensajes.length === 0) return
        const ultimo = mensajes[mensajes.length - 1]
        lastSeenRef.current[activeChat.id] = ultimo.id
        clearUnreadForChat(activeChat.id)
    }, [mensajes, activeChat, clearUnreadForChat])

    const cerrarChat = () => {
        setShowChatMobile(false)
        setTimeout(() => setActiveChat(null), 200)
    }

    const handleImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImagenFile(file)
        const reader = new FileReader()
        reader.onload = () => setImagenPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    const handleEnviar = async () => {
        if (!activeChat) return
        if (!texto.trim() && !imagenFile) return
        setEnviando(true)
        try {
            await chatService.enviarMensaje(activeChat.id, user.studentId, texto.trim() || undefined, imagenFile || undefined)
            setTexto('')
            setImagenPreview(null)
            setImagenFile(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            await cargarMensajes(activeChat.id)
        } catch { } finally {
            setEnviando(false)
        }
    }

    const onMensajeEliminado = useCallback(() => {
        if (activeChat) cargarMensajes(activeChat.id)
    }, [activeChat, cargarMensajes])

    // Nombre del otro participante en la conexión
    const getOtroNombre = (conexion: any) => {
        const duenio = conexion.solicitud?.usuario
        const conector = conexion.usuario
        if (duenio?.studentId?.toUpperCase() === user.studentId?.toUpperCase()) {
            return conector?.nombre || 'Usuario'
        }
        return duenio?.nombre || 'Usuario'
    }

    const getOtroInitials = (conexion: any) => {
        const nombre = getOtroNombre(conexion)
        return nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
    }

    const esMio = (msg: any) =>
        msg.remitente?.studentId?.toUpperCase() === user.studentId?.toUpperCase()

    // ── RENDER ──────────────────────────────────────────────────────────────

    return (
        <div className="space-y-5 lg:space-y-0">
            {/* Header Hero — solo visible en mobile cuando NO hay chat abierto */}
            <div className={`bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl ${showChatMobile ? 'hidden' : 'block'} lg:hidden`}>
                <h1 className="text-2xl font-black tracking-tight mb-1">Chats</h1>
                <p className="text-red-100 text-sm opacity-90">Coordina con tus compañeros de juego</p>
            </div>

            {/* Layout desktop: dos columnas fijas */}
            <div className="hidden lg:flex gap-0 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>

                {/* Columna izquierda: lista de chats */}
                <div className="w-80 flex-shrink-0 border-r border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="font-black text-gray-900 dark:text-white text-lg">Chats</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Conexiones aceptadas</p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ListaChats
                            conexiones={conexiones}
                            loading={loadingConexiones}
                            activeId={activeChat?.id}
                            onSelect={abrirChat}
                            getOtroNombre={getOtroNombre}
                            getOtroInitials={getOtroInitials}
                            getOtroFoto={getOtroFoto}
                            miStudentId={user.studentId}
                        />
                    </div>
                </div>

                {/* Columna derecha: conversación */}
                <div className="flex-1 flex flex-col">
                    {activeChat ? (
                        <PantallaChat
                            activeChat={activeChat}
                            mensajes={mensajes}
                            loading={loadingMensajes}
                            texto={texto}
                            setTexto={setTexto}
                            imagenPreview={imagenPreview}
                            setImagenPreview={setImagenPreview}
                            setImagenFile={setImagenFile}
                            fileInputRef={fileInputRef}
                            enviando={enviando}
                            handleEnviar={handleEnviar}
                            handleImagen={handleImagen}
                            esMio={esMio}
                            mensajesEndRef={mensajesEndRef}
                            getOtroNombre={getOtroNombre}
                            getOtroInitials={getOtroInitials}
                            getOtroFoto={getOtroFoto}
                            miStudentId={user.studentId}
                            onBack={undefined}
                            onMensajeEliminado={onMensajeEliminado}
                            studentId={user.studentId}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <MessageCircle className="text-gray-400" size={28} />
                            </div>
                            <p className="font-bold text-gray-700 dark:text-gray-300">Selecciona un chat</p>
                            <p className="text-sm text-gray-400">Elige una conversación de la lista</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Layout mobile */}
            <div className="lg:hidden">
                {!showChatMobile ? (
                    <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
                        <ListaChats
                            conexiones={conexiones}
                            loading={loadingConexiones}
                            activeId={activeChat?.id}
                            onSelect={abrirChat}
                            getOtroNombre={getOtroNombre}
                            getOtroInitials={getOtroInitials}
                            getOtroFoto={getOtroFoto}
                            miStudentId={user.studentId}
                        />
                    </div>
                ) : (
                    <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
                        {activeChat && (
                            <PantallaChat
                                activeChat={activeChat}
                                mensajes={mensajes}
                                loading={loadingMensajes}
                                texto={texto}
                                setTexto={setTexto}
                                imagenPreview={imagenPreview}
                                setImagenPreview={setImagenPreview}
                                setImagenFile={setImagenFile}
                                fileInputRef={fileInputRef}
                                enviando={enviando}
                                handleEnviar={handleEnviar}
                                handleImagen={handleImagen}
                                esMio={esMio}
                                mensajesEndRef={mensajesEndRef}
                                getOtroNombre={getOtroNombre}
                                getOtroInitials={getOtroInitials}
                                getOtroFoto={getOtroFoto}
                                miStudentId={user.studentId}
                                onBack={cerrarChat}
                                onMensajeEliminado={onMensajeEliminado}
                                studentId={user.studentId}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ── Sub-componente: lista de chats ──────────────────────────────────────────

function ListaChats({ conexiones, loading, activeId, onSelect, getOtroNombre, getOtroInitials, getOtroFoto, miStudentId }: any) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
        )
    }
    if (conexiones.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <MessageCircle className="text-gray-300 dark:text-gray-600" size={40} />
                <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">Sin chats aún</p>
                <p className="text-xs text-gray-400">Acepta o recibe una conexión en Matchmaking para empezar a chatear</p>
            </div>
        )
    }
    return (
        <div>
            {conexiones.map((c: any) => {
                const isActive = activeId === c.id
                const foto = getOtroFoto(c, miStudentId)
                return (
                    <button
                        key={c.id}
                        onClick={() => onSelect(c)}
                        className={`w-full flex items-center gap-3 px-5 py-4 border-b border-gray-50 dark:border-gray-800/50 text-left transition-colors ${isActive ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}
                    >
                        <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl overflow-hidden flex items-center justify-center text-white font-black text-base flex-shrink-0">
                            {foto
                                ? <img src={`${BASE_URL}${foto}`} alt="" className="w-full h-full object-cover" />
                                : getOtroInitials(c)
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`font-bold text-sm truncate ${isActive ? 'text-red-700 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                {getOtroNombre(c)}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{c.solicitud?.deporte} · {c.solicitud?.disponibilidad}</p>
                        </div>
                        {isActive && <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />}
                    </button>
                )
            })}
        </div>
    )
}

// ── Sub-componente: pantalla de conversación ────────────────────────────────

function PantallaChat({
    activeChat, mensajes, loading, texto, setTexto,
    imagenPreview, setImagenPreview, setImagenFile,
    fileInputRef, enviando, handleEnviar, handleImagen,
    esMio, mensajesEndRef, getOtroNombre, getOtroInitials, getOtroFoto, miStudentId, onBack,
    onMensajeEliminado, studentId
}: any) {
    const [imagenModal, setImagenModal] = useState<string | null>(null)
    const [showGaleria, setShowGaleria] = useState(false)
    const [eliminando, setEliminando] = useState<number | null>(null)

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEnviar() }
    }

    const handleEliminar = async (msgId: number) => {
        setEliminando(msgId)
        try {
            await chatService.eliminarMensaje(msgId, studentId)
            onMensajeEliminado()
        } catch { } finally { setEliminando(null) }
    }

    const fotosDelChat = mensajes.filter((m: any) => m.imagenUrl)
    const fotoActiveChat = getOtroFoto(activeChat, miStudentId)

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                {onBack && (
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors mr-1">
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {fotoActiveChat
                        ? <img src={`${BASE_URL}${fotoActiveChat}`} alt="" className="w-full h-full object-cover" />
                        : getOtroInitials(activeChat)
                    }
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-black text-gray-900 dark:text-white text-sm truncate">{getOtroNombre(activeChat)}</p>
                    <p className="text-xs text-gray-400">{activeChat.solicitud?.deporte}</p>
                </div>
                {fotosDelChat.length > 0 && (
                    <button
                        onClick={() => setShowGaleria(true)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors flex-shrink-0"
                        title="Ver galería"
                    >
                        <Images size={18} className="text-gray-500" />
                    </button>
                )}
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                    </div>
                ) : mensajes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                        <p className="text-sm font-bold text-gray-400">Aún no hay mensajes</p>
                        <p className="text-xs text-gray-300 dark:text-gray-600">Sé el primero en escribir</p>
                    </div>
                ) : (
                    mensajes.map((msg: any) => {
                        const mio = esMio(msg)
                        return (
                            <div key={msg.id} className={`flex items-end gap-2 ${mio ? 'justify-end' : 'justify-start'}`}>
                                {/* Botón eliminar — solo mis mensajes */}
                                {mio && (
                                    <button
                                        onClick={() => handleEliminar(msg.id)}
                                        disabled={eliminando === msg.id}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all flex-shrink-0 self-center"
                                        style={{ opacity: eliminando === msg.id ? 1 : undefined }}
                                    >
                                        {eliminando === msg.id
                                            ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                                            : <X size={14} />}
                                    </button>
                                )}
                                <div className={`group max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${mio ? 'bg-red-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-bl-sm'}`}>
                                    {msg.imagenUrl && (
                                        <img
                                            src={`${BASE_URL}${msg.imagenUrl}`}
                                            alt="imagen"
                                            className="rounded-xl mb-2 max-w-full max-h-48 object-cover cursor-pointer"
                                            onClick={() => setImagenModal(`${BASE_URL}${msg.imagenUrl}`)}
                                        />
                                    )}
                                    {msg.contenido && <p className="text-sm leading-relaxed">{msg.contenido}</p>}
                                    <p className={`text-[10px] mt-1 ${mio ? 'text-red-200' : 'text-gray-400'}`}>
                                        {new Date(msg.creadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                {/* Espacio para alinear mensajes del otro lado */}
                                {!mio && <div className="w-6 flex-shrink-0" />}
                            </div>
                        )
                    })
                )}
                <div ref={mensajesEndRef} />
            </div>

            {/* Preview imagen adjunta */}
            {imagenPreview && (
                <div className="px-4 pb-2 flex-shrink-0">
                    <div className="relative inline-block">
                        <img src={imagenPreview} alt="preview" className="h-20 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
                        <button
                            onClick={() => { setImagenPreview(null); setImagenFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center shadow"
                        >
                            <X size={12} />
                        </button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-2 flex-shrink-0">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagen} />
                <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex-shrink-0">
                    <Image size={20} />
                </button>
                <textarea
                    value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={handleKey}
                    placeholder="Escribe un mensaje..." rows={1}
                    className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none resize-none dark:text-white max-h-28"
                    style={{ lineHeight: '1.4' }}
                />
                <button
                    onClick={handleEnviar}
                    disabled={enviando || (!texto.trim() && !imagenPreview)}
                    className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex-shrink-0 shadow-md"
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Modal imagen ampliada */}
            {imagenModal && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={() => setImagenModal(null)}>
                    <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                        <img src={imagenModal} alt="preview" className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl" />
                        <button onClick={() => setImagenModal(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-900 rounded-full flex items-center justify-center shadow-lg font-bold text-sm">✕</button>
                    </div>
                </div>,
                document.body
            )}

            {/* Modal galería de fotos */}
            {showGaleria && createPortal(
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end lg:items-center justify-center z-[9999] p-4" onClick={() => setShowGaleria(false)}>
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-black text-gray-900 dark:text-white">Fotos compartidas</h3>
                            <button onClick={() => setShowGaleria(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4">
                            <div className="grid grid-cols-3 gap-2">
                                {fotosDelChat.map((m: any) => (
                                    <div key={m.id} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" onClick={() => { setShowGaleria(false); setImagenModal(`${BASE_URL}${m.imagenUrl}`) }}>
                                        <img src={`${BASE_URL}${m.imagenUrl}`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}