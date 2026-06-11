import { useState } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, Users, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

interface ReservationsProps {
    user: any
}

export function Reservations({ user }: ReservationsProps) {
    const [selectedSport, setSelectedSport] = useState('all')
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<any>(null)
    const [confirmedReservations, setConfirmedReservations] = useState<any[]>([])

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

    const mockReservations = [
        { courtId: 1, date: format(new Date(), 'yyyy-MM-dd'), time: '18:00', bookedBy: 'user123', players: 8 },
        { courtId: 2, date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), time: '16:00', bookedBy: 'user456', players: 10 },
        { courtId: 3, date: format(new Date(), 'yyyy-MM-dd'), time: '17:00', bookedBy: user?.studentId, players: 6 },
    ]

    const allReservations = [...mockReservations, ...confirmedReservations]
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

    const isSlotBooked = (courtId: number, date: Date, time: string) =>
        allReservations.some(r => r.courtId === courtId && r.date === format(date, 'yyyy-MM-dd') && r.time === time)

    const isMyReservation = (courtId: number, date: Date, time: string) =>
        allReservations.some(r => r.courtId === courtId && r.date === format(date, 'yyyy-MM-dd') && r.time === time && r.bookedBy === user?.studentId)

    const filteredCourts = selectedSport === 'all'
        ? courts
        : courts.filter(c => c.sport.toLowerCase() === selectedSport.toLowerCase())

    const handleBooking = (court: any, date: Date, time: string) => {
        if (!isSlotBooked(court.id, date, time)) {
            setSelectedSlot({ court, date, time })
            setShowBookingModal(true)
        }
    }

    const confirmBooking = () => {
        if (selectedSlot) {
            setConfirmedReservations(prev => [...prev, {
                courtId: selectedSlot.court.id,
                date: format(selectedSlot.date, 'yyyy-MM-dd'),
                time: selectedSlot.time,
                bookedBy: user?.studentId,
                players: 1,
            }])
        }
        setShowBookingModal(false)
        setSelectedSlot(null)
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
                                                const booked = isSlotBooked(court.id, day, time)
                                                const myBooking = isMyReservation(court.id, day, time)
                                                return (
                                                    <button
                                                        key={day.toString()}
                                                        onClick={() => handleBooking(court, day, time)}
                                                        disabled={booked}
                                                        className={`p-2 rounded text-xs font-medium transition-all ${myBooking ? 'bg-red-600 text-white' :
                                                                booked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                                                                    'bg-gray-50 hover:bg-red-50 hover:border-red-300 border border-gray-200'
                                                            }`}
                                                    >
                                                        {myBooking ? 'Tuya' : booked ? 'Ocupado' : 'Libre'}
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
            </div>

            {showBookingModal && selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Reserva</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                <MapPin className="text-red-600" size={20} />
                                <div>
                                    <p className="text-sm text-gray-600">Cancha</p>
                                    <p className="font-semibold text-gray-800">{selectedSlot.court.name}</p>
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
                            <button onClick={() => setShowBookingModal(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={confirmBooking} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-black text-white font-semibold rounded-lg hover:from-red-700 hover:to-gray-900">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}