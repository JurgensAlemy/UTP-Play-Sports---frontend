import { useState } from 'react'
import { User, Mail, GraduationCap, Trophy, Calendar, Star, Edit, Save, X } from 'lucide-react'

interface ProfileProps {
    user: any
}

export function Profile({ user }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        faculty: user?.faculty || '',
        favoriteSport: 'Fútbol',
        skillLevel: 'Intermedio',
    })

    const stats = [
        { label: 'Partidos Jugados', value: 24, icon: Trophy },
        { label: 'Horas Totales', value: 48, icon: Calendar },
        { label: 'Calificación', value: 4.5, icon: Star },
    ]

    const recentActivity = [
        { id: 1, title: 'Reserva confirmada', description: 'Cancha 1 - Fútbol', date: '2026-06-10', time: '18:00' },
        { id: 2, title: 'Nuevo match', description: 'Conectado con Carlos M.', date: '2026-06-09', time: '16:30' },
        { id: 3, title: 'Partido completado', description: 'Básquetbol - Victoria', date: '2026-06-08', time: '17:00' },
    ]

    const achievements = [
        { id: 1, name: 'Primer Partido', description: 'Jugaste tu primer partido', icon: '🎯', unlocked: true },
        { id: 2, name: 'Jugador Regular', description: '10 partidos completados', icon: '⚽', unlocked: true },
        { id: 3, name: 'Estrella Social', description: 'Conectado con 10+ jugadores', icon: '⭐', unlocked: true },
        { id: 4, name: 'Madrugador', description: 'Reserva a las 6 AM', icon: '🌅', unlocked: false },
        { id: 5, name: 'Noctámbulo', description: 'Reserva después de las 9 PM', icon: '🌙', unlocked: false },
        { id: 6, name: 'Todoterreno', description: 'Juega 5 deportes diferentes', icon: '🏆', unlocked: false },
    ]

    const handleSave = () => setIsEditing(false)

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            faculty: user?.faculty || '',
            favoriteSport: 'Fútbol',
            skillLevel: 'Intermedio',
        })
        setIsEditing(false)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Mi Perfil</h1>
                <p className="text-gray-600">Gestiona tu información y revisa tu actividad</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">

                    {/* Información Personal */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Información Personal</h2>
                            {!isEditing ? (
                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Edit size={18} />
                                    <span className="font-medium">Editar</span>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                        <X size={18} />
                                        <span className="font-medium">Cancelar</span>
                                    </button>
                                    <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                        <Save size={18} />
                                        <span className="font-medium">Guardar</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold text-3xl">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-800">{user?.name}</h3>
                                    <p className="text-gray-600">{user?.studentId}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm text-green-600 font-medium">Verificado</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <User size={16} /> Nombre Completo
                                    </label>
                                    {isEditing ? (
                                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                                    ) : <p className="text-gray-800">{formData.name}</p>}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Mail size={16} /> Correo Electrónico
                                    </label>
                                    {isEditing ? (
                                        <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                                    ) : <p className="text-gray-800">{formData.email}</p>}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <GraduationCap size={16} /> Facultad
                                    </label>
                                    {isEditing ? (
                                        <input type="text" value={formData.faculty} onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
                                    ) : <p className="text-gray-800">{formData.faculty}</p>}
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Trophy size={16} /> Deporte Favorito
                                    </label>
                                    {isEditing ? (
                                        <select value={formData.favoriteSport} onChange={(e) => setFormData({ ...formData, favoriteSport: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                            {['Fútbol', 'Básquetbol', 'Vóley', 'Tenis'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                    ) : <p className="text-gray-800">{formData.favoriteSport}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Star size={16} /> Nivel de Habilidad
                                    </label>
                                    {isEditing ? (
                                        <select value={formData.skillLevel} onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                            {['Principiante', 'Intermedio', 'Avanzado'].map(l => <option key={l}>{l}</option>)}
                                        </select>
                                    ) : <p className="text-gray-800">{formData.skillLevel}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actividad Reciente */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Actividad Reciente</h2>
                        <div className="space-y-3">
                            {recentActivity.map(activity => (
                                <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar className="text-red-600" size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{activity.title}</h3>
                                        <p className="text-sm text-gray-600">{activity.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(activity.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} • {activity.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Estadísticas */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Estadísticas</h2>
                        <div className="space-y-4">
                            {stats.map(stat => {
                                const Icon = stat.icon
                                return (
                                    <div key={stat.label} className="p-4 bg-gradient-to-br from-red-50 to-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                                <Icon className="text-red-600" size={18} />
                                            </div>
                                            <span className="text-sm text-gray-600">{stat.label}</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Logros */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Logros</h2>
                        <div className="space-y-3">
                            {achievements.map(achievement => (
                                <div key={achievement.id} className={`p-3 rounded-lg border ${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{achievement.icon}</span>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800 text-sm">{achievement.name}</h3>
                                            <p className="text-xs text-gray-600">{achievement.description}</p>
                                        </div>
                                        {achievement.unlocked && (
                                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                                <span className="text-white text-xs">✓</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}