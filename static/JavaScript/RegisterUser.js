document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('register-user');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const email = document.getElementById('email');
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm-password');
            const nameInput = document.getElementById('first-name');
            const lastnameInput = document.getElementById('last-name');

            let user = {
                email: email.value,
                password: password.value,
                confirmPassword: confirmPassword.value,
                name: nameInput.value,
                lastname: lastnameInput.value
            };

            if (!validatePassword(password.value, confirmPassword.value)) {
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
    .then((response) => response.json())
    .then((data) => {
        console.log(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

function validatePassword(password, confirmPassword) {
    return password === confirmPassword;
}