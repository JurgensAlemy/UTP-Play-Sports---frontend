const API_URL = 'http://localhost:8080/api'

export const authService = {
    async login(studentId: string, password: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, password }),
        })
        return res.json()
    },

    async register(data: {
        studentId: string
        nombre: string
        email: string
        password: string
        facultad: string
    }) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    },
}

export const reservaService = {
    async getReservasByUsuario(studentId: string) {
        const res = await fetch(`${API_URL}/reservas/usuario/${studentId}`)
        return res.json()
    },

    async getReservasByFecha(fecha: string) {
        const res = await fetch(`${API_URL}/reservas/fecha/${fecha}`)
        return res.json()
    },

    async crearReserva(data: {
        studentId: string
        cancha: string
        deporte: string
        fecha: string
        horario: string
        capacidad: number
    }) {
        const res = await fetch(`${API_URL}/reservas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    },

    async cancelarReserva(id: number, studentId: string) {
        const res = await fetch(`${API_URL}/reservas/${id}/usuario/${studentId}`, {
            method: 'DELETE',
        })
        return res.text()
    },
}

export const usuarioService = {
    async getPerfil(studentId: string) {
        const res = await fetch(`${API_URL}/usuarios/${studentId}`)
        return res.json()
    },

    async actualizarPerfil(studentId: string, datos: {
        nombre?: string
        facultad?: string
        deporteFavorito?: string
        nivelHabilidad?: string
    }) {
        const res = await fetch(`${API_URL}/usuarios/${studentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos),
        })
        return res.json()
    },
}