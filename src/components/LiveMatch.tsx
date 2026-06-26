import { useState, useEffect } from 'react'
import { Radio, MapPin, Clock, Trophy } from 'lucide-react'
import { reservaService } from '../services/api'
import { format } from 'date-fns'

interface LiveMatchProps {
    refreshKey?: number
}

// Generador pseudo-aleatorio determinístico (mulberry32) — mismo seed = misma secuencia siempre
function createRng(seed: number) {
    return function () {
        seed |= 0
        seed = (seed + 0x6D2B79F5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

function hashId(id: number) {
    return id * 2654435761 % 2147483647
}

// Genera eventos de marcador en momentos fijos del partido (en minutos desde el inicio)
function generarEventos(reservaId: number, duracionMin: number) {
    const rng = createRng(hashId(reservaId))
    const cantidadEventos = 3 + Math.floor(rng() * 5) // entre 3 y 7 eventos
    const eventos: { minuto: number; equipo: 'local' | 'visita' }[] = []
    for (let i = 0; i < cantidadEventos; i++) {
        const minuto = Math.floor(rng() * (duracionMin - 2)) + 1
        const equipo = rng() < 0.52 ? 'local' : 'visita'
        eventos.push({ minuto, equipo })
    }
    return eventos.sort((a, b) => a.minuto - b.minuto)
}

function parseRango(horario: string): { inicio: string; fin: string } | null {
    const partes = horario.split('-').map(p => p.trim())
    if (partes.length !== 2) return null
    return { inicio: partes[0], fin: partes[1] }
}

function combinarFechaHora(fecha: string, hora: string) {
    const [h, m] = hora.split(':').map(Number)
    const d = new Date(fecha + 'T00:00:00')
    d.setHours(h, m, 0, 0)
    return d
}

const sportEmoji = (s: string) => {
    switch (s) {
        case 'Fútbol': return '⚽'
        case 'Básquetbol': return '🏀'
        case 'Vóley': return '🏐'
        case 'Tenis': return '🎾'
        default: return '🏆'
    }
}

export function LiveMatch({ refreshKey }: LiveMatchProps) {
    const [partidos, setPartidos] = useState<any[]>([])
    const [now, setNow] = useState(new Date())

    // Reloj interno — actualiza cada segundo para el cronómetro
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    // Carga las reservas de hoy y filtra las que están en curso
    useEffect(() => {
        const cargar = async () => {
            try {
                const hoy = format(new Date(), 'yyyy-MM-dd')
                const res = await reservaService.getReservasByFecha(hoy)
                const lista = Array.isArray(res) ? res : []
                setPartidos(lista.filter((r: any) => r.estado === 'CONFIRMADA'))
            } catch { }
        }
        cargar()
        const poll = setInterval(cargar, 30000) // refresca lista cada 30s
        return () => clearInterval(poll)
    }, [refreshKey])

    const enVivo = partidos
        .map((r: any) => {
            const rango = parseRango(r.horario)
            if (!rango) return null
            const inicio = combinarFechaHora(r.fecha, rango.inicio)
            const fin = combinarFechaHora(r.fecha, rango.fin)
            if (now < inicio || now > fin) return null
            return { reserva: r, inicio, fin }
        })
        .filter(Boolean) as { reserva: any; inicio: Date; fin: Date }[]

    if (enVivo.length === 0) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center w-6 h-6">
                    <span className="absolute w-6 h-6 bg-red-500 rounded-full opacity-40 animate-ping" />
                    <span className="relative w-2.5 h-2.5 bg-red-600 rounded-full" />
                </div>
                <h2 className="font-black text-gray-900 dark:text-white text-base lg:text-lg">Partido en vivo</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {enVivo.map(({ reserva, inicio, fin }) => (
                    <LiveMatchCard key={reserva.id} reserva={reserva} inicio={inicio} fin={fin} now={now} />
                ))}
            </div>
        </div>
    )
}

function LiveMatchCard({ reserva, inicio, fin, now }: { reserva: any; inicio: Date; fin: Date; now: Date }) {
    const duracionMin = Math.round((fin.getTime() - inicio.getTime()) / 60000)
    const elapsedMs = now.getTime() - inicio.getTime()
    const elapsedMin = Math.floor(elapsedMs / 60000)
    const elapsedSec = Math.floor((elapsedMs % 60000) / 1000)
    const progreso = Math.min(100, (elapsedMs / (fin.getTime() - inicio.getTime())) * 100)

    const eventos = generarEventos(reserva.id, duracionMin)
    let golesLocal = 0
    let golesVisita = 0
    for (const ev of eventos) {
        if (ev.minuto <= elapsedMin) {
            if (ev.equipo === 'local') golesLocal++
            else golesVisita++
        }
    }

    const nombreLocal = reserva.usuario?.nombre?.split(' ')[0] || 'Equipo'
    const iniciales = (nombre: string) => nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-black rounded-3xl p-5 lg:p-6 shadow-xl border border-white/5">
            {/* Glow decorativo */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600/20 rounded-full blur-3xl" />

            {/* Header: cancha + badge EN VIVO */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-2 text-gray-300">
                    <MapPin size={14} className="text-red-500" />
                    <span className="text-xs font-bold">{reserva.cancha}</span>
                    <span className="text-xs text-gray-500">· {sportEmoji(reserva.deporte)} {reserva.deporte}</span>
                </div>
                <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    En vivo
                </span>
            </div>

            {/* Marcador */}
            <div className="flex items-center justify-between relative z-10 mb-5">
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-black text-base lg:text-lg shadow-lg">
                        {iniciales(nombreLocal)}
                    </div>
                    <p className="text-xs font-bold text-gray-300 truncate max-w-[80px] text-center">{nombreLocal}</p>
                </div>

                <div className="flex items-center gap-3 px-3">
                    <span className="text-3xl lg:text-4xl font-black text-white tabular-nums">{golesLocal}</span>
                    <span className="text-gray-500 font-bold text-lg">-</span>
                    <span className="text-3xl lg:text-4xl font-black text-white tabular-nums">{golesVisita}</span>
                </div>

                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-black text-base lg:text-lg shadow-lg">
                        VS
                    </div>
                    <p className="text-xs font-bold text-gray-300 truncate max-w-[80px] text-center">Rival</p>
                </div>
            </div>

            {/* Cronómetro + barra de progreso */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-gray-300">
                        <Clock size={13} />
                        <span className="text-xs font-bold tabular-nums">
                            {String(Math.max(0, elapsedMin)).padStart(2, '0')}:{String(Math.max(0, elapsedSec)).padStart(2, '0')}
                        </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">{duracionMin} min totales</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-1000"
                        style={{ width: `${progreso}%` }}
                    />
                </div>
            </div>
        </div>
    )
}