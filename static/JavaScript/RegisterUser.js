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

            user = {
                email: email.value,
                password: password.value,
                confirmPassword: confirmPassword.value,
                name: nameInput.value,
                lastname: lastnameInput.value
            };

            registerUser(user);


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

function registerUser(user) {
    fetch('/registro', {
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
