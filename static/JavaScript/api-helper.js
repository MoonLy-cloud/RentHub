// static/JavaScript/api-helper.js

// Función para hacer peticiones autenticadas
async function fetchAutenticado(url, options = {}) {
    const token = localStorage.getItem('token');

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
    return localStorage.getItem('token') !== null;
}

// Obtener datos del usuario actual
function getUsuarioActual() {
    const userData = localStorage.getItem('usuarioData');
    return userData ? JSON.parse(userData) : null;
}

// Verificar autenticación con el servidor
async function verificarAutenticacion() {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            // Verificar validez del token con el servidor
            const response = await fetch('/api/usuario', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Token inválido, eliminar credenciales
                localStorage.removeItem('token');
                localStorage.removeItem('username');
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);
        }
    } else {
        // No hay token, verificar si estamos en una página protegida
        const paginasAutenticadas = ['/publicar', '/mi-perfil', '/mis-propiedades'];
        if (paginasAutenticadas.includes(window.location.pathname)) {
            window.location.href = '/';
            return;
        }
    }

    // Actualizar UI basado en el estado final
    updateAuthUI();
}

// Actualizar UI basado en el estado de autenticación
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userImage = localStorage.getItem('user_image');

    // Elementos que requieren autenticación
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = token ? '' : 'none';
    });

    // Elementos para usuarios no autenticados
    document.querySelectorAll('.auth-not-required').forEach(el => {
        el.style.display = token ? 'none' : '';
    });

    // Actualizar nombre de usuario si existe
    const usernameElement = document.getElementById('username-display');
    if (usernameElement && username) {
        usernameElement.textContent = username;
    }

    // Actualizar imagen de usuario si existe
    if (userImage) {
        document.querySelectorAll('.user-img').forEach(img => {
            img.src = userImage;
        });
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: "¿Estás seguro que deseas salir de tu cuenta?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--color-primary)',
        cancelButtonColor: 'var(--color-secondary)',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');

            Swal.fire(
                '¡Sesión cerrada!',
                'Has salido de tu cuenta exitosamente.',
                'success'
            ).then(() => {
                window.location.href = '/';
            });
        }
    });
}

// Exportar como funciones globales
window.fetchAutenticado = fetchAutenticado;
window.estaAutenticado = estaAutenticado;
window.getUsuarioActual = getUsuarioActual;
window.verificarAutenticacion = verificarAutenticacion;
window.updateAuthUI = updateAuthUI;
window.cerrarSesion = cerrarSesion;