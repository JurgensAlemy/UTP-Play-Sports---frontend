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
        implementos?: { tipo: string; cantidad: number }[]
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

    async eliminarReserva(reservaId: number, studentId: string) {
        const res = await fetch(`${API_URL}/reservas/${reservaId}?studentId=${studentId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        if (!res.ok) throw new Error(await res.text())
        return res.text() // ✅ CAMBIAR .json() POR .text()
    }
}

export const usuarioService = {
    async getPerfil(studentId: string) {
        const res = await fetch(`${API_URL}/usuarios/${studentId}`)
        return res.json()
    },

    async buscarUsuarios(query: string, excluirStudentId?: string) {
        const params = new URLSearchParams({ q: query })
        if (excluirStudentId) params.append('excluir', excluirStudentId)
        const res = await fetch(`${API_URL}/usuarios/buscar?${params.toString()}`)
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

    async subirFoto(studentId: string, foto: File) {
        const formData = new FormData()
        formData.append('foto', foto)
        const res = await fetch(`${API_URL}/usuarios/${studentId}/foto`, {
            method: 'POST',
            body: formData,
        })
        return res.json()
    },
}

export const matchmakingService = {
    async getSolicitudesActivas() {
        const res = await fetch(`${API_URL}/matchmaking/solicitudes`)
        return res.json()
    },

    async getSolicitudesByUsuario(studentId: string) {
        const res = await fetch(`${API_URL}/matchmaking/solicitudes/usuario/${studentId}`)
        return res.json()
    },

    async crearSolicitud(data: {
        studentId: string
        deporte: string
        nivel: string
        disponibilidad: string
        descripcion: string
    }) {
        const res = await fetch(`${API_URL}/matchmaking/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        return res.json()
    },

    async cerrarSolicitud(id: number, studentId: string) {
        const res = await fetch(`${API_URL}/matchmaking/solicitudes/${id}/usuario/${studentId}`, {
            method: 'DELETE',
        })
        return res.text()
    },

    async conectar(solicitudId: number, studentId: string, mensaje?: string) {
        const res = await fetch(`${API_URL}/matchmaking/conectar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solicitudId, studentId, mensaje: mensaje || '' }),
        })
        return res.json()
    },

    async getConexiones(studentId: string) {
        const res = await fetch(`${API_URL}/matchmaking/conexiones/usuario/${studentId}`)
        return res.json()
    },

    async getSolicitudesRecibidas(studentId: string) {
        const res = await fetch(`${API_URL}/matchmaking/conexiones/recibidas/${studentId}`)
        return res.json()
    },

    async responderConexion(conexionId: number, studentId: string, estado: 'ACEPTADA' | 'RECHAZADA') {
        const res = await fetch(`${API_URL}/matchmaking/conexiones/${conexionId}/responder`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, estado }),
        })
        return res.json()
    },

    async eliminarConexion(conexionId: number, studentId: string) {
        const res = await fetch(`${API_URL}/matchmaking/conexiones/${conexionId}/usuario/${studentId}`, {
            method: 'DELETE',
        })
        return res.text()
    },
}

export const chatService = {
    async getMensajes(conexionId: number, studentId: string) {
        const res = await fetch(`${API_URL}/chat/conexion/${conexionId}/usuario/${studentId}`)
        return res.json()
    },

    async enviarMensaje(conexionId: number, studentId: string, contenido?: string, imagen?: File) {
        const formData = new FormData()
        if (contenido) formData.append('contenido', contenido)
        if (imagen) formData.append('imagen', imagen)
        const res = await fetch(`${API_URL}/chat/conexion/${conexionId}/usuario/${studentId}`, {
            method: 'POST',
            body: formData,
        })
        return res.json()
    },

    async eliminarMensaje(mensajeId: number, studentId: string) {
        const res = await fetch(`${API_URL}/chat/${mensajeId}/usuario/${studentId}`, {
            method: 'DELETE',
        })
        return res.text()
    },
}

export const implementoService = {
    async getDisponibilidad(deporte: string, fecha: string, horario: string) {
        const res = await fetch(
            `${API_URL}/implementos/disponibilidad?deporte=${encodeURIComponent(deporte)}&fecha=${fecha}&horario=${encodeURIComponent(horario)}`
        )
        return res.json()
    },
    async getPrestamosActivos(studentId: string) {
        const res = await fetch(`${API_URL}/implementos/prestamos/usuario/${studentId}`)
        return res.json()
    },
}
