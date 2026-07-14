import { useState, useEffect } from 'react'
import { CloudRain, Sun, Cloud, CloudSnow, CloudLightning, CloudFog, Droplets } from 'lucide-react'

// Coordenadas aproximadas de Lima — ajusta si tu campus tiene otra ubicación
const LAT = -12.0464
const LON = -77.0428

interface WeatherWidgetProps {
    proximaReserva?: { fecha: string; horario: string } | null
}

const weatherInfo = (code: number) => {
    if (code === 0) return { label: 'Despejado', Icon: Sun, color: 'text-yellow-500' }
    if ([1, 2].includes(code)) return { label: 'Parcialmente nublado', Icon: Cloud, color: 'text-gray-400' }
    if (code === 3) return { label: 'Nublado', Icon: Cloud, color: 'text-gray-500' }
    if ([45, 48].includes(code)) return { label: 'Neblina', Icon: CloudFog, color: 'text-gray-400' }
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
        return { label: 'Lluvia', Icon: CloudRain, color: 'text-blue-500' }
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Nieve', Icon: CloudSnow, color: 'text-blue-300' }
    if ([95, 96, 99].includes(code)) return { label: 'Tormenta', Icon: CloudLightning, color: 'text-purple-500' }
    return { label: 'Templado', Icon: Cloud, color: 'text-gray-400' }
}

export function WeatherWidget({ proximaReserva }: WeatherWidgetProps) {
    const [clima, setClima] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&hourly=precipitation_probability&timezone=America%2FLima`
        fetch(url)
            .then(res => res.json())
            .then(setClima)
            .catch(() => setClima(null))
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 shadow-sm flex items-center justify-center min-h-[140px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
            </div>
        )
    }

    if (!clima?.current) return null

    const { label, Icon, color } = weatherInfo(clima.current.weather_code)
    const temp = Math.round(clima.current.temperature_2m)

    // Si tienes una reserva HOY, revisa probabilidad de lluvia a esa hora exacta
    let alerta: string | null = null
    if (proximaReserva && clima.hourly?.time) {
        const hoy = new Date().toISOString().slice(0, 10)
        if (proximaReserva.fecha === hoy) {
            const horaInicio = proximaReserva.horario.split('-')[0].trim()
            const idx = clima.hourly.time.findIndex((t: string) => t === `${hoy}T${horaInicio}`)
            if (idx >= 0) {
                const prob = clima.hourly.precipitation_probability[idx]
                if (prob >= 50) alerta = `${prob}% de probabilidad de lluvia a la hora de tu partido`
            }
        }
    }

    return (
        <div className="bg-white/70 dark:bg-[#1a1a1a]/70 backdrop-blur-xl border border-white/50 dark:border-white/5 rounded-3xl p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">Clima ahora</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white">{temp}°C</p>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                </div>
                <Icon className={color} size={40} />
            </div>
            {alerta && (
                <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
                    <Droplets className="text-blue-500 flex-shrink-0 mt-0.5" size={14} />
                    <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">{alerta}</p>
                </div>
            )}
        </div>
    )
}