import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { authService } from '../services/api'

interface LoginProps {
    onLogin: (user: any) => void
    onGoToRegister: () => void
}

interface FormErrors {
    studentId?: string
    password?: string
}

export function Login({ onLogin, onGoToRegister }: LoginProps) {
    const [studentId, setStudentId] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<FormErrors>({})
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)

    const validate = (): boolean => {
        const newErrors: FormErrors = {}
        if (!studentId) {
            newErrors.studentId = 'Ingresa tu ID de estudiante.'
        } else if (!/^U\d{7,9}$/i.test(studentId)) {
            newErrors.studentId = 'Formato inválido. Ejemplo: U20191234'
        }
        if (!password) {
            newErrors.password = 'Ingresa tu contraseña.'
        } else if (password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres.'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginFailed(false)
        if (!validate()) return
        setIsLoading(true)
        try {
            const data = await authService.login(studentId, password)
            if (data.success) {
                onLogin({
                    studentId: data.studentId,
                    name: data.nombre,
                    email: data.email,
                    faculty: data.facultad,
                    verified: data.verificado,
                })
            } else {
                setLoginFailed(true)
            }
        } catch {
            setLoginFailed(true)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (/^[Uu]?\d*$/.test(value) && value.length <= 10) {
            setStudentId(value)
            if (errors.studentId) setErrors(prev => ({ ...prev, studentId: undefined }))
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Hero superior */}
            <div className="bg-gradient-to-br from-red-600 to-black flex-shrink-0 pt-16 pb-12 px-6 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex rounded-xl overflow-hidden shadow-lg">
                        <div className="w-12 h-14 bg-red-600 border-r border-red-500 flex items-center justify-center">
                            <span className="text-white font-black text-xl">U</span>
                        </div>
                        <div className="w-12 h-14 bg-black flex items-center justify-center">
                            <span className="text-white font-black text-xl">T</span>
                        </div>
                        <div className="w-12 h-14 bg-red-600 border-l border-red-500 flex items-center justify-center">
                            <span className="text-white font-black text-xl">P</span>
                        </div>
                    </div>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tight">UTP Play</h1>
                <p className="text-red-200 text-sm mt-1">Gestión de Multicanchas Deportivas</p>
            </div>

            {/* Card del formulario */}
            <div className="flex-1 -mt-6 bg-gray-50 rounded-t-3xl px-6 pt-8 pb-8 max-w-md w-full mx-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Bienvenido</h2>
                <p className="text-sm text-gray-500 mb-6">Inicia sesión con tu cuenta UTP</p>

                {loginFailed && (
                    <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl">
                        <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                        <p className="text-sm text-red-700">ID o contraseña incorrectos.</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            ID de Estudiante
                        </label>
                        <input
                            type="text"
                            value={studentId}
                            onChange={handleStudentIdChange}
                            placeholder="U20191234"
                            className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors.studentId
                                    ? 'border-red-400 ring-2 ring-red-100'
                                    : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                }`}
                        />
                        {errors.studentId && (
                            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                                <AlertCircle size={11} /> {errors.studentId}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value)
                                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
                                }}
                                placeholder="Mínimo 8 caracteres"
                                className={`w-full px-4 py-3.5 pr-12 bg-white border rounded-xl text-sm outline-none transition-all ${errors.password
                                        ? 'border-red-400 ring-2 ring-red-100'
                                        : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600">
                                <AlertCircle size={11} /> {errors.password}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-red-600 to-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                </svg>
                                Verificando...
                            </>
                        ) : (
                            <>
                                Ingresar <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Ir a registro */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        ¿No tienes cuenta?{' '}
                        <button
                            onClick={onGoToRegister}
                            className="text-red-600 font-semibold hover:text-red-700"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>

                {/* Badge verificación */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    Solo estudiantes verificados de la UTP
                </div>
            </div>
        </div>
    )
}