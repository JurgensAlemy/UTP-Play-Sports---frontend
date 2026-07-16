import { useState, useEffect, useRef, useCallback } from 'react'
import { PackageCheck, PackageX, Minus, Plus, Check, Sparkles, PackageOpen, Shield, Dumbbell } from 'lucide-react'
import { implementoService } from '../services/api'
import { useToast } from './Toast'

interface ImplementosPickerProps {
    deporte: string
    fecha: string
    horario: string
    onChange: (seleccion: { tipo: string; cantidad: number }[]) => void
}

const ICONOS: Record<string, string> = {
    RAQUETA: '🏸', CHALECO: '🦺', CONO: '🚧', SILBATO: '🔔',
    BOTIQUIN: '🩹', CRONOMETRO: '⏱️', RED: '🥅',
}
const NOMBRES: Record<string, string> = {
    RAQUETA: 'Raquetas', CHALECO: 'Chalecos', CONO: 'Conos',
    SILBATO: 'Silbato', BOTIQUIN: 'Botiquín', CRONOMETRO: 'Cronómetro', RED: 'Red / antenas',
}
const ES_STEPPER: Record<string, boolean> = {
    PELOTA: false, RAQUETA: true, CHALECO: true, CONO: true,
    SILBATO: false, BOTIQUIN: false, CRONOMETRO: false, RED: false,
}
const GENERALES = ['CHALECO', 'SILBATO', 'BOTIQUIN']

const nombrePelota = (deporte: string) => {
    switch (deporte) {
        case 'Fútbol': return 'Balón de fútbol'
        case 'Básquetbol': return 'Balón de básquet'
        case 'Vóley': return 'Balón de vóley'
        case 'Tenis': return 'Tubo de pelotas'
        default: return 'Balón'
    }
}
const iconoPelota = (deporte: string) => {
    switch (deporte) {
        case 'Fútbol': return '⚽'
        case 'Básquetbol': return '🏀'
        case 'Vóley': return '🏐'
        case 'Tenis': return '🎾'
        default: return '⚽'
    }
}

export const nombreImplemento = (tipo: string, deporte: string) =>
    tipo === 'PELOTA' ? nombrePelota(deporte) : (NOMBRES[tipo] || tipo)

export const iconoImplemento = (tipo: string, deporte: string) =>
    tipo === 'PELOTA' ? iconoPelota(deporte) : (ICONOS[tipo] || '🏷️')

export function ImplementosPicker({ deporte, fecha, horario, onChange }: ImplementosPickerProps) {
    const { showToast } = useToast()
    const [quierePrestar, setQuierePrestar] = useState(false)
    const [disponibilidad, setDisponibilidad] = useState<any[]>([])
    const [seleccion, setSeleccion] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(false)
    const [refrescando, setRefrescando] = useState(false)
    const yaAvisoRef = useRef(false)

    const cargar = useCallback(async (silencioso = false) => {
        silencioso ? setRefrescando(true) : setLoading(true)
        try {
            const data = await implementoService.getDisponibilidad(deporte, fecha, horario)
            const lista = Array.isArray(data) ? data : []
            setDisponibilidad(lista)

            setSeleccion(prev => {
                const actualizado = { ...prev }
                let huboAjuste = false
                lista.forEach((imp: any) => {
                    const actual = actualizado[imp.tipo] || 0
                    if (actual > imp.disponible) {
                        actualizado[imp.tipo] = Math.max(0, imp.disponible)
                        huboAjuste = true
                    }
                })
                if (huboAjuste && silencioso && !yaAvisoRef.current) {
                    yaAvisoRef.current = true
                    showToast('Alguien más tomó implementos, ajustamos tu selección', 'info')
                    setTimeout(() => { yaAvisoRef.current = false }, 4000)
                }
                return actualizado
            })
        } catch {
            setDisponibilidad([])
        } finally {
            setLoading(false)
            setRefrescando(false)
        }
    }, [deporte, fecha, horario, showToast])

    useEffect(() => {
        setSeleccion({})
        setQuierePrestar(false)
        cargar(false)
    }, [deporte, fecha, horario, cargar])

    useEffect(() => {
        if (!quierePrestar) return
        const t = setInterval(() => cargar(true), 6000)
        return () => clearInterval(t)
    }, [quierePrestar, cargar])

    useEffect(() => {
        const arr = Object.entries(seleccion).filter(([, c]) => c > 0).map(([tipo, cantidad]) => ({ tipo, cantidad }))
        onChange(arr)
    }, [seleccion, onChange])

    const setCantidad = (tipo: string, cantidad: number, max: number) => {
        setSeleccion(prev => ({ ...prev, [tipo]: Math.max(0, Math.min(cantidad, max)) }))
    }

    const totalSeleccionado = Object.values(seleccion).reduce((a, b) => a + b, 0)
    const todoSinStock = !loading && disponibilidad.length > 0 && disponibilidad.every((imp: any) => imp.disponible === 0)

    const generales = disponibilidad.filter((i: any) => GENERALES.includes(i.tipo))
    const especificos = disponibilidad.filter((i: any) => !GENERALES.includes(i.tipo))

    const Tarjeta = ({ imp }: { imp: any }) => {
        const cantidadActual = seleccion[imp.tipo] || 0
        const sinStock = imp.disponible === 0
        const pctOcupado = imp.stockTotal > 0 ? ((imp.stockTotal - imp.disponible) / imp.stockTotal) * 100 : 0
        const colorBarra = sinStock ? 'bg-red-400' : imp.disponible <= 1 ? 'bg-amber-400' : 'bg-green-500'
        const seleccionado = cantidadActual > 0

        return (
            <div
                className={`relative p-3 rounded-2xl border transition-all ${sinStock
                    ? 'border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/30'
                    : seleccionado
                        ? 'border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-900/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent'
                    }`}
            >
                <div className="flex items-center gap-2.5">
                    <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${sinStock ? 'bg-gray-100 dark:bg-gray-800 grayscale opacity-60' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                        {iconoImplemento(imp.tipo, imp.deporte)}
                        {seleccionado && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                                <Check size={9} className="text-white" strokeWidth={3} />
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white truncate leading-tight">{nombreImplemento(imp.tipo, imp.deporte)}</p>
                        <p className={`text-[10px] font-medium truncate ${sinStock ? 'text-red-500 dark:text-red-400' : 'text-gray-400'}`}>
                            {sinStock ? 'Sin stock' : `${imp.disponible}/${imp.stockTotal} disp.`}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-2.5">
                    <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${colorBarra}`} style={{ width: `${pctOcupado}%` }} />
                    </div>

                    {!ES_STEPPER[imp.tipo] ? (
                        <button
                            onClick={() => setCantidad(imp.tipo, cantidadActual > 0 ? 0 : 1, imp.disponible)}
                            disabled={sinStock}
                            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${seleccionado ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 active:scale-95'}`}
                        >
                            {seleccionado ? <Check size={12} /> : 'Agregar'}
                        </button>
                    ) : (
                        <div className="flex-shrink-0 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/70 rounded-lg p-0.5">
                            <button
                                onClick={() => setCantidad(imp.tipo, cantidadActual - 1, imp.disponible)}
                                disabled={cantidadActual === 0}
                                className="w-6 h-6 rounded-md bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 disabled:opacity-30 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                            >
                                <Minus size={11} />
                            </button>
                            <span className="w-4 text-center text-xs font-black text-gray-900 dark:text-white tabular-nums">{cantidadActual}</span>
                            <button
                                onClick={() => setCantidad(imp.tipo, cantidadActual + 1, imp.disponible)}
                                disabled={cantidadActual >= imp.disponible}
                                className="w-6 h-6 rounded-md bg-red-600 text-white disabled:opacity-30 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <Plus size={11} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2.5">Equipo para tu partido</p>

            {/* Toggle segmentado */}
            <div className="relative grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-800/70 rounded-2xl mb-4">
                <div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-900 rounded-xl shadow-sm transition-transform duration-300 ease-out"
                    style={{ transform: quierePrestar ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}
                />
                <button
                    onClick={() => setQuierePrestar(false)}
                    className={`relative z-10 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-colors ${!quierePrestar ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
                >
                    <PackageX size={14} /> Ya tengo mis cosas
                </button>
                <button
                    onClick={() => setQuierePrestar(true)}
                    className={`relative z-10 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] sm:text-xs font-bold transition-colors ${quierePrestar ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}
                >
                    <PackageCheck size={14} /> Quiero prestar equipo
                </button>
            </div>

            {quierePrestar && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${refrescando ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                        Disponibilidad en vivo
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-[74px] rounded-2xl bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
                            ))}
                        </div>
                    ) : disponibilidad.length === 0 ? (
                        <div className="flex flex-col items-center text-center gap-2 py-8 px-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                            <PackageOpen className="text-gray-300 dark:text-gray-600" size={28} />
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">No manejamos préstamo de implementos para {deporte}</p>
                        </div>
                    ) : (
                        <>
                            {todoSinStock && (
                                <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5">
                                    <span className="text-lg leading-none">😅</span>
                                    <div>
                                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Todo prestado para este horario</p>
                                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Puedes reservar igual y traer tu propio equipo, o prueba otro bloque.</p>
                                    </div>
                                </div>
                            )}

                            {especificos.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Dumbbell size={12} className="text-red-500" />
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Para {deporte}</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {especificos.map((imp: any) => <Tarjeta key={imp.id} imp={imp} />)}
                                    </div>
                                </div>
                            )}

                            {generales.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Shield size={12} className="text-blue-500" />
                                        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Seguridad y equipo general</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {generales.map((imp: any) => <Tarjeta key={imp.id} imp={imp} />)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {totalSeleccionado > 0 && (
                        <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-900/20 rounded-2xl p-3.5 border border-green-100 dark:border-green-800/60">
                            <Sparkles size={15} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div className="flex flex-wrap gap-1.5">
                                {Object.entries(seleccion).filter(([, c]) => c > 0).map(([tipo, c]) => {
                                    const imp = disponibilidad.find((d: any) => d.tipo === tipo)
                                    return (
                                        <span key={tipo} className="text-[11px] font-bold text-green-700 dark:text-green-400 bg-white dark:bg-gray-900 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                                            {iconoImplemento(tipo, imp?.deporte || deporte)} {nombreImplemento(tipo, imp?.deporte || deporte)}{ES_STEPPER[tipo] ? ` ×${c}` : ''}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}