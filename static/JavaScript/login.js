document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-container');
    const signupLink = document.getElementById('signup-link');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                console.log("Intentando iniciar sesión...");

                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("Respuesta:", data);

                if (response.ok) {
                    // Guardamos los datos completos del usuario en localStorage
                    localStorage.setItem('usuarioData', JSON.stringify(data.usuario));
                    localStorage.setItem('authToken', data.token);
                    console.log("Sesión iniciada como:", data.usuario.nombre);

                    // Redirigir con reemplazo total
                    window.location.replace('/');
                } else {
                    alert(data.message || 'Error en el inicio de sesión');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error de conexión');
            }
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.replace('/register');
        });
    }
});