document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-container');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.getElementById('login-button');

    // Email input validation
    emailInput.addEventListener('input', function() {
        if (emailInput.value.trim() !== '' && /^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(emailInput.value)) {
            emailInput.classList.add('valid');
        } else {
            emailInput.classList.remove('valid');
        }
    });

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            // Key part: Using email instead of username
            const user = {
                email: emailInput.value,
                password: passwordInput.value
            };

            if (emailInput.value === '' || passwordInput.value === '') {
                alert('Por favor, llena todos los campos');
            } else {
                loginButton.disabled = true;
                loginButton.innerText = 'Iniciando sesión...';
                login_user(user);
            }
        });
    } else {
        console.error('El formulario no se encontró en el DOM');
    }

    // Keep the signup link functionality
    const registerLink = document.getElementById('signup-link');
    if (registerLink) {
        registerLink.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = '/register';
        });
    } else {
        console.error('El enlace de registro no se encontró en el DOM');
    }
});

async function login_user(user) {
    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Inicio de sesión exitoso');
            window.location.href = '/';
        } else {
            if (response.status === 404) {
                alert('Usuario no encontrado');
            } else {
                alert('Contraseña incorrecta');
            }
            const loginButton = document.getElementById('login-button');
            loginButton.disabled = false;
            loginButton.innerText = 'Iniciar Sesión';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al iniciar sesión');
        const loginButton = document.getElementById('login-button');
        loginButton.disabled = false;
        loginButton.innerText = 'Iniciar Sesión';
    }
}