document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-container');

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            const user = { username: emailInput.value, password: passwordInput.value };

            console.log(emailInput.value);
            console.log(passwordInput.value);


        });
    } else {
        console.error('El formulario no se encontró en el DOM');
    }
});

