import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import { authService } from '../services/api'

interface RegisterProps {
    onGoToLogin: () => void
    onRegistered: () => void
}

export function Register({ onGoToLogin, onRegistered }: RegisterProps) {
    const [step, setStep] = useState<1 | 2>(1)
    const [formData, setFormData] = useState({
        studentId: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        email: '',
        facultad: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [apiError, setApiError] = useState('')
    const [success, setSuccess] = useState(false)

    const passwordStrength = (pwd: string) => {
        if (pwd.length === 0) return 0
        if (pwd.length < 8) return 1
        if (pwd.length < 12) return 2
        return 3
    }

    const strengthColor = ['bg-gray-200', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']
    const strengthLabel = ['', 'Muy corta', 'Aceptable', 'Segura']
    const strength = passwordStrength(formData.password)

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {}
        if (!/^U\d{7,9}$/i.test(formData.studentId)) {
            newErrors.studentId = 'Formato inválido. Ejemplo: U20191234'
        }
        if (formData.password.length < 8) {
            newErrors.password = 'Mínimo 8 caracteres.'
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Las contraseñas no coinciden.'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.nombre.trim()) newErrors.nombre = 'Ingresa tu nombre completo.'
        if (!formData.email.endsWith('@utp.edu.pe')) newErrors.email = 'Debe ser un correo @utp.edu.pe'
        if (!formData.facultad.trim()) newErrors.facultad = 'Ingresa tu facultad.'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep1()) setStep(2)
    }

    const handleSubmit = async () => {
        if (!validateStep2()) return
        setIsLoading(true)
        setApiError('')
        try {
            const res = await authService.register({
                studentId: formData.studentId,
                nombre: formData.nombre,
                email: formData.email,
                password: formData.password,
                facultad: formData.facultad,
            })
            if (res.success) {
                setSuccess(true)
                setTimeout(() => onRegistered(), 2000)
            } else {
                setApiError(res.message || 'Error al registrar.')
            }
        } catch {
            setApiError('Error de conexión con el servidor.')
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
                <div className="text-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-500" size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">¡Cuenta creada!</h2>
                    <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-br from-red-600 to-black flex-shrink-0 pt-14 pb-10 px-6">
                <button
                    onClick={step === 1 ? onGoToLogin : () => setStep(1)}
                    className="flex items-center gap-1.5 text-red-200 text-sm mb-6 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={16} /> {step === 1 ? 'Ya tengo cuenta' : 'Atrás'}
                </button>
                <h1 className="text-2xl font-black text-white">Crear cuenta</h1>
                <p className="text-red-200 text-sm mt-1">
                    {step === 1 ? 'Paso 1 de 2 — Credenciales' : 'Paso 2 de 2 — Datos personales'}
                </p>

                {/* Barra de progreso */}
                <div className="flex gap-2 mt-4">
                    <div className="h-1 flex-1 rounded-full bg-white"></div>
                    <div className={`h-1 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-white' : 'bg-white/30'}`}></div>
                </div>
            </div>

            <div className="flex-1 -mt-6 bg-gray-50 rounded-t-3xl px-6 pt-8 pb-8 max-w-md w-full mx-auto">
                {/* PASO 1: Credenciales */}
                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">ID de Estudiante</label>
                            <input
                                type="text"
                                value={formData.studentId}
                                onChange={e => {
                                    const val = e.target.value
                                    if (/^[Uu]?\d*$/.test(val) && val.length <= 10) {
                                        setFormData({ ...formData, studentId: val })
                                        if (errors.studentId) setErrors(prev => ({ ...prev, studentId: '' }))
                                    }
                                }}
                                placeholder="U20191234"
                                className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors.studentId ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                            />
                            {errors.studentId && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.studentId}</p>}
                            <p className="mt-1.5 text-[11px] text-gray-400">Formato: U seguido de 7 a 9 dígitos</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({ ...formData, password: e.target.value })
                                        if (errors.password) setErrors(prev => ({ ...prev, password: '' }))
                                    }}
                                    placeholder="Mínimo 8 caracteres"
                                    className={`w-full px-4 py-3.5 pr-12 bg-white border rounded-xl text-sm outline-none transition-all ${errors.password ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                        }`}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formData.password.length > 0 && (
                                <div className="mt-2">
                                    <div className="flex gap-1 mb-1">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${strength >= i ? strengthColor[strength] : 'bg-gray-200'}`} />
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-gray-400">{strengthLabel[strength]}</p>
                                </div>
                            )}
                            {errors.password && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirmar contraseña</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={e => {
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                        if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }))
                                    }}
                                    placeholder="Repite tu contraseña"
                                    className={`w-full px-4 py-3.5 pr-12 bg-white border rounded-xl text-sm outline-none transition-all ${errors.confirmPassword ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                        }`}
                                />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.confirmPassword}</p>}
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full bg-gradient-to-r from-red-600 to-black text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-all mt-2"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* PASO 2: Datos personales */}
                {step === 2 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nombre completo</label>
                            <input
                                type="text"
                                value={formData.nombre}
                                onChange={e => {
                                    setFormData({ ...formData, nombre: e.target.value })
                                    if (errors.nombre) setErrors(prev => ({ ...prev, nombre: '' }))
                                }}
                                placeholder="Ej: Carlos Mendoza"
                                className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors.nombre ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                            />
                            {errors.nombre && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.nombre}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Correo institucional</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => {
                                    setFormData({ ...formData, email: e.target.value })
                                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }))
                                }}
                                placeholder="u20191234@utp.edu.pe"
                                className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors.email ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                            />
                            {errors.email && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Facultad</label>
                            <select
                                value={formData.facultad}
                                onChange={e => {
                                    setFormData({ ...formData, facultad: e.target.value })
                                    if (errors.facultad) setErrors(prev => ({ ...prev, facultad: '' }))
                                }}
                                className={`w-full px-4 py-3.5 bg-white border rounded-xl text-sm outline-none transition-all ${errors.facultad ? 'border-red-400 ring-2 ring-red-100' : 'border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                                    }`}
                            >
                                <option value="">Selecciona tu facultad</option>
                                {[
                                    'Ingeniería de Sistemas',
                                    'Ingeniería Industrial',
                                    'Ingeniería Civil',
                                    'Administración de Empresas',
                                    'Contabilidad',
                                    'Derecho',
                                    'Psicología',
                                    'Arquitectura',
                                    'Diseño Gráfico',
                                    'Medicina Humana',
                                    'Otra',
                                ].map(f => <option key={f}>{f}</option>)}
                            </select>
                            {errors.facultad && <p className="flex items-center gap-1 mt-1.5 text-xs text-red-600"><AlertCircle size={11} /> {errors.facultad}</p>}
                        </div>

                        {apiError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle className="text-red-500 flex-shrink-0" size={16} />
                                <p className="text-sm text-red-700">{apiError}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-red-600 to-black text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 mt-2"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                    Creando cuenta...
                                </span>
                            ) : 'Crear cuenta'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}