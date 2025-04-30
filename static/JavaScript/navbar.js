/**
 * Controlador para la barra de navegación
 */
document.addEventListener('DOMContentLoaded', function() {
  // Si el navbar-container ya tiene el navbar, inicializarlo
  if (document.querySelector('#navbar-container nav')) {
    initializeNavbar();
  }
});

/**
 * Inicializa la barra de navegación
 */
function initializeNavbar() {
  setupScrollEffect();
  setupLogoutHandler();
  highlightCurrentPage();
  setupMobileMenuBehavior();
  updateAuthUI();
}

/**
 * Configura el efecto de cambio al hacer scroll
 */
function setupScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 30) {
      navbar.classList.add('navbar-scrolled');
    } else {
      navbar.classList.remove('navbar-scrolled');
    }
  });

  // Trigger inicial
  if (window.scrollY > 30) {
    navbar.classList.add('navbar-scrolled');
  }
}

/**
 * Configura el manejador de cierre de sesión
 */
function setupLogoutHandler() {
  const logoutBtn = document.getElementById('logout-btn');
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Confirmar cierre de sesión
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: '¿Estás seguro que deseas cerrar tu sesión?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Eliminar datos de sesión
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuarioData');
        localStorage.removeItem('user_image');
        
        // Notificar
        Swal.fire({
          title: '¡Sesión cerrada!',
          text: 'Has cerrado sesión correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          // Redirigir a la página principal
          window.location.href = '/';
        });
      }
    });
  });
}

/**
 * Destaca la página actual en el menú
 */
function highlightCurrentPage() {
  const navLinks = document.querySelectorAll('.navbar .nav-link');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    // Obtener ruta del enlace (ignorando parámetros)
    const linkPath = link.getAttribute('href').split('?')[0];
    
    // Verificar si estamos en esa página y no es un botón de dropdown
    if ((currentPath === linkPath || 
        (linkPath !== '/' && currentPath.startsWith(linkPath))) && 
        !link.classList.contains('dropdown-toggle')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/**
 * Configura el comportamiento del menú en dispositivos móviles
 */
function setupMobileMenuBehavior() {
  // En dispositivos móviles, cerrar automáticamente el menú al hacer clic
  const navLinks = document.querySelectorAll('.navbar-nav a.nav-link:not(.dropdown-toggle)');
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  
  if (!navLinks.length || !navbarToggler || !navbarCollapse) return;
  
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 992 && navbarCollapse.classList.contains('show')) {
        // Usar método de Bootstrap para cerrar
        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
        bsCollapse.hide();
      }
    });
  });
}

/**
 * Actualiza la imagen del usuario en la barra de navegación
 */
function actualizarImagenUsuario() {
  const userImg = document.querySelector('.user-img');
  if (!userImg) return;
  
  const userImage = localStorage.getItem('user_image');
  if (userImage) {
    userImg.src = userImage;
  } else {
    // Intentar obtener la imagen del usuario desde el objeto de usuario
    const userDataString = localStorage.getItem('usuarioData');
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        if (userData.imagen_perfil) {
          userImg.src = userData.imagen_perfil;
          // Guardar en localStorage para futuras referencias
          localStorage.setItem('user_image', userData.imagen_perfil);
        } else {
          userImg.src = '/static/imgs/user.gif';
        }
      } catch (e) {
        console.error('Error al parsear datos de usuario:', e);
        userImg.src = '/static/imgs/user.gif';
      }
    }
  }
}

// Escuchar cambios en localStorage para mantener UI actualizada
window.addEventListener('storage', function(event) {
  if (event.key === 'authToken' || event.key === 'usuarioData' || event.key === 'user_image') {
    updateAuthUI();
  }
});