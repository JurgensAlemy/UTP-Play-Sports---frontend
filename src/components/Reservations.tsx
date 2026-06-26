import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, X, AlertTriangle, Search, Zap, Plus, Trash2 } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { reservaService } from '../services/api'
import { useToast } from './Toast'

interface ReservationsProps {
    user: any
}

const LIMITE_RESERVAS_ACTIVAS = 3

// Bloques fijos de 1h30, de 6:00 a 21:00
const BLOQUES = [
    { inicio: '06:00', fin: '07:30' },
    { inicio: '07:30', fin: '09:00' },
    { inicio: '09:00', fin: '10:30' },
    { inicio: '10:30', fin: '12:00' },
    { inicio: '12:00', fin: '13:30' },
    { inicio: '13:30', fin: '15:00' },
    { inicio: '15:00', fin: '16:30' },
    { inicio: '16:30', fin: '18:00' },
    { inicio: '18:00', fin: '19:30' },
    { inicio: '19:30', fin: '21:00' },
]

const labelBloque = (b: { inicio: string; fin: string }) => `${b.inicio} - ${b.fin}`

export function Reservations({ user }: ReservationsProps) {

    const confirmarEliminacion = async () => {
        if (!reservaAEliminar) return

        try {
            await reservaService.eliminarReserva(reservaAEliminar, user.studentId)
            showToast('Reserva eliminada del historial', 'success')
            refrescarReservas()
        } catch {
            showToast('No se pudo eliminar la reserva', 'error')
        }

        // Cerramos el modal y limpiamos el estado
        setShowDeleteModal(false)
        setReservaAEliminar(null)
    }

    const { showToast } = useToast()
    const [selectedSport, setSelectedSport] = useState('all')
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedDay, setSelectedDay] = useState(new Date())
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [extender, setExtender] = useState(false)
    const [reservasDB, setReservasDB] = useState<any[]>([])
    const [reservasFecha, setReservasFecha] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [reservaAEliminar, setReservaAEliminar] = useState<number | null>(null)

    const [showCancelModal, setShowCancelModal] = useState(false)
    const [reservaACancelar, setReservaACancelar] = useState<any>(null)

    const [showQuickSearch, setShowQuickSearch] = useState(false)
    const [quickSport, setQuickSport] = useState('Fútbol')
    const [quickDate, setQuickDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [quickResults, setQuickResults] = useState<any[] | null>(null)
    const [quickLoading, setQuickLoading] = useState(false)

    const sports = ['Todos', 'Fútbol', 'Básquetbol', 'Vóley', 'Tenis']
    const courts = [
        { id: 1, name: 'Cancha 1', sport: 'Fútbol', capacity: 10 },
        { id: 2, name: 'Cancha 2', sport: 'Vóley', capacity: 12 },
        { id: 3, name: 'Cancha 3', sport: 'Básquetbol', capacity: 10 },
        { id: 4, name: 'Cancha 4', sport: 'Tenis', capacity: 4 },
    ]
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))
    const hoy = startOfDay(new Date())

    useEffect(() => {
        reservaService.getReservasByUsuario(user.studentId).then(setReservasDB).catch(() => { })
    }, [user.studentId])

    useEffect(() => {
        const fetchSemana = async () => {
            setLoadingSlots(true)
            const todas: any[] = []
            for (const day of weekDays) {
                try {
                    const res = await reservaService.getReservasByFecha(format(day, 'yyyy-MM-dd'))
                    if (Array.isArray(res)) todas.push(...res)
                } catch { }
            }
            setReservasFecha(todas)
            setLoadingSlots(false)
        }
        fetchSemana()
    }, [currentWeekStart])

    const refrescarReservas = async () => {
        const todas: any[] = []
        for (const day of weekDays) {
            try {
                const res = await reservaService.getReservasByFecha(format(day, 'yyyy-MM-dd'))
                if (Array.isArray(res)) todas.push(...res)
            } catch { }
        }
        setReservasFecha(todas)
        reservaService.getReservasByUsuario(user.studentId).then(setReservasDB)
        if (quickResults !== null) buscarDisponibilidad()
    }

    const isBloqueOcupado = (courtName: string, date: Date, bloque: { inicio: string; fin: string }) =>
        reservasFecha.some(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === labelBloque(bloque) && r.estado !== 'CANCELADA')

    const isMiBloque = (courtName: string, date: Date, bloque: { inicio: string; fin: string }) =>
        reservasFecha.some(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === labelBloque(bloque) && r.usuario?.studentId === user.studentId && r.estado !== 'CANCELADA')

    const getMiReserva = (courtName: string, date: Date, bloque: { inicio: string; fin: string }) =>
        reservasFecha.find(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === labelBloque(bloque) && r.usuario?.studentId === user.studentId)

    const isDiaPasado = (date: Date) => isBefore(startOfDay(date), hoy)

    const isBloquePasado = (date: Date, bloque: { inicio: string; fin: string }) => {
        if (!isSameDay(date, new Date())) return false
        const [h, m] = bloque.inicio.split(':').map(Number)
        const slotDate = new Date(date)
        slotDate.setHours(h, m, 0, 0)
        return isBefore(slotDate, new Date())
    }

    // Devuelve el bloque siguiente consecutivo, o null si no existe (es el último del día)
    const bloqueSiguiente = (bloque: { inicio: string; fin: string }) => {
        const idx = BLOQUES.findIndex(b => b.inicio === bloque.inicio)
        return idx >= 0 && idx < BLOQUES.length - 1 ? BLOQUES[idx + 1] : null
    }

    const filteredCourts = selectedSport === 'all' ? courts : courts.filter(c => c.sport.toLowerCase() === selectedSport.toLowerCase())

    const reservasActivas = reservasDB.filter(r => r.estado === 'CONFIRMADA')
    const limiteAlcanzado = reservasActivas.length >= LIMITE_RESERVAS_ACTIVAS

    const handleBooking = (court: any, date: Date, bloque: { inicio: string; fin: string }) => {
        if (limiteAlcanzado) return
        if (isDiaPasado(date)) {
            showToast('No puedes reservar en una fecha pasada', 'error')
            return
        }
        if (isBloquePasado(date, bloque)) {
            showToast('Ese horario ya pasó', 'error')
            return
        }
        if (!isBloqueOcupado(court.name, date, bloque)) {
            setSelectedSlot({ court, date, bloque })
            setExtender(false)
            setShowBookingModal(true)
        }
    }

    // ¿El bloque siguiente está libre para ofrecer la opción de extender?
    const puedeExtender = () => {
        if (!selectedSlot) return false
        const siguiente = bloqueSiguiente(selectedSlot.bloque)
        if (!siguiente) return false
        return !isBloqueOcupado(selectedSlot.court.name, selectedSlot.date, siguiente)
    }

    const confirmBooking = async () => {
        if (!selectedSlot) return
        try {
            await reservaService.crearReserva({
                studentId: user.studentId,
                cancha: selectedSlot.court.name,
                deporte: selectedSlot.court.sport,
                fecha: format(selectedSlot.date, 'yyyy-MM-dd'),
                horario: labelBloque(selectedSlot.bloque),
                capacidad: selectedSlot.court.capacity,
            })

            if (extender) {
                const siguiente = bloqueSiguiente(selectedSlot.bloque)
                if (siguiente) {
                    await reservaService.crearReserva({
                        studentId: user.studentId,
                        cancha: selectedSlot.court.name,
                        deporte: selectedSlot.court.sport,
                        fecha: format(selectedSlot.date, 'yyyy-MM-dd'),
                        horario: labelBloque(siguiente),
                        capacidad: selectedSlot.court.capacity,
                    })
                }
            }

            await refrescarReservas()
            showToast(extender ? 'Reserva confirmada con tiempo extendido' : 'Reserva confirmada con éxito', 'success')
        } catch {
            showToast('No se pudo completar la reserva', 'error')
        }
        setShowBookingModal(false)
        setSelectedSlot(null)
        setExtender(false)
    }

    const pedirConfirmacionBloque = (courtName: string, date: Date, bloque: { inicio: string; fin: string }) => {
        const reserva = getMiReserva(courtName, date, bloque)
        if (!reserva) return
        setReservaACancelar(reserva)
        setShowCancelModal(true)
    }

    const pedirConfirmacionCard = (reserva: any) => {
        setReservaACancelar(reserva)
        setShowCancelModal(true)
    }

    const confirmarCancelacion = async () => {
        if (!reservaACancelar) return
        try {
            await reservaService.cancelarReserva(reservaACancelar.id, user.studentId)
            await refrescarReservas()
            showToast('Reserva cancelada', 'info')
        } catch {
            showToast('No se pudo cancelar la reserva', 'error')
        }
        setShowCancelModal(false)
        setReservaACancelar(null)
    }

    useEffect(() => {
        if (isDiaPasado(selectedDay)) {
            setSelectedDay(new Date())
        }
    }, [currentWeekStart])

    const buscarDisponibilidad = async () => {
        setQuickLoading(true)
        try {
            const fechaDate = new Date(quickDate + 'T00:00:00')
            const reservasDelDia = await reservaService.getReservasByFecha(quickDate)
            const ocupados = Array.isArray(reservasDelDia) ? reservasDelDia.filter((r: any) => r.estado !== 'CANCELADA') : []

            const canchasDelDeporte = courts.filter(c => c.sport === quickSport)

            const resultados = canchasDelDeporte.map(court => {
                const bloquesLibres = BLOQUES.filter(b => {
                    const ocupado = ocupados.some((r: any) => r.cancha === court.name && r.horario === labelBloque(b))
                    const pasado = isDiaPasado(fechaDate) || isBloquePasado(fechaDate, b)
                    return !ocupado && !pasado
                })
                return { court, bloquesLibres }
            })

            setQuickResults(resultados)
        } catch {
            showToast('No se pudo buscar disponibilidad', 'error')
            setQuickResults([])
        } finally {
            setQuickLoading(false)
        }
    }

    const reservarDesdeQuickSearch = (court: any, bloque: { inicio: string; fin: string }) => {
        const fechaDate = new Date(quickDate + 'T00:00:00')
        handleBooking(court, fechaDate, bloque)
    }

    return (
        <div className="space-y-5 lg:space-y-8">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl">
                <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-1 lg:mb-2">Reservas</h1>
                <p className="text-red-100 text-sm lg:text-base opacity-90">Elige tu cancha y horario favorito</p>
            </div>

            {/* Banner de límite alcanzado */}
            {limiteAlcanzado && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Llegaste al límite de {LIMITE_RESERVAS_ACTIVAS} reservas activas</p>
                        <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-0.5">Cancela alguna de tus reservas activas para poder hacer una nueva.</p>
                    </div>
                </div>
            )}

            {/* Buscador rápido */}
            <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 lg:p-6 shadow-sm">
                <button onClick={() => setShowQuickSearch(!showQuickSearch)} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                            <Zap className="text-red-600" size={18} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">Buscador rápido</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Encuentra disponibilidad al instante</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className={`text-gray-400 transition-transform ${showQuickSearch ? 'rotate-90' : ''}`} />
                </button>

                {showQuickSearch && (
                    <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Deporte</label>
                                <select
                                    value={quickSport}
                                    onChange={e => { setQuickSport(e.target.value); setQuickResults(null) }}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                                >
                                    {['Fútbol', 'Básquetbol', 'Vóley', 'Tenis'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">Fecha</label>
                                <input
                                    type="date"
                                    value={quickDate}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => { setQuickDate(e.target.value); setQuickResults(null) }}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                                />
                            </div>
                        </div>

                        <button
                            onClick={buscarDisponibilidad}
                            disabled={quickLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-black text-white font-bold rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50"
                        >
                            <Search size={16} />
                            {quickLoading ? 'Buscando...' : 'Buscar disponibilidad'}
                        </button>

                        {quickResults !== null && (
                            <div className="space-y-3 pt-2">
                                {quickResults.every(r => r.bloquesLibres.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-2xl py-8">
                                        <CalendarIcon className="text-gray-300" size={32} />
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin disponibilidad para {quickSport} ese día</p>
                                    </div>
                                ) : (
                                    quickResults.filter(r => r.bloquesLibres.length > 0).map((r: any) => (
                                        <div key={r.court.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <MapPin size={15} className="text-red-600" />
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{r.court.name}</p>
                                                <span className="text-[10px] font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                                                    {r.bloquesLibres.length} libres
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {r.bloquesLibres.map((b: any) => (
                                                    <button
                                                        key={b.inicio}
                                                        onClick={() => reservarDesdeQuickSearch(r.court, b)}
                                                        disabled={limiteAlcanzado}
                                                        className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        {labelBloque(b)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Filtro deporte */}
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                {sports.map(sport => {
                    const value = sport === 'Todos' ? 'all' : sport
                    const isActive = selectedSport === value
                    return (
                        <button
                            key={sport}
                            onClick={() => setSelectedSport(value)}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isActive
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-md text-gray-700 dark:text-gray-300 border border-white/50 dark:border-white/5 hover:bg-white dark:hover:bg-gray-800'
                                }`}
                        >
                            {sport}
                        </button>
                    )
                })}
            </div>

            {/* Mis reservas activas */}
            {reservasActivas.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-900 dark:text-white text-sm lg:text-lg">Mis reservas activas</h2>
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {reservasActivas.length}/{LIMITE_RESERVAS_ACTIVAS}
                        </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                        {reservasActivas.map(r => (
                            <div key={r.id} className="flex-shrink-0 w-64 lg:w-72 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                        <MapPin className="text-red-600" size={18} />
                                    </div>
                                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-[10px] font-bold">
                                        {r.estado}
                                    </span>
                                </div>
                                <p className="font-black text-gray-900 dark:text-white text-base">{r.cancha}</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">{r.deporte} · {format(new Date(r.fecha + 'T00:00:00'), 'dd MMM', { locale: es })} · {r.horario}</p>
                                <button
                                    onClick={() => pedirConfirmacionCard(r)}
                                    className="w-full py-2 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl active:scale-[0.98] transition-transform"
                                >
                                    Cancelar reserva
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reservas canceladas */}
            {reservasDB.filter(r => r.estado === 'CANCELADA').length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-bold text-gray-900 dark:text-white text-sm lg:text-lg">Reservas canceladas</h2>
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            {reservasDB.filter(r => r.estado === 'CANCELADA').length}
                        </span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide">
                        {reservasDB.filter(r => r.estado === 'CANCELADA').map(r => (
                            <div key={r.id} className="flex-shrink-0 w-64 lg:w-72 bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-sm opacity-70">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                        <MapPin className="text-gray-500" size={18} />
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold">
                                        CANCELADA
                                    </span>
                                </div>
                                <p className="font-black text-gray-900 dark:text-white text-base">{r.cancha}</p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">{r.deporte} · {format(new Date(r.fecha + 'T00:00:00'), 'dd MMM', { locale: es })} · {r.horario}</p>
                                <button
                                    onClick={() => { setReservaAEliminar(r.id); setShowDeleteModal(true); }}
                                    className="w-full py-2 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl active:scale-[0.98] transition-all"
                                >
                                    🗑️ Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendario */}
            <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white text-sm lg:text-lg">Calendario</h2>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))}
                            disabled={isBefore(addDays(currentWeekStart, -1), hoy) && isBefore(addDays(currentWeekStart, -7), hoy)}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={18} className="text-gray-500" />
                        </button>
                        <span className="text-xs lg:text-sm font-bold text-gray-600 dark:text-gray-300 min-w-[100px] text-center">
                            {format(currentWeekStart, 'dd MMM', { locale: es })}
                        </span>
                        <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg active:scale-95 transition-all">
                            <ChevronRight size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {weekDays.map(day => {
                        const isSelected = isSameDay(day, selectedDay)
                        const isToday = isSameDay(day, new Date())
                        const pasado = isDiaPasado(day)
                        return (
                            <button
                                key={day.toString()}
                                onClick={() => !pasado && setSelectedDay(day)}
                                disabled={pasado}
                                className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 lg:w-16 lg:h-20 rounded-2xl transition-all ${pasado
                                    ? 'bg-gray-50 dark:bg-gray-900/40 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-50'
                                    : isSelected
                                        ? 'bg-red-600 text-white shadow-md scale-105'
                                        : isToday
                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className="text-[10px] lg:text-xs font-bold uppercase mb-1">{format(day, 'EEE', { locale: es })}</span>
                                <span className="text-lg lg:text-xl font-black">{format(day, 'd')}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Canchas — ahora con bloques de 1h30 */}
            {loadingSlots ? (
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
            ) : (
                <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
                    {filteredCourts.map(court => (
                        <div key={court.id} className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin size={18} className="text-red-600" />
                                <h3 className="font-black text-gray-900 dark:text-white text-base">{court.name}</h3>
                                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{court.sport}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {BLOQUES.map(bloque => {
                                    const ocupado = isBloqueOcupado(court.name, selectedDay, bloque)
                                    const esMio = isMiBloque(court.name, selectedDay, bloque)
                                    const pasado = isBloquePasado(selectedDay, bloque)
                                    const bloqueadoPorLimite = limiteAlcanzado && !esMio
                                    const deshabilitado = (ocupado && !esMio) || (pasado && !esMio) || bloqueadoPorLimite
                                    return (
                                        <button
                                            key={bloque.inicio}
                                            onClick={() => esMio ? pedirConfirmacionBloque(court.name, selectedDay, bloque) : handleBooking(court, selectedDay, bloque)}
                                            disabled={deshabilitado}
                                            className={`py-2.5 rounded-xl text-[11px] lg:text-xs font-bold transition-all active:scale-95 ${esMio
                                                ? 'bg-red-600 text-white shadow-md'
                                                : pasado
                                                    ? 'bg-gray-50/50 dark:bg-gray-900/30 text-gray-300 dark:text-gray-700 cursor-not-allowed line-through'
                                                    : ocupado || bloqueadoPorLimite
                                                        ? 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400'
                                                }`}
                                        >
                                            {labelBloque(bloque)}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Confirmación de RESERVA — con opción de extender */}
            {showBookingModal && selectedSlot && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Confirmar reserva</h3>
                            <button onClick={() => { setShowBookingModal(false); setSelectedSlot(null); setExtender(false) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center"><MapPin className="text-red-600" size={18} /></div>
                                <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Cancha</p><p className="font-bold text-gray-900 dark:text-white">{selectedSlot.court.name} — {selectedSlot.court.sport}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center"><CalendarIcon className="text-red-600" size={18} /></div>
                                <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Fecha</p><p className="font-bold text-gray-900 dark:text-white">{format(selectedSlot.date, 'dd MMMM yyyy', { locale: es })}</p></div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center"><Clock className="text-red-600" size={18} /></div>
                                <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Horario</p><p className="font-bold text-gray-900 dark:text-white">{labelBloque(selectedSlot.bloque)}{extender && bloqueSiguiente(selectedSlot.bloque) ? ` + ${labelBloque(bloqueSiguiente(selectedSlot.bloque)!)}` : ''}</p></div>
                            </div>
                        </div>

                        {/* Opción de extender — solo aparece si el bloque siguiente está libre */}
                        {puedeExtender() && (
                            <button
                                onClick={() => setExtender(!extender)}
                                className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 mb-6 transition-all ${extender
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                    : 'border-dashed border-gray-200 dark:border-gray-700 hover:border-red-300'
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${extender ? 'bg-red-600' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                    <Plus className={extender ? 'text-white' : 'text-gray-400'} size={18} />
                                </div>
                                <div className="text-left flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Extender a {labelBloque(bloqueSiguiente(selectedSlot.bloque)!)}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">El siguiente bloque está libre, ¿quieres reservarlo también?</p>
                                </div>
                            </button>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => { setShowBookingModal(false); setSelectedSlot(null); setExtender(false) }} className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform">
                                Cancelar
                            </button>
                            <button onClick={confirmBooking} className="flex-1 px-4 py-4 bg-gradient-to-r from-red-600 to-black text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-red-600/30">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmación de CANCELACIÓN */}
            {showCancelModal && reservaACancelar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="text-red-600" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Cancelar esta reserva?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción no se puede deshacer.</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-800">
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{reservaACancelar.cancha} — {reservaACancelar.deporte}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                {format(new Date(reservaACancelar.fecha + 'T00:00:00'), 'dd MMMM yyyy', { locale: es })} · {reservaACancelar.horario}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowCancelModal(false); setReservaACancelar(null) }}
                                className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                No, mantenerla
                            </button>
                            <button
                                onClick={confirmarCancelacion}
                                className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-red-600/30"
                            >
                                Sí, cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmación de CANCELACIÓN */}
            {showCancelModal && reservaACancelar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    {/* ... (todo el código del modal de cancelar que ya tenías) ... */}
                </div>
            )}

            {/* Modal Confirmación de ELIMINACIÓN */}
            {showDeleteModal && reservaAEliminar && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="text-red-600" size={28} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">¿Eliminar del historial?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Esta acción borrará la reserva cancelada de tu vista permanentemente.</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setReservaAEliminar(null) }}
                                className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmarEliminacion}
                                className="flex-1 px-4 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-red-600/30"
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}