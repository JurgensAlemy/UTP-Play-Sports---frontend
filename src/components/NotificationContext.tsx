import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { matchmakingService } from '../services/api'

interface NotificationContextType {
    nuevasPublicaciones: any[]
    unseenCount: number
    marcarVistas: () => void
}

const NotificationContext = createContext<NotificationContextType>({
    nuevasPublicaciones: [],
    unseenCount: 0,
    marcarVistas: () => { },
})

export function useNotifications() {
    return useContext(NotificationContext)
}

export function NotificationProvider({ studentId, children }: { studentId: string; children: React.ReactNode }) {
    const [solicitudes, setSolicitudes] = useState<any[]>([])
    const [vistos, setVistos] = useState<Set<number>>(() => {
        try {
            const raw = localStorage.getItem(`match_vistos_${studentId}`)
            return raw ? new Set(JSON.parse(raw)) : new Set()
        } catch { return new Set() }
    })
    const primeraCarga = useRef(true)

    const cargar = useCallback(async () => {
        try {
            const data = await matchmakingService.getSolicitudesActivas()
            const lista = Array.isArray(data)
                ? data.filter((s: any) => s.usuario?.studentId?.toUpperCase() !== studentId.toUpperCase())
                : []
            setSolicitudes(lista)

            // En la primerísima carga (usuario nunca antes registrado en este navegador),
            // marcamos como "ya vistas" todas las que ya existían — para no bombardearlo
            // con publicaciones viejas apenas entra por primera vez.
            if (primeraCarga.current) {
                primeraCarga.current = false
                setVistos(prev => {
                    if (prev.size > 0) return prev
                    const iniciales = new Set<number>(lista.map((s: any) => s.id))
                    localStorage.setItem(`match_vistos_${studentId}`, JSON.stringify([...iniciales]))
                    return iniciales
                })
            }
        } catch { }
    }, [studentId])

    useEffect(() => {
        cargar()
        const t = setInterval(cargar, 20000)
        return () => clearInterval(t)
    }, [cargar])

    const nuevasPublicaciones = solicitudes.filter(s => !vistos.has(s.id))

    const marcarVistas = useCallback(() => {
        setVistos(prev => {
            const actualizado = new Set(prev)
            solicitudes.forEach(s => actualizado.add(s.id))
            localStorage.setItem(`match_vistos_${studentId}`, JSON.stringify([...actualizado]))
            return actualizado
        })
    }, [solicitudes, studentId])

    return (
        <NotificationContext.Provider value={{ nuevasPublicaciones, unseenCount: nuevasPublicaciones.length, marcarVistas }}>
            {children}
        </NotificationContext.Provider>
    )
}