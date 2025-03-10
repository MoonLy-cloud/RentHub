document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-user');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const name = document.getElementById('first-name');
            const lastName = document.getElementById('last-name');
            const secondLastName = document.getElementById('second-last-name');
            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm-password');

            let user = {
                name: name.value,
                lastName: lastName.value,
                secondLastName: secondLastName.value,
                email: (() => {
                    const [localPart, domainPart] = email.value.split('@');
                    return `${localPart}@${domainPart.toLowerCase()}`;
                })(),
                password: password.value,
                confirmPassword: confirmPassword.value
            };

            if (password.value !== confirmPassword.value) {
                alert('Las contraseñas no coinciden');
            } else {
                registerUser(user);
            }
        });
    } else {
        console.error('El formulario no se encontró en el DOM');
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