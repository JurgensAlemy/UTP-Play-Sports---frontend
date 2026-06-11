import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { reservaService } from '../services/api'

interface ReservationsProps {
    user: any
}

export function Reservations({ user }: ReservationsProps) {
    const [selectedSport, setSelectedSport] = useState('all')
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [reservasDB, setReservasDB] = useState<any[]>([])
    const [reservasFecha, setReservasFecha] = useState<any[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

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

    // Cargar reservas del usuario
    useEffect(() => {
        reservaService.getReservasByUsuario(user.studentId).then(setReservasDB).catch(() => { })
    }, [user.studentId])

    // Cargar reservas por fecha cuando cambia la semana
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

    const isSlotBooked = (courtName: string, date: Date, time: string) =>
        reservasFecha.some(r =>
            r.cancha === courtName &&
            r.fecha === format(date, 'yyyy-MM-dd') &&
            r.horario === time &&
            r.estado !== 'CANCELADA'
        )

    const isMyReservation = (courtName: string, date: Date, time: string) =>
        reservasFecha.some(r =>
            r.cancha === courtName &&
            r.fecha === format(date, 'yyyy-MM-dd') &&
            r.horario === time &&
            r.usuario?.studentId === user.studentId &&
            r.estado !== 'CANCELADA'
        )

    const getReservaId = (courtName: string, date: Date, time: string) =>
        reservasFecha.find(r =>
            r.cancha === courtName &&
            r.fecha === format(date, 'yyyy-MM-dd') &&
            r.horario === time &&
            r.usuario?.studentId === user.studentId
        )?.id

    const filteredCourts = selectedSport === 'all'
        ? courts
        : courts.filter(c => c.sport.toLowerCase() === selectedSport.toLowerCase())

    const handleBooking = (court: any, date: Date, time: string) => {
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
            // Recargar reservas
            const todas: any[] = []
            for (const day of weekDays) {
                try {
                    const res = await reservaService.getReservasByFecha(format(day, 'yyyy-MM-dd'))
                    if (Array.isArray(res)) todas.push(...res)
                } catch { }
            }
            setReservasFecha(todas)
            reservaService.getReservasByUsuario(user.studentId).then(setReservasDB)
        } catch { }
        setShowBookingModal(false)
        setSelectedSlot(null)
    }

    const handleCancelar = async (courtName: string, date: Date, time: string) => {
        const id = getReservaId(courtName, date, time)
        if (!id) return
        await reservaService.cancelarReserva(id, user.studentId)
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Reservas de Canchas</h1>
                    <p className="text-gray-600">Reserva tu cancha deportiva favorita</p>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="text-gray-500" size={20} />
                    <select
                        value={selectedSport}
                        onChange={(e) => setSelectedSport(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    >
                        {sports.map(sport => (
                            <option key={sport} value={sport === 'Todos' ? 'all' : sport}>{sport}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Mis reservas activas */}
            {reservasDB.filter(r => r.estado === 'CONFIRMADA').length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Mis Reservas Activas</h2>
                    <div className="space-y-3">
                        {reservasDB.filter(r => r.estado === 'CONFIRMADA').map(r => (
                            <div key={r.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                        <MapPin className="text-red-600" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{r.cancha} — {r.deporte}</p>
                                        <p className="text-sm text-gray-600">{r.fecha} • {r.horario}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        {r.estado}
                                    </span>
                                    <button
                                        onClick={() => reservaService.cancelarReserva(r.id, user.studentId).then(() =>
                                            reservaService.getReservasByUsuario(user.studentId).then(setReservasDB)
                                        )}
                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Calendario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Calendario Semanal</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, -1))} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-medium text-gray-600 min-w-48 text-center">
                            {format(currentWeekStart, 'dd MMM', { locale: es })} - {format(addDays(currentWeekStart, 6), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <button onClick={() => setCurrentWeekStart(addWeeks(currentWeekStart, 1))} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {loadingSlots ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-8 gap-2 mb-4">
                                <div className="font-semibold text-gray-700 text-sm">Horario</div>
                                {weekDays.map(day => (
                                    <div key={day.toString()} className={`text-center p-2 rounded-lg ${isSameDay(day, new Date()) ? 'bg-red-100 text-red-700 font-semibold' : 'text-gray-600'}`}>
                                        <div className="text-xs">{format(day, 'EEE', { locale: es })}</div>
                                        <div className="text-lg font-semibold">{format(day, 'd')}</div>
                                    </div>
                                ))}
                            </div>

                            {filteredCourts.map(court => (
                                <div key={court.id} className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin size={16} className="text-red-600" />
                                        <h3 className="font-semibold text-gray-800">{court.name}</h3>
                                        <span className="text-xs text-gray-500">({court.sport})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {timeSlots.slice(0, 8).map(time => (
                                            <div key={time} className="grid grid-cols-8 gap-2">
                                                <div className="flex items-center text-sm text-gray-600 font-medium">{time}</div>
                                                {weekDays.map(day => {
                                                    const booked = isSlotBooked(court.name, day, time)
                                                    const myBooking = isMyReservation(court.name, day, time)
                                                    return (
                                                        <button
                                                            key={day.toString()}
                                                            onClick={() => myBooking
                                                                ? handleCancelar(court.name, day, time)
                                                                : handleBooking(court, day, time)
                                                            }
                                                            disabled={booked && !myBooking}
                                                            className={`p-2 rounded text-xs font-medium transition-all ${myBooking
                                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                                    : booked
                                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                        : 'bg-gray-50 hover:bg-red-50 hover:border-red-300 border border-gray-200'
                                                                }`}
                                                        >
                                                            {myBooking ? 'Tuya ✕' : booked ? 'Ocupado' : 'Libre'}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal confirmación */}
            {showBookingModal && selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Reserva</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <MapPin className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Cancha</p>
                                    <p className="font-semibold text-gray-800">{selectedSlot.court.name} — {selectedSlot.court.sport}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <CalendarIcon className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Fecha</p>
                                    <p className="font-semibold text-gray-800">{format(selectedSlot.date, 'dd MMMM yyyy', { locale: es })}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Clock className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Horario</p>
                                    <p className="font-semibold text-gray-800">{selectedSlot.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <Users className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Capacidad</p>
                                    <p className="font-semibold text-gray-800">{selectedSlot.court.capacity} jugadores</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setShowBookingModal(false); setSelectedSlot(null) }}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={confirmBooking}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-black text-white font-semibold rounded-lg hover:from-red-700 hover:to-gray-900">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}