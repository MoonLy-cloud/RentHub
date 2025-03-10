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
                email: email.value,
                password: password.value,
                confirmPassword: confirmPassword.value
            };

            if (!validatePassword(password.value, confirmPassword.value)) {
                alert('Las contraseñas no coinciden');
            } else {
                registerUser(user);
                alert('Usuario registrado exitosamente');
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
            if (!response.ok) {
                return response.json().then((error) => {
                    throw new Error(error.message || 'Error en la solicitud');
                });
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            alert('Usuario registrado exitosamente');
        })
        .catch((error) => {
            console.error('Error:', error);
            alert(`Error al registrar usuario: ${error.message}`);
        });
}

function validatePassword(password, confirmPassword) {
    return password === confirmPassword;
}