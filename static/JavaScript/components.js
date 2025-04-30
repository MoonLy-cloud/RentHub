/**
 * Archivo de componentes reutilizables para RentHub
 */

// Cargar componentes dinámicos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  loadComponents();
  setupModalHandlers();
  setupFormValidation();
});

/**
 * Carga todos los componentes dinámicos en la página
 */
async function loadComponents() {
  // Componentes a cargar
  const components = [
    { selector: '[data-component="auth-modals"]', url: '/static/components/auth-modals.html' },
    { selector: '[data-component="property-card"]', url: '/static/components/property-card.html' },
    { selector: '#navbar-container', url: '/static/components/navbar.html' }
  ];
  
  // Cargar cada componente en paralelo
  await Promise.all(components.map(component => {
    const elements = document.querySelectorAll(component.selector);
    if (elements.length === 0) return Promise.resolve();
    
    return fetch(component.url)
      .then(response => response.text())
      .then(html => {
        elements.forEach(element => {
          element.innerHTML = html;
          // Activar scripts dentro del componente si es necesario
          const scripts = element.querySelectorAll('script');
          scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
          });
        });
      })
      .catch(error => console.error(`Error cargando componente ${component.url}:`, error));
  }));
  
  // Inicializar componentes después de cargarlos
  initializeComponents();
}

/**
 * Inicializa los componentes cargados
 */
function initializeComponents() {
  // Inicializar navbar
  if (typeof initializeNavbar === 'function') {
    initializeNavbar();
  }
  
  // Comprobar autenticación para ajustar la UI
  updateAuthUI();
}

/**
 * Configura los manejadores para modales
 */
function setupModalHandlers() {
  // Cerrar modales al hacer clic fuera o con el botón de cerrar
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal') || 
        event.target.classList.contains('btn-close')) {
      const modalId = event.target.closest('.modal').id;
      const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
      if (modal) modal.hide();
    }
  });
  
  // Evitar que los clics dentro del modal lo cierren
  document.addEventListener('click', function(event) {
    if (event.target.closest('.modal-content') && 
        !event.target.classList.contains('btn-close')) {
      event.stopPropagation();
    }
  });
}

/**
 * Configura validación de formularios
 */
function setupFormValidation() {
  // Validar formulario de registro
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      if (!this.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.classList.add('was-validated');
    });
  }
  
  // Validar formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      if (!this.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.classList.add('was-validated');
    });
  }
  
  // Agregar validación en tiempo real de contraseñas
  setupPasswordValidation();
}

/**
 * Configura validación de contraseñas en tiempo real
 */
function setupPasswordValidation() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  
  passwordInputs.forEach(input => {
    input.addEventListener('input', function() {
      if (this.id.includes('password') || this.id.includes('Password')) {
        validatePassword(this);
      }
    });
  });
}

/**
 * Valida una contraseña y muestra feedback
 */
function validatePassword(input) {
  const password = input.value;
  const result = isPasswordSecure(password);
  
  // Identificar el elemento de feedback
  let feedbackId = input.id + '-feedback';
  if (!document.getElementById(feedbackId)) {
    feedbackId = 'password-feedback';
  }
  
  const feedbackElement = document.getElementById(feedbackId);
  if (feedbackElement) {
    feedbackElement.innerHTML = result.requirementsHTML;
    
    // Aplicar clases basadas en la validez
    if (result.isValid) {
      input.classList.add('is-valid');
      input.classList.remove('is-invalid');
    } else if (password.length > 0) {
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
    } else {
      input.classList.remove('is-valid');
      input.classList.remove('is-invalid');
    }
  }
}

/**
 * Verifica si una contraseña cumple con los requisitos de seguridad
 */
function isPasswordSecure(password) {
  const requirements = [
    {
      check: password.length >= 8,
      message: 'Al menos 8 caracteres'
    },
    {
      check: /[A-Z]/.test(password),
      message: 'Al menos una mayúscula'
    },
    {
      check: /[a-z]/.test(password),
      message: 'Al menos una minúscula'
    },
    {
      check: /[0-9]/.test(password),
      message: 'Al menos un número'
    },
    {
      check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      message: 'Al menos un carácter especial'
    },
    {
      check: !/012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210/.test(password),
      message: 'Sin secuencias numéricas'
    },
    {
      check: !/abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i.test(password),
      message: 'Sin secuencias alfabéticas'
    }
  ];

  // Generar HTML para los requisitos
  let requirementsHTML = '<div class="password-requirements">';
  let allValid = true;

  requirements.forEach(req => {
    const color = req.check ? 'green' : 'red';
    const icon = req.check ? '✓' : '✗';
    requirementsHTML += `<div style="color: ${color}; margin: 3px 0;"><span>${icon}</span> ${req.message}</div>`;
    if (!req.check) allValid = false;
  });

  requirementsHTML += '</div>';

  return {
    isValid: allValid,
    message: 'Contraseña segura',
    requirementsHTML: requirementsHTML,
    failedChecks: requirements.filter(req => !req.check).length
  };
}

/**
 * Crea un componente de tarjeta de propiedad
 */
function createPropertyCard(property) {
  const template = document.getElementById('property-card-template');
  if (!template) return null;
  
  const isAvailable = property.disponible === 1 || property.disponible === true;
  
  // Clonar template y reemplazar variables
  const templateContent = template.innerHTML
    .replace('${image}', property.imagen || '/static/imgs/default-property.jpg')
    .replace('${name}', property.nombre)
    .replace('${address}', property.direccion || 'Sin dirección')
    .replace('${description}', property.descripcion || 'Sin descripción')
    .replace('${price}', property.precio)
    .replace('${id}', property.id)
    .replace('${availableBadgeDisplay}', isAvailable ? 'none' : 'block')
    .replace('${rentBtnDisplay}', isAvailable ? 'block' : 'none')
    .replace('${notAvailableBtnDisplay}', isAvailable ? 'none' : 'block');
  
  // Crear el elemento del DOM
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = templateContent;
  
  return tempDiv.firstElementChild;
}

/**
 * Actualiza la UI basada en el estado de autenticación
 */
function updateAuthUI() {
  const token = localStorage.getItem('authToken');
  const authRequired = document.querySelectorAll('.auth-required');
  const authNotRequired = document.querySelectorAll('.auth-not-required');
  
  if (token) {
    // Usuario autenticado
    authRequired.forEach(el => el.style.display = 'block');
    authNotRequired.forEach(el => el.style.display = 'none');
    actualizarDatosUsuario();
  } else {
    // Usuario no autenticado
    authRequired.forEach(el => el.style.display = 'none');
    authNotRequired.forEach(el => el.style.display = 'block');
  }
}

/**
 * Actualiza los datos del usuario en la UI
 */
function actualizarDatosUsuario() {
  const userDataString = localStorage.getItem('usuarioData');
  if (!userDataString) return;
  
  try {
    const userData = JSON.parse(userDataString);
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
      usernameDisplay.textContent = userData.nombre || 'Usuario';
    }
    
    // Actualizar imagen de perfil
    actualizarImagenUsuario();
  } catch (e) {
    console.error('Error al parsear datos de usuario:', e);
  }
}

/**
 * Actualiza la imagen del usuario
 */
function actualizarImagenUsuario() {
  const userImage = localStorage.getItem('user_image');
  const userImages = document.querySelectorAll('.user-img');
  
  userImages.forEach(img => {
    if (userImage) {
      img.src = userImage;
    } else {
      img.src = '/static/imgs/user.gif';
    }
  });
}

// Función de debounce para evitar llamadas excesivas
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Exportar funciones para uso en otros scripts
window.components = {
  createPropertyCard,
  updateAuthUI,
  debounce,
  isPasswordSecure
};