document.addEventListener('DOMContentLoaded', function() {
    // Obtener el botón de lugares
    const buttonPlaces = document.getElementById('button_places');
    const buttonIndex = document.getElementById('button_index');

    // Agregar evento de clic
    if (buttonPlaces) {
        buttonPlaces.addEventListener('click', function() {
            // Cambiar por replace para una carga completa
            window.location.replace('/propiedades');
        });
    }
    
    // Animaciones en scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.card, .btn-primary, .section-title, .benefit-icon-wrapper');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight * 0.8) {
                element.classList.add('fade-in');
            }
        });
    };
    
    // Observar elementos para scroll animations si AOS no está disponible
    if (typeof AOS === 'undefined') {
        window.addEventListener('scroll', animateOnScroll);
        // Ejecutar una vez al cargar para animar elementos visibles
        animateOnScroll();
    }
    
    // Contador de números para la sección de estadísticas
    const startCounters = () => {
        const counters = document.querySelectorAll('.col-md-3 h2');
        const speed = 200;
        
        counters.forEach(counter => {
            const target = +counter.innerText.replace(/[^\d]/g, '');
            let count = 0;
            const inc = target / speed;
            
            const updateCount = () => {
                if (count < target) {
                    count += inc;
                    counter.innerText = Math.ceil(count) + (counter.innerText.includes('+') ? '+' : '');
                    setTimeout(updateCount, 1);
                } else {
                    counter.innerText = target + (counter.innerText.includes('+') ? '+' : '');
                }
            };
            
            updateCount();
        });
    };
    
    // Iniciar los contadores cuando la sección sea visible
    const statsSection = document.querySelector('.bg-white');
    
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                startCounters();
                observer.disconnect();
            }
        }, { threshold: 0.5 });
        
        observer.observe(statsSection);
    }
    
    // Smooth scroll para enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Formulario de newsletter
    const newsletterForm = document.querySelector('.newsletter-section form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            
            if (email) {
                // Aquí normalmente enviarías el email al servidor
                Swal.fire({
                    icon: 'success',
                    title: '¡Gracias por suscribirte!',
                    text: 'Pronto recibirás nuestras mejores ofertas.',
                    confirmButtonColor: '#0d6efd'
                });
                
                this.reset();
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Email requerido',
                    text: 'Por favor, ingresa tu dirección de correo electrónico.',
                    confirmButtonColor: '#0d6efd'
                });
            }
        });
    }
});