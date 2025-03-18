document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-container');
    const signupLink = document.getElementById('signup-link');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include'  // Importante para cookies
                });

                const data = await response.json();

                if (response.ok) {
                    // Guardamos el nombre en sessionStorage para uso inmediato
                    sessionStorage.setItem('username', data.usuario);

                    // Redirigir a la página principal
                    window.location.href = '/';
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
            window.location.href = '/register';
        });
    }
});