document.addEventListener('DOMContentLoaded', function() {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
          <div class="container">
            <a class="navbar-brand fw-bold text-primary" href="/">
              <img src="/static/imgs/logo.png" alt="RentHub" class="navbar-logo" height="35" width="auto">
            </a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto align-items-center">
              <li class="nav-item">
                <a class="nav-link nav-item-hover" id="nav-home" href="/">Inicio</a>
              </li>
              <li class="nav-item">
                <a class="nav-link nav-item-hover" id="nav-propiedades" href="/propiedades">Propiedades</a>
              </li>
              <li class="nav-item auth-not-required ms-lg-3" style="display: none;">
                <button class="btn btn-outline-primary hover-effect" data-bs-toggle="modal" data-bs-target="#loginModal">Iniciar Sesión</button>
              </li>
              <li class="nav-item auth-not-required ms-lg-2" style="display: none;">
                <button class="btn btn-primary hover-effect" data-bs-toggle="modal" data-bs-target="#registerModal">Registrarse</button>
              </li>
              <li class="nav-item dropdown auth-required ms-lg-2" style="display: none;">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  <span class="me-2" id="username-display">Usuario</span>
                  <div class="user-avatar-container">
                    <img src="/static/imgs/user.gif" alt="Usuario" class="user-img">
                  </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="/mi-perfil"><i class="bi bi-person"></i> Mi Perfil</a></li>
                  <li><a class="dropdown-item" href="/publicar"><i class="bi bi-houses"></i> Publicar</a></li>
                  <li><hr class="dropdown-divider"></li>
                  <li><a class="dropdown-item" href="#" id="logout-btn"><i class="bi bi-box-arrow-right"></i> Cerrar Sesión</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `;
        // Añade esta función completa en navbar.js
        function actualizarImagenNavbarGlobal() {
            const userImage = localStorage.getItem('user_image');
            if (userImage) {
                document.querySelectorAll('.user-img').forEach(img => {
                    img.src = userImage;
                });
            }
        }

        // Ejecuta al cargar la página
        document.addEventListener('DOMContentLoaded', function() {
            actualizarImagenNavbarGlobal();
        });

        // Marcar el elemento activo según la URL actual
        const path = window.location.pathname;
        if (path === '/') {
            document.getElementById('nav-home').classList.add('active');
        } else if (path === '/propiedades') {
            document.getElementById('nav-propiedades').classList.add('active');
        }

        // Inicializar botón de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                cerrarSesion();
            });
        }
    }
});