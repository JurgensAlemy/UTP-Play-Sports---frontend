import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: number
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ showToast: () => { } })

export function useToast() {
    return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3500)
    }, [])

    const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

    const icons = {
        success: <CheckCircle size={18} className="text-green-500 flex-shrink-0" />,
        error: <AlertCircle size={18} className="text-red-500 flex-shrink-0" />,
        info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
    }

    const borders = {
        success: 'border-l-4 border-green-500',
        error: 'border-l-4 border-red-500',
        info: 'border-l-4 border-blue-500',
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg rounded-xl px-4 py-3 pointer-events-auto animate-in slide-in-from-top-2 ${borders[toast.type]}`}
                    >
                        {icons[toast.type]}
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1">{toast.message}</p>
                        <button onClick={() => remove(toast.id)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}