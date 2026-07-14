import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { notificacionService } from '../services/api'

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
    const [nuevasPublicaciones, setNuevasPublicaciones] = useState<any[]>([])

    const cargar = useCallback(async () => {
        try {
            const data = await notificacionService.getNuevas(studentId)
            setNuevasPublicaciones(Array.isArray(data) ? data : [])
        } catch { }
    }, [studentId])

    useEffect(() => {
        cargar()
        const t = setInterval(cargar, 20000)
        return () => clearInterval(t)
    }, [cargar])

    const marcarVistas = useCallback(async () => {
        setNuevasPublicaciones([]) // optimista, se siente instantáneo en la UI
        try {
            await notificacionService.marcarVistas(studentId)
        } catch { }
    }, [studentId])

    return (
        <NotificationContext.Provider value={{ nuevasPublicaciones, unseenCount: nuevasPublicaciones.length, marcarVistas }}>
            {children}
        </NotificationContext.Provider>
    )
}