document.addEventListener('DOMContentLoaded', function() {
    // Variable para controlar mensajes de error
    let errorMostrado = false;

    // Verificar si el usuario está autenticado
    async function verificarAutenticacion() {
        try {
            // Comprobar si hay un nombre de usuario en sessionStorage
            const usernameFromSession = sessionStorage.getItem('username');

            // Intentar verificar con el servidor
            const response = await fetch('/api/usuario', {
                method: 'GET',
                credentials: 'include',  // Incluir cookies
                cache: 'no-store'
            });

            if (response.ok) {
                // Respuesta exitosa, usar datos del servidor
                const data = await response.json();
                mostrarElementosAutenticados(data.usuario);
                // Actualizar sessionStorage como respaldo
                sessionStorage.setItem('username', data.usuario.nombre);
            } else {
                // Si tenemos datos en sessionStorage, usarlos como respaldo
                if (usernameFromSession) {
                    mostrarElementosAutenticados({nombre: usernameFromSession});
                } else {
                    mostrarElementosNoAutenticados();
                }
            }
        } catch (error) {
            // Usar datos locales en caso de error
            const usernameFromSession = sessionStorage.getItem('username');
            if (usernameFromSession) {
                mostrarElementosAutenticados({nombre: usernameFromSession});
            } else {
                mostrarElementosNoAutenticados();
            }
        }
    }

    function mostrarElementosAutenticados(usuario) {
        // Ocultar elementos para usuarios no autenticados
        document.querySelectorAll('.auth-not-required').forEach(el => {
            el.style.display = 'none';
        });

        // Mostrar elementos para usuarios autenticados
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = 'flex';
        });

        // Mostrar nombre de usuario
        const usernameDisplay = document.getElementById('username-display');
        if (usernameDisplay) {
            usernameDisplay.textContent = usuario.nombre || sessionStorage.getItem('username');

            // Mejorar estilo del contenedor
            const userProfileContainer = usernameDisplay.closest('.nav-item');
            if (userProfileContainer) {
                userProfileContainer.classList.add('user-profile-active');
            }
        }

        // Mejorar estilo del botón de cerrar sesión
        const logoutBtn = document.querySelector('.auth-required .btn-outline-danger');
        if (logoutBtn && logoutBtn.parentElement) {
            logoutBtn.parentElement.classList.add('logout-btn-container');
        }
    }

    function mostrarElementosNoAutenticados() {
        // Mostrar elementos para usuarios no autenticados
        document.querySelectorAll('.auth-not-required').forEach(el => {
            el.style.display = 'block';
        });

        // Ocultar elementos para usuarios autenticados
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = 'none';
        });
    }

    // Evento para cerrar sesión
    const logoutBtn = document.querySelector('a[href="/logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Limpiar sessionStorage
            sessionStorage.removeItem('username');

            // Hacer una petición al endpoint de logout
            fetch('/logout', {
                method: 'GET',
                credentials: 'include'
            }).then(() => {
                window.location.href = '/';
            }).catch(() => {
                window.location.href = '/';
            });
        });
    }

    // Verificar autenticación al cargar la página
    verificarAutenticacion();
});