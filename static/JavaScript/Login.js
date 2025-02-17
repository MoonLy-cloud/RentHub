document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-container');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const user = { username: emailInput.value, password: passwordInput.value };

            if (emailInput.value === '' || passwordInput.value === '') {
                alert('Por favor, llena todos los campos');
            } else {
                login_user(user);
            }


        });
    } else {
        console.error('El formulario no se encontró en el DOM');
    }
});

document.addEventListener('DOMContentLoaded', function() {
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

function login_user(user) {
    try{
        const response = fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });

        if(response.status === 200){
            alert('Inicio de sesión exitoso');
        } else {
            alert('Usuario o contraseña incorrectos');
        }
    }
    catch(error){
        console.error('Error:', error);
        return false;
    }
}