// static/JavaScript/auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación al cargar cualquier página
    verificarAutenticacion();
});

// Verificar si hay token almacenado y es válido
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

// Función global para actualizar la imagen de usuario en todas partes
function guardarImagenUsuario(imagenPath) {
    localStorage.setItem('user_image', imagenPath);
    document.querySelectorAll('.user-img').forEach(img => {
        img.src = imagenPath;
    });
}

// Función auxiliar para hacer peticiones con autenticación
function fetchAutenticado(url, options = {}) {
    const token = localStorage.getItem('token');

    if (!token) {
        return Promise.reject(new Error('No estás autenticado'));
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    return fetch(url, {
        ...options,
        headers: headers
    });
}

// Actualizar UI basado en el estado final
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

function isPasswordSecure(password) {
    const requirements = [
        {
            check: password.length >= 8,
            message: 'Al menos 8 caracteres'
        },
        {
            check: /[A-Z]/.test(password),
            message: 'Al menos una mayúscula'
        },
        {
            check: /[a-z]/.test(password),
            message: 'Al menos una minúscula'
        },
        {
            check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
            message: 'Al menos un carácter especial'
        },
        {
            check: !/012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(password),
            message: 'Sin secuencias numéricas'
        },
        {
            check: !/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password),
            message: 'Sin secuencias alfabéticas'
        }
    ];

    // Generate HTML for requirements
    let requirementsHTML = '<div class="password-requirements">';
    let allValid = true;

    requirements.forEach(req => {
        const color = req.check ? 'green' : 'red';
        const icon = req.check ? '✓' : '✗';
        requirementsHTML += `<div style="color: ${color}; margin: 3px 0;"><span>${icon}</span> ${req.message}</div>`;
        if (!req.check) allValid = false;
    });

    requirementsHTML += '</div>';

    return {
        isValid: allValid,
        message: 'Contraseña segura',
        requirementsHTML: requirementsHTML,
        failedChecks: requirements.filter(req => !req.check).length
    };
}

// Exportar funciones para uso global
window.isPasswordSecure = isPasswordSecure;
window.updateAuthUI = updateAuthUI;
window.fetchAutenticado = fetchAutenticado;
window.cerrarSesion = cerrarSesion;
window.verificarAutenticacion = verificarAutenticacion;