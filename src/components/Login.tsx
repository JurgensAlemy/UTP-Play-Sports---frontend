import { useState } from 'react'
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { authService } from '../services/api'

interface LoginProps {
    onLogin: (user: any) => void
}

interface FormErrors {
    studentId?: string
    password?: string
}

export function Login({ onLogin }: LoginProps) {
    const [studentId, setStudentId] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState<FormErrors>({})
    const [isValidating, setIsValidating] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [loginFailed, setLoginFailed] = useState(false)
    const [showRegister, setShowRegister] = useState(false)
    const [regData, setRegData] = useState({ nombre: '', email: '', facultad: '' })
    const [regError, setRegError] = useState('')
    const [regSuccess, setRegSuccess] = useState('')

    const handleRegister = async () => {
        setRegError('')
        setRegSuccess('')
        if (!regData.nombre || !regData.email || !regData.facultad) {
            setRegError('Completa todos los campos.')
            return
        }
        if (!regData.email.endsWith('@utp.edu.pe')) {
            setRegError('El correo debe ser @utp.edu.pe')
            return
        }
        if (!studentId || !/^U\d{7,9}$/i.test(studentId)) {
            setRegError('Primero ingresa un ID válido (ej: U20191234)')
            return
        }
        if (password.length < 8) {
            setRegError('La contraseña debe tener al menos 8 caracteres.')
            return
        }
        try {
            const data = await authService.register({
                studentId,
                nombre: regData.nombre,
                email: regData.email,
                password,
                facultad: regData.facultad,
            })
            if (data.success) {
                setRegSuccess('¡Cuenta creada! Ya puedes iniciar sesión.')
                setShowRegister(false)
            } else {
                setRegError(data.message)
            }
        } catch {
            setRegError('Error de conexión con el servidor.')
        }
    }

    const validate = (): boolean => {
        const newErrors: FormErrors = {}
        if (!studentId) {
            newErrors.studentId = 'El ID de estudiante es obligatorio.'
        } else if (!studentId.toUpperCase().startsWith('U')) {
            newErrors.studentId = 'El ID debe comenzar con la letra "U".'
        } else if (!/^U\d{7,9}$/i.test(studentId)) {
            newErrors.studentId = 'Formato inválido. Ejemplo correcto: U20191234'
        }
        if (!password) {
            newErrors.password = 'La contraseña es obligatoria.'
        } else if (password.length < 8) {
            newErrors.password = 'La contraseña debe tener al menos 8 caracteres.'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoginFailed(false)
        if (!validate()) return
        setIsValidating(true)
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
                setIsValidating(false)
            }
        } catch {
            setLoginFailed(true)
            setIsValidating(false)
        }
    }

    const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (/^[Uu]?\d*$/.test(value) && value.length <= 10) {
            setStudentId(value)
            if (errors.studentId) setErrors(prev => ({ ...prev, studentId: undefined }))
        }
    }

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl p-8">

                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex mb-4">
                            <div className="w-16 h-20 bg-red-600 flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">U</span>
                            </div>
                            <div className="w-16 h-20 bg-black flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">T</span>
                            </div>
                            <div className="w-16 h-20 bg-red-600 flex items-center justify-center">
                                <span className="text-white font-bold text-2xl">P</span>
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">UTP Play</h1>
                        <p className="text-gray-600">Gestión de Multicanchas Deportivas</p>
                    </div>

                    {/* Error login */}
                    {loginFailed && (
                        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-300 rounded-lg">
                            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                            <p className="text-sm text-red-700 font-medium">
                                Credenciales incorrectas. Verifica tu ID y contraseña.
                            </p>
                        </div>
                    )}

                    {/* Formulario login */}
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">ID de Estudiante</label>
                            <input
                                type="text"
                                value={studentId}
                                onChange={handleStudentIdChange}
                                placeholder="U20191234"
                                className={`w-full px-4 py-3 border rounded-lg outline-none transition-colors ${errors.studentId
                                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                                        : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                    }`}
                            />
                            {errors.studentId && (
                                <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                    <AlertCircle size={12} /> {errors.studentId}
                                </p>
                            )}
                            <p className="mt-1 text-xs text-gray-400">Formato: U seguido de 7 a 9 dígitos</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    placeholder="Mínimo 8 caracteres"
                                    className={`w-full px-4 py-3 pr-12 border rounded-lg outline-none transition-colors ${errors.password
                                            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
                                            : 'border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="flex items-center gap-1 mt-1 text-xs text-red-600">
                                    <AlertCircle size={12} /> {errors.password}
                                </p>
                            )}
                            {password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${password.length >= i * 3
                                                        ? password.length >= 12 ? 'bg-green-500'
                                                            : password.length >= 8 ? 'bg-yellow-500'
                                                                : 'bg-red-400'
                                                        : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs mt-1 text-gray-500">
                                        {password.length < 8 ? 'Muy corta' : password.length < 12 ? 'Aceptable' : 'Segura'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isValidating}
                            className="w-full bg-gradient-to-r from-red-600 to-black text-white font-semibold py-3 rounded-lg hover:from-red-700 hover:to-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isValidating ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Validando...
                                </span>
                            ) : 'Iniciar Sesión'}
                        </button>
                    </form>

                    {/* Sección registro — dentro del card */}
                    {!showRegister ? (
                        <p className="text-center text-sm text-gray-500 mt-4">
                            ¿No tienes cuenta?{' '}
                            <button
                                type="button"
                                onClick={() => setShowRegister(true)}
                                className="text-red-600 hover:text-red-700 font-medium"
                            >
                                Regístrate aquí
                            </button>
                        </p>
                    ) : (
                        <div className="mt-6 p-4 border border-gray-200 rounded-xl space-y-3 bg-gray-50">
                            <h3 className="font-bold text-gray-800">Crear cuenta</h3>
                            <p className="text-xs text-gray-500">Usa el ID y contraseña que escribiste arriba</p>
                            <input
                                type="text"
                                placeholder="Nombre completo"
                                value={regData.nombre}
                                onChange={e => setRegData({ ...regData, nombre: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            />
                            <input
                                type="email"
                                placeholder="Correo (@utp.edu.pe)"
                                value={regData.email}
                                onChange={e => setRegData({ ...regData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            />
                            <input
                                type="text"
                                placeholder="Facultad"
                                value={regData.facultad}
                                onChange={e => setRegData({ ...regData, facultad: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
                            />
                            {regError && (
                                <p className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle size={12} /> {regError}
                                </p>
                            )}
                            {regSuccess && (
                                <p className="flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle size={12} /> {regSuccess}
                                </p>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowRegister(false); setRegError(''); setRegSuccess('') }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegister}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
                                >
                                    Registrarme
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Validación estudiantil */}
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                            <CheckCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-red-800">
                                <p className="font-semibold mb-1">Validación Estudiantil</p>
                                <p className="text-red-700">Solo estudiantes verificados de la UTP pueden acceder.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}