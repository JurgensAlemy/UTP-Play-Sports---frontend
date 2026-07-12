import { useEffect, useState } from 'react'

interface SplashScreenProps {
    onDone: () => void
}

export function SplashScreen({ onDone }: SplashScreenProps) {
    const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in')

    useEffect(() => {
        const t1 = setTimeout(() => setPhase('hold'), 600)
        const t2 = setTimeout(() => setPhase('out'), 1800)
        const t3 = setTimeout(() => onDone(), 2300)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [])

    return (
        <div className={`fixed inset-0 z-[200] bg-gradient-to-br from-red-600 to-black flex flex-col items-center justify-center transition-opacity duration-500 ${phase === 'out' ? 'opacity-0' : 'opacity-100'
            }`}>
            <div className={`flex flex-col items-center gap-4 transition-transform duration-500 ${phase === 'in' ? 'scale-75 opacity-0' : 'scale-100 opacity-100'
                }`}>
                <img src="/utp-play.png" alt="UTP Play" className="w-72 sm:w-80 object-contain" style={{ filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))' }} />
                <div className="text-center">
                    <p className="text-red-200 text-sm mt-1">Gestión de Multicanchas Deportivas</p>
                </div>
                <div className="flex gap-1.5 mt-4">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 200}ms` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}