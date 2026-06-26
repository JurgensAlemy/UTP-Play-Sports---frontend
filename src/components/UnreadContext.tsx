import { createContext, useContext, useState, useCallback } from 'react'

interface UnreadContextType {
    totalUnread: number
    setUnreadForChat: (conexionId: number, count: number) => void
    clearUnreadForChat: (conexionId: number) => void
}

const UnreadContext = createContext<UnreadContextType>({
    totalUnread: 0,
    setUnreadForChat: () => { },
    clearUnreadForChat: () => { },
})

export function useUnread() {
    return useContext(UnreadContext)
}

export function UnreadProvider({ children }: { children: React.ReactNode }) {
    const [unreadMap, setUnreadMap] = useState<Record<number, number>>({})

    const setUnreadForChat = useCallback((conexionId: number, count: number) => {
        setUnreadMap(prev => ({ ...prev, [conexionId]: count }))
    }, [])

    const clearUnreadForChat = useCallback((conexionId: number) => {
        setUnreadMap(prev => ({ ...prev, [conexionId]: 0 }))
    }, [])

    const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0)

    return (
        <UnreadContext.Provider value={{ totalUnread, setUnreadForChat, clearUnreadForChat }}>
            {children}
        </UnreadContext.Provider>
    )
}