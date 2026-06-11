import { useState } from 'react'
import { Users, Trophy, Star, Clock, Filter, Search, UserPlus } from 'lucide-react'

interface MatchmakingProps {
    user: any
}

export function Matchmaking({ user }: MatchmakingProps) {
    const [selectedSport, setSelectedSport] = useState('all')
    const [selectedLevel, setSelectedLevel] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showCreateRequest, setShowCreateRequest] = useState(false)
    const [connectedPlayers, setConnectedPlayers] = useState<number[]>([])

    const sports = ['Todos', 'Fútbol', 'Básquetbol', 'Vóley', 'Tenis']
    const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado']

    const mockPlayers = [
        { id: 1, name: 'Carlos Mendoza', studentId: 'U201912345', sport: 'Fútbol', level: 'Intermedio', rating: 4.5, gamesPlayed: 45, availability: 'Tardes', lookingFor: 'Equipo para partido amistoso', time: 'Hace 1 hora' },
        { id: 2, name: 'Ana García', studentId: 'U202013456', sport: 'Básquetbol', level: 'Avanzado', rating: 4.8, gamesPlayed: 62, availability: 'Mañanas', lookingFor: 'Compañeros para práctica regular', time: 'Hace 3 horas' },
        { id: 3, name: 'Luis Torres', studentId: 'U201823456', sport: 'Vóley', level: 'Intermedio', rating: 4.2, gamesPlayed: 38, availability: 'Tardes/Noches', lookingFor: 'Equipo completo para torneo', time: 'Hace 5 horas' },
        { id: 4, name: 'María Rodríguez', studentId: 'U202114567', sport: 'Tenis', level: 'Principiante', rating: 3.9, gamesPlayed: 12, availability: 'Fines de semana', lookingFor: 'Compañero/a para mejorar técnica', time: 'Hace 8 horas' },
        { id: 5, name: 'Diego Fernández', studentId: 'U201915678', sport: 'Fútbol', level: 'Avanzado', rating: 4.7, gamesPlayed: 78, availability: 'Noches', lookingFor: 'Jugadores para partido competitivo', time: 'Hace 12 horas' },
        { id: 6, name: 'Sofia Paredes', studentId: 'U202016789', sport: 'Básquetbol', level: 'Intermedio', rating: 4.3, gamesPlayed: 29, availability: 'Tardes', lookingFor: 'Equipo femenino para práctica', time: 'Hace 1 día' },
    ]

    const filteredPlayers = mockPlayers.filter(player => {
        const matchesSport = selectedSport === 'all' || player.sport.toLowerCase() === selectedSport.toLowerCase()
        const matchesLevel = selectedLevel === 'all' || player.level.toLowerCase() === selectedLevel.toLowerCase()
        const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.lookingFor.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSport && matchesLevel && matchesSearch
    })

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'Principiante': return 'bg-gray-100 text-gray-700'
            case 'Intermedio': return 'bg-red-100 text-red-700'
            case 'Avanzado': return 'bg-black text-white'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const handleConnect = (playerId: number) => {
        setConnectedPlayers(prev =>
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Matchmaking Deportivo</h1>
                    <p className="text-gray-600">Encuentra compañeros y forma equipos</p>
                </div>
                <button
                    onClick={() => setShowCreateRequest(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-black text-white font-semibold rounded-lg hover:from-red-700 hover:to-gray-900 transition-all"
                >
                    <UserPlus size={20} />
                    <span>Crear Solicitud</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o descripción..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-500" size={20} />
                            <select
                                value={selectedSport}
                                onChange={(e) => setSelectedSport(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                            >
                                {sports.map(sport => (
                                    <option key={sport} value={sport === 'Todos' ? 'all' : sport}>{sport}</option>
                                ))}
                            </select>
                        </div>
                        <select
                            value={selectedLevel}
                            onChange={(e) => setSelectedLevel(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                        >
                            {levels.map(level => (
                                <option key={level} value={level === 'Todos' ? 'all' : level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPlayers.map(player => (
                        <div key={player.id} className="p-5 border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                        {player.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{player.name}</h3>
                                        <p className="text-sm text-gray-500">{player.studentId}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(player.level)}`}>
                                    {player.level}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Trophy className="text-red-600" size={16} />
                                    <span className="text-gray-700 font-medium">{player.sport}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Star className="text-yellow-500 fill-yellow-500" size={16} />
                                    <span>{player.rating} • {player.gamesPlayed} partidos</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="text-gray-500" size={16} />
                                    <span>{player.availability}</span>
                                </div>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-lg mb-4">
                                <p className="text-sm text-gray-700">{player.lookingFor}</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">{player.time}</span>
                                <button
                                    onClick={() => handleConnect(player.id)}
                                    className={`px-4 py-2 font-medium rounded-lg transition-colors text-sm ${connectedPlayers.includes(player.id)
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                >
                                    {connectedPlayers.includes(player.id) ? '✓ Conectado' : 'Conectar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredPlayers.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto text-gray-300 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron jugadores</h3>
                        <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                )}
            </div>

            {showCreateRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Crear Solicitud de Matchmaking</h3>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Deporte</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                    {['Fútbol', 'Básquetbol', 'Vóley', 'Tenis'].map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nivel</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                    {['Principiante', 'Intermedio', 'Avanzado'].map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                                    {['Mañanas', 'Tardes', 'Noches', 'Fines de semana'].map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué buscas?</label>
                                <textarea
                                    placeholder="Describe qué tipo de compañeros estás buscando..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowCreateRequest(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button onClick={() => setShowCreateRequest(false)} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-black text-white font-semibold rounded-lg hover:from-red-700 hover:to-gray-900">
                                Publicar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}