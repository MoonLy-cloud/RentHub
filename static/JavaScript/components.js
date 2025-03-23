// static/JavaScript/components.js
document.addEventListener('DOMContentLoaded', function() {
    // Cargar componentes con el atributo data-component
    document.querySelectorAll('[data-component]').forEach(async function(element) {
        const componentName = element.getAttribute('data-component');
        await loadComponent(componentName, element);
    });
});

async function loadComponent(name, targetElement) {
    try {
        const response = await fetch(`/static/components/${name}.html`);
        if (!response.ok) throw new Error(`No se pudo cargar el componente: ${name}`);

        const html = await response.text();
        targetElement.innerHTML = html;

        // Inicializar comportamientos específicos de componentes
        if (name === 'auth-modals') {
            initAuthModals();
        }
    } catch (error) {
        console.error('Error cargando componente:', error);
        targetElement.innerHTML = `<div class="alert alert-danger">Error cargando el componente ${name}</div>`;
    }
}

function initAuthModals() {
    // Cambiar entre modales
    document.querySelectorAll('.switch-to-register').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            new bootstrap.Modal(document.getElementById('registerModal')).show();
        });
    });

    document.querySelectorAll('.switch-to-login').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
            new bootstrap.Modal(document.getElementById('loginModal')).show();
        });
    });

    // Agregar validación de contraseña
    const passwordRegisterModal = document.getElementById('password-register-modal');

    if (passwordRegisterModal) {
        // Crear contenedor para feedback de contraseña
        const feedbackDiv = document.createElement('div');
        feedbackDiv.id = 'modal-password-feedback';
        feedbackDiv.className = 'mt-0 mb-3';
        passwordRegisterModal.parentNode.parentNode.insertBefore(feedbackDiv,
            passwordRegisterModal.parentNode.nextSibling);

        // Validar contraseña en tiempo real
        passwordRegisterModal.addEventListener('input', () => {
            const passwordCheck = isPasswordSecure(passwordRegisterModal.value);
            document.getElementById('modal-password-feedback').innerHTML = passwordCheck.requirementsHTML;
        });
    }

    // Validar email en tiempo real
    const emailRegisterModal = document.getElementById('email-register-modal');
    if (emailRegisterModal) {
        const emailFeedbackDiv = document.createElement('div');
        emailFeedbackDiv.id = 'modal-email-feedback';
        emailFeedbackDiv.className = 'mt-0 mb-3';
        emailRegisterModal.parentNode.parentNode.insertBefore(emailFeedbackDiv,
            emailRegisterModal.parentNode.nextSibling);

        emailRegisterModal.addEventListener('input', () => {
            const isValid = emailRegisterModal.value.includes('@');
            const color = isValid ? 'green' : 'red';
            const icon = isValid ? '✓' : '✗';
            emailFeedbackDiv.innerHTML = `<div style="color: ${color}; margin: 3px 0;"><span>${icon}</span> Debe contener @</div>`;
        });
    }

    // Inicializar formulario de login
    const loginForm = document.getElementById('login-modal-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email-modal').value;
            const password = document.getElementById('password-modal').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardar token y nombre de usuario
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('username', data.usuario.nombre);

                    // Cerrar modal
                    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();

                    // Actualizar UI
                    updateAuthUI();

                    Swal.fire({
                        icon: 'success',
                        title: '¡Bienvenido!',
                        text: 'Has iniciado sesión correctamente',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    throw new Error(data.message || 'Error de autenticación');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al iniciar sesión'
                });
            }
        });
    }

    // Inicializar formulario de registro
    const registerForm = document.getElementById('register-modal-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('first-name-modal').value;
            const lastName = document.getElementById('last-name-modal').value;
            const secondLastName = document.getElementById('second-last-name-modal').value;
            const email = document.getElementById('email-register-modal').value;
            const password = document.getElementById('password-register-modal').value;
            const confirmPassword = document.getElementById('confirm-password-modal').value;

            if (password !== confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Las contraseñas no coinciden'
                });
                return;
            }

            // Validar contraseña
            const passwordCheck = isPasswordSecure(password);
            if (!passwordCheck.isValid) {
                Swal.fire({
                    icon: 'error',
                    title: 'Contraseña insegura',
                    text: 'Tu contraseña no cumple con los requisitos de seguridad'
                });
                return;
            }

            if (password !== confirmPassword) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error de validación',
                    text: 'Las contraseñas no coinciden'
                });
                return;
            }

            const userData = {
                name: name,
                lastName: lastName,
                secondLastName: secondLastName,
                email: email,
                password: password,
                confirmPassword: confirmPassword
            };

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });

                const data = await response.json();

                if (response.ok) {
                    // Cerrar modal
                    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();

                    Swal.fire({
                        icon: 'success',
                        title: '¡Registro exitoso!',
                        text: 'Ahora puedes iniciar sesión',
                        showConfirmButton: true
                    }).then(() => {
                        new bootstrap.Modal(document.getElementById('loginModal')).show();
                    });
                } else {
                    throw new Error(data.message || 'Error en el registro');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al registrar usuario'
                });
            }
        });
    }
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