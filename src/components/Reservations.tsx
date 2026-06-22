import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, X, AlertTriangle } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay, isBefore, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { reservaService } from '../services/api'
import { useToast } from './Toast'

interface ReservationsProps {
    user: any
}

const LIMITE_RESERVAS_ACTIVAS = 3

export function Reservations({ user }: ReservationsProps) {
    const { showToast } = useToast()
    const [selectedSport, setSelectedSport] = useState('all')
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [selectedDay, setSelectedDay] = useState(new Date())
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [reservasDB, setReservasDB] = useState<any[]>([])
    const [reservasFecha, setReservasFecha] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    const [showCancelModal, setShowCancelModal] = useState(false)
    const [reservaACancelar, setReservaACancelar] = useState<any>(null)

    const sports = ['Todos', 'Fútbol', 'Básquetbol', 'Vóley', 'Tenis']
    const courts = [
        { id: 1, name: 'Cancha 1', sport: 'Fútbol', capacity: 10 },
        { id: 2, name: 'Cancha 2', sport: 'Vóley', capacity: 12 },
        { id: 3, name: 'Cancha 3', sport: 'Básquetbol', capacity: 10 },
        { id: 4, name: 'Cancha 4', sport: 'Tenis', capacity: 4 },
    ]
    const timeSlots = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00',
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
    }

    const isSlotBooked = (courtName: string, date: Date, time: string) =>
        reservasFecha.some(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === time && r.estado !== 'CANCELADA')

    const isMyReservation = (courtName: string, date: Date, time: string) =>
        reservasFecha.some(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === time && r.usuario?.studentId === user.studentId && r.estado !== 'CANCELADA')

    const getReserva = (courtName: string, date: Date, time: string) =>
        reservasFecha.find(r => r.cancha === courtName && r.fecha === format(date, 'yyyy-MM-dd') && r.horario === time && r.usuario?.studentId === user.studentId)

    const isDiaPasado = (date: Date) => isBefore(startOfDay(date), hoy)

    const isHoraPasada = (date: Date, time: string) => {
        if (!isSameDay(date, new Date())) return false
        const [h, m] = time.split(':').map(Number)
        const slotDate = new Date(date)
        slotDate.setHours(h, m, 0, 0)
        return isBefore(slotDate, new Date())
    }

    const filteredCourts = selectedSport === 'all' ? courts : courts.filter(c => c.sport.toLowerCase() === selectedSport.toLowerCase())

    // Reservas activas reales del usuario, calculadas en cada render
    const reservasActivas = reservasDB.filter(r => r.estado === 'CONFIRMADA')
    const limiteAlcanzado = reservasActivas.length >= LIMITE_RESERVAS_ACTIVAS

    const handleBooking = (court: any, date: Date, time: string) => {
        if (limiteAlcanzado) {
            // Mensaje en página (no toast): el banner ya está visible arriba de las canchas,
            // así que aquí solo evitamos que se abra el modal de reserva.
            return
        }
        if (isDiaPasado(date)) {
            showToast('No puedes reservar en una fecha pasada', 'error')
            return
        }
        if (isHoraPasada(date, time)) {
            showToast('Ese horario ya pasó', 'error')
            return
        }
        if (!isSlotBooked(court.name, date, time)) {
            setSelectedSlot({ court, date, time })
            setShowBookingModal(true)
        }
    }

    const confirmBooking = async () => {
        if (!selectedSlot) return
        try {
            await reservaService.crearReserva({
                studentId: user.studentId,
                cancha: selectedSlot.court.name,
                deporte: selectedSlot.court.sport,
                fecha: format(selectedSlot.date, 'yyyy-MM-dd'),
                horario: selectedSlot.time,
                capacidad: selectedSlot.court.capacity,
            })
            await refrescarReservas()
            showToast('Reserva confirmada con éxito', 'success')
        } catch {
            showToast('No se pudo completar la reserva', 'error')
        }
        setShowBookingModal(false)
        setSelectedSlot(null)
    }

    const pedirConfirmacionSlot = (courtName: string, date: Date, time: string) => {
        const reserva = getReserva(courtName, date, time)
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

    return (
        <div className="space-y-5 lg:space-y-8">
            {/* Header Hero */}
            <div className="bg-gradient-to-br from-red-600 to-black rounded-3xl p-6 lg:p-10 text-white shadow-xl">
                <h1 className="text-2xl lg:text-4xl font-black tracking-tight mb-1 lg:mb-2">Reservas</h1>
                <p className="text-red-100 text-sm lg:text-base opacity-90">Elige tu cancha y horario favorito</p>
            </div>

            {/* Banner de límite alcanzado — mensaje en página, no toast */}
            {limiteAlcanzado && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-bold text-amber-800 dark:text-amber-300 text-sm">Llegaste al límite de {LIMITE_RESERVAS_ACTIVAS} reservas activas</p>
                        <p className="text-amber-700 dark:text-amber-400/80 text-xs mt-0.5">Cancela alguna de tus reservas activas para poder hacer una nueva.</p>
                    </div>
                </div>
            )}

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
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4">{r.deporte} · {format(new Date(r.fecha + 'T00:00:00'), 'dd MMM', { locale: es })} a las {r.horario}</p>
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

            {/* Canchas */}
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
                            <div className="grid grid-cols-4 gap-2 lg:gap-3">
                                {timeSlots.map(time => {
                                    const booked = isSlotBooked(court.name, selectedDay, time)
                                    const myBooking = isMyReservation(court.name, selectedDay, time)
                                    const horaPasada = isHoraPasada(selectedDay, time)
                                    // No bloqueamos los slots "Tuya" por el límite (siempre puedes cancelarlos)
                                    const bloqueadoPorLimite = limiteAlcanzado && !myBooking
                                    const deshabilitado = (booked && !myBooking) || (horaPasada && !myBooking) || bloqueadoPorLimite
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => myBooking ? pedirConfirmacionSlot(court.name, selectedDay, time) : handleBooking(court, selectedDay, time)}
                                            disabled={deshabilitado}
                                            className={`py-2 lg:py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${myBooking
                                                    ? 'bg-red-600 text-white shadow-md'
                                                    : horaPasada
                                                        ? 'bg-gray-50/50 dark:bg-gray-900/30 text-gray-300 dark:text-gray-700 cursor-not-allowed line-through'
                                                        : booked || bloqueadoPorLimite
                                                            ? 'bg-gray-100/50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Confirmación de RESERVA */}
            {showBookingModal && selectedSlot && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl max-w-md w-full p-6 animate-in slide-in-from-bottom shadow-2xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Confirmar reserva</h3>
                            <button onClick={() => { setShowBookingModal(false); setSelectedSlot(null) }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <X size={20} className="text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-3 mb-8">
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
                                <div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">Horario</p><p className="font-bold text-gray-900 dark:text-white">{selectedSlot.time}</p></div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowBookingModal(false); setSelectedSlot(null) }} className="flex-1 px-4 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl active:scale-[0.98] transition-transform">
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
        </div>
    )
}