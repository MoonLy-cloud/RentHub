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


            console.log(email.value);
            console.log(password.value);
            console.log(confirmPassword.value);
            console.log(nameInput.value);
            console.log(lastnameInput.value);


        });
    } else {
        console.error('El formulario no se encontró en el DOM');
    }
});