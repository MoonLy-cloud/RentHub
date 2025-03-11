document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-user');

if (form) {
    const passwordInput = document.getElementById('password');
    const feedbackDiv = document.createElement('div');
    feedbackDiv.id = 'password-feedback';
    passwordInput.parentNode.insertBefore(feedbackDiv, passwordInput.nextSibling);

    // Check requirements on input
    passwordInput.addEventListener('input', () => {
        const passwordCheck = isPasswordSecure(passwordInput.value);
        document.getElementById('password-feedback').innerHTML = passwordCheck.requirementsHTML;
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('first-name');
        const lastName = document.getElementById('last-name');
        const secondLastName = document.getElementById('second-last-name');
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm-password');

        // Check password security
        const passwordCheck = isPasswordSecure(password.value);

        if (!passwordCheck.isValid) {
            document.getElementById('password-feedback').innerHTML = passwordCheck.requirementsHTML;
            return;
        }

        if (password.value !== confirmPassword.value) {
            const confirmFeedback = document.getElementById('confirm-password-feedback') ||
                (() => {
                    const div = document.createElement('div');
                    div.id = 'confirm-password-feedback';
                    div.style.color = 'red';
                    confirmPassword.parentNode.insertBefore(div, confirmPassword.nextSibling);
                    return div;
                })();
            confirmFeedback.textContent = 'Las contraseñas no coinciden';
            return;
        }

        let user = {
            name: name.value,
            lastName: lastName.value,
            secondLastName: secondLastName.value,
            email: (() => {
                const [localPart, domainPart] = email.value.split('@');
                return `${localPart}@${domainPart.toLowerCase()}`;
            })(),
            password: password.value
        };

        registerUser(user);
    });
}
});

document.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.getElementById('login-link');

    if (loginLink) {
        loginLink.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = '/login';
        });
    } else {
        console.error('El enlace de inicio no se encontró en el DOM');
    }
});

function registerUser(user) {
    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    })
        .then((response) => {
            const status = response.status;
            if (status === 400) {
                alert('Usuario ya existente');
            } else if (status === 200) {
                alert('Usuario registrado correctamente');
            } else {
                throw new Error('Error en la solicitud');
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Error al registrar usuario');
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