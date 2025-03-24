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

// Añadir esta función
function validarCURP(curp) {
    // Verificación básica de longitud
    if (!curp || curp.length !== 18) {
        return {
            isValid: false,
            message: "El CURP debe tener exactamente 18 caracteres."
        };
    }

    // Expresión regular más simple para validación básica
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}\w\d$/;

    if (!curpRegex.test(curp)) {
        return {
            isValid: false,
            message: "El formato del CURP no es válido. Recuerda que debe seguir el patrón: AAAA######HAAAAAA#"
        };
    }

    return {
        isValid: true,
        message: "CURP válido"
    };


    // Validar estructura básica (esto no garantiza que sea real)
    const fechaNacimiento = curp.substring(4, 10);
    const sexo = curp.charAt(10);

    // Validar año (primeros 2 dígitos de la fecha)
    const anio = parseInt(fechaNacimiento.substring(0, 2));
    // Validar mes (siguientes 2 dígitos)
    const mes = parseInt(fechaNacimiento.substring(2, 4));
    // Validar día (últimos 2 dígitos)
    const dia = parseInt(fechaNacimiento.substring(4, 6));

    if (mes < 1 || mes > 12) {
        return {
            isValid: false,
            message: "El mes en el CURP no es válido."
        };
    }

    if (dia < 1 || dia > 31) {
        return {
            isValid: false,
            message: "El día en el CURP no es válido."
        };
    }

    if (sexo !== 'H' && sexo !== 'M') {
        return {
            isValid: false,
            message: "El indicador de sexo en el CURP no es válido."
        };
    }

    return {
        isValid: true,
        message: "Formato de CURP válido."
    };
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

    const curpRegisterModal = document.getElementById('curp-register-modal');
    if (curpRegisterModal) {
        const curpFeedbackDiv = document.createElement('div');
        const nombreRegistro = document.getElementById('first-name-modal');
        const apellidoPaterno = document.getElementById('last-name-modal');
        const apellidoMaterno = document.getElementById('second-last-name-modal');

        // Función para generar las primeras letras del CURP
        function generarInicioCURP() {
            if (!apellidoPaterno.value || !apellidoMaterno.value || !nombreRegistro.value) return;

            // Limpiar y convertir a mayúsculas
            const ap = limpiarTexto(apellidoPaterno.value.toUpperCase());
            const am = limpiarTexto(apellidoMaterno.value.toUpperCase());
            const nombre = limpiarTexto(nombreRegistro.value.toUpperCase());
            const curpHelp = document.getElementById('curp-help');


            if (ap.length < 2 || am.length < 1 || nombre.length < 1) return;

            // Primera letra del apellido paterno
            let curpGenerado = ap.charAt(0);

            // Primera vocal del apellido paterno
            let vocal = '';
            for (let i = 1; i < ap.length; i++) {
                if ("AEIOU".includes(ap.charAt(i))) {
                    vocal = ap.charAt(i);
                    break;
                }
            }
            curpGenerado += vocal || 'X';

            // Primera letra del apellido materno
            curpGenerado += am.charAt(0);

            // Primera letra del nombre
            curpGenerado += nombre.charAt(0);

            // Colocar en el campo CURP
            curpRegisterModal.value = curpGenerado;

            // Disparar el evento input para activar la validación
            curpRegisterModal.dispatchEvent(new Event('input'));

            if (curpHelp) {
                curpHelp.innerHTML = 'Se han generado las primeras 4 letras. Por favor completa los 14 caracteres restantes (fecha de nacimiento, sexo, estado, etc.)';
            }
        }

        // Función para limpiar texto (eliminar acentos y caracteres especiales)
        function limpiarTexto(texto) {
            return texto
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")  // Eliminar acentos
                .replace(/[^A-Z]/g, "");  // Solo letras mayúsculas
        }

        // Añadir eventos para detectar cambios en los campos de nombre
        nombreRegistro.addEventListener('blur', generarInicioCURP);
        apellidoPaterno.addEventListener('blur', generarInicioCURP);
        apellidoMaterno.addEventListener('blur', generarInicioCURP);

        curpFeedbackDiv.id = 'modal-curp-feedback';
        curpFeedbackDiv.className = 'mt-0 mb-3';
        curpRegisterModal.parentNode.parentNode.insertBefore(curpFeedbackDiv,
            curpRegisterModal.parentNode.nextSibling);

        curpRegisterModal.addEventListener('input', () => {
            curpRegisterModal.value = curpRegisterModal.value.toUpperCase();
            if (curpRegisterModal.value.length === 18) {
                const validacion = validarCURP(curpRegisterModal.value);
                const color = validacion.isValid ? 'green' : 'red';
                const icon = validacion.isValid ? '✓' : '✗';
                curpFeedbackDiv.innerHTML = `<div style="color: ${color}; margin: 3px 0;"><span>${icon}</span> ${validacion.message}</div>`;
            } else if (curpRegisterModal.value.length > 0) {
                curpFeedbackDiv.innerHTML = `<div style="color: orange; margin: 3px 0;"><span>⚠️</span> El CURP debe tener 18 caracteres (tienes ${curpRegisterModal.value.length})</div>`;
            } else {
                curpFeedbackDiv.innerHTML = '';
            }
        });
    }



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
    // Inicializar formulario de login
    const loginForm = document.getElementById('login-modal-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email-modal').value;
            const password = document.getElementById('password-modal').value;
            const rememberMe = document.getElementById('remember-me-modal').checked;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Si "Recordarme" está marcado, guardar en localStorage (persistente)
                    // Si no, guardar en sessionStorage (se borra al cerrar el navegador)
                    if (rememberMe) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('username', data.usuario.nombre);
                        localStorage.setItem('remember_session', 'true');
                    } else {
                        sessionStorage.setItem('token', data.token);
                        sessionStorage.setItem('username', data.usuario.nombre);
                        localStorage.removeItem('remember_session');
                    }

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
            const curp = document.getElementById('curp-register-modal').value;
            const email = document.getElementById('email-register-modal').value;
            const password = document.getElementById('password-register-modal').value;
            const confirmPassword = document.getElementById('confirm-password-modal').value;

            // Validar CURP
            const curpValidation = validarCURP(curp);
            if (!curpValidation.isValid) {
                Swal.fire({
                    icon: 'error',
                    title: 'CURP inválido',
                    text: curpValidation.message
                });
                return;
            }

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
                curp: curp,
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