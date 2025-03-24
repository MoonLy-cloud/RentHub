// static/JavaScript/auth.js
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación al cargar cualquier página
    verificarAutenticacion();
});

// Función para validar seguridad de contraseñas
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

// Función global para actualizar la imagen de usuario en todas partes
function guardarImagenUsuario(imagenPath) {
    localStorage.setItem('user_image', imagenPath);
    document.querySelectorAll('.user-img').forEach(img => {
        img.src = imagenPath;
    });
}

// Exportar funciones específicas de autenticación
window.isPasswordSecure = isPasswordSecure;
window.guardarImagenUsuario = guardarImagenUsuario;