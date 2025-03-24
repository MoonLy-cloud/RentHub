// Función para hacer peticiones autenticadas
async function fetchAutenticado(url, options = {}) {
    const token = localStorage.getItem('authToken');

    if (!token) {
        throw new Error('No hay token de autenticación');
    }

    // Opciones predeterminadas
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    // Combinar opciones
    const fetchOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    return fetch(url, fetchOptions);
}

// Verificar si el usuario está autenticado
function estaAutenticado() {
    return localStorage.getItem('authToken') !== null;
}

// Obtener datos del usuario actual
function getUsuarioActual() {
    const userData = localStorage.getItem('usuarioData');
    return userData ? JSON.parse(userData) : null;
}