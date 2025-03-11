document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-user');

    // Update the form submit event listener
if (form) {
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
            alert(passwordCheck.message);
            return;
        }

        if (password.value !== confirmPassword.value) {
            alert('Las contraseñas no coinciden');
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
    // Check minimum length
    if (password.length < 8) {
        return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }

    // Check for uppercase and lowercase
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    if (!hasUpperCase || !hasLowerCase) {
        return { isValid: false, message: 'La contraseña debe incluir mayúsculas y minúsculas' };
    }

    // Check for special characters
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    if (!hasSpecialChar) {
        return { isValid: false, message: 'La contraseña debe incluir al menos un carácter especial' };
    }

    // Check for sequential numbers (123, 234, etc.)
    const hasSequentialNumbers = /012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(password);
    if (hasSequentialNumbers) {
        return { isValid: false, message: 'La contraseña no debe contener secuencias de números' };
    }

    // Check for sequential letters (abc, def, etc.)
    const hasSequentialLetters = /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password);
    if (hasSequentialLetters) {
        return { isValid: false, message: 'La contraseña no debe contener secuencias de letras' };
    }

    return { isValid: true, message: 'Contraseña segura' };
}