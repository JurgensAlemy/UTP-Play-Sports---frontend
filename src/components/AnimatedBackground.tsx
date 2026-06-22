export function AnimatedBackground() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-50 dark:bg-[#0f0f0f] transition-colors duration-700">
            {/* Esfera superior izquierda */}
            <div
                className="absolute top-[-15%] left-[-15%] w-[55%] h-[55%] rounded-full bg-red-300/60 dark:bg-red-600/25 blur-[90px] animate-pulse"
                style={{ animationDuration: '8s' }}
            />
            {/* Esfera inferior derecha */}
            <div
                className="absolute bottom-[-15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-red-200/50 dark:bg-red-800/25 blur-[100px] animate-pulse"
                style={{ animationDuration: '12s' }}
            />
            {/* Esfera central, sutil, para rellenar el medio */}
            <div
                className="absolute top-[35%] left-[40%] w-[40%] h-[40%] rounded-full bg-gray-300/40 dark:bg-gray-600/15 blur-[110px] animate-pulse"
                style={{ animationDuration: '10s' }}
            />
            {/* Acento extra arriba a la derecha */}
            <div
                className="absolute top-[-10%] right-[10%] w-[35%] h-[35%] rounded-full bg-black/10 dark:bg-red-500/15 blur-[80px] animate-pulse"
                style={{ animationDuration: '14s' }}
            />
        </div>
    )
}