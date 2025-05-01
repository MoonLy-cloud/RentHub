// Función para hacer peticiones autenticadas
async function fetchAutenticado(url, options = {}) {
    const token = getToken();

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
    return getToken() !== null;
}

// Obtener datos del usuario actual
function getUsuarioActual() {
    const userData = localStorage.getItem('usuarioData');
    return userData ? JSON.parse(userData) : null;
}

// Modificación de api-helper.js
function getToken() {
    // Simplificar: usar solo localStorage
    return localStorage.getItem('token');
}

async function verificarAutenticacion() {
    const token = getToken();
    const paginasAutenticadas = ['/publicar', '/mi-perfil', '/mis-propiedades'];

    if (token) {
        try {
            // Verificar token con el servidor
            const response = await fetch('/api/usuario', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Token inválido, limpiar y redirigir
                localStorage.removeItem('token');
                localStorage.removeItem('username');

                if (paginasAutenticadas.includes(window.location.pathname)) {
                    window.location.href = '/';
                    return;
                }
            }
        } catch (error) {
            console.error('Error verificando autenticación:', error);

            if (paginasAutenticadas.includes(window.location.pathname)) {
                window.location.href = '/';
                return;
            }
        }
    } else {
        // No hay token, verificar si estamos en página protegida
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
    const token = getToken();
    const username = sessionStorage.getItem('username') || localStorage.getItem('username');
    const userImage = localStorage.getItem('user_image');

    // Primero oculta/muestra los elementos según corresponda
    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = token ? '' : 'none';
    });

    document.querySelectorAll('.auth-not-required').forEach(el => {
        el.style.display = token ? 'none' : '';
    });

    // Luego actualiza la información del usuario si existe
    if (token) {
        const usernameElement = document.getElementById('username-display');
        if (usernameElement && username) {
            usernameElement.textContent = username;
        }

        // Actualizar imagen de usuario si existe
        if (userImage) {
            document.querySelectorAll('.user-img').forEach(img => {
                img.src = userImage;
            });
        } else {
            // Si no hay imagen personalizada, usar la predeterminada
            document.querySelectorAll('.user-img').forEach(img => {
                img.src = "/static/imgs/user.gif";
            });
        }
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
            // Limpiar ambos almacenamientos
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('username');
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('user_image');

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
window.getToken = getToken;