document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const propertyList = document.getElementById('property-list');
    const editarPropiedadForm = document.getElementById('editar-propiedad-form');

    // Evento para búsqueda en tiempo real
    searchInput.addEventListener('input', debounce(function() {
        const query = searchInput.value.trim().toLowerCase();
        buscarPropiedades(query);
    }, 300)); // Debounce de 300ms para no hacer demasiadas peticiones

    // Mantener el evento submit para compatibilidad
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const query = searchInput.value.trim().toLowerCase();
        buscarPropiedades(query);
    });

    // Función para buscar propiedades
    async function buscarPropiedades(query) {
        try {
            propertyList.innerHTML = '<div class="col-12 text-center">Buscando propiedades...</div>';

            let url = '/api/propiedades';
            if (query) {
                url += `?search=${encodeURIComponent(query)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (response.ok) {
                mostrarPropiedades(data.propiedades);
            } else {
                console.error('Error al buscar propiedades:', data.message);
                propertyList.innerHTML = '<div class="col-12 text-center">Error en la búsqueda</div>';
            }
        } catch (error) {
            console.error('Error:', error);
            propertyList.innerHTML = '<div class="col-12 text-center">Error de conexión</div>';
        }
    }

    // Función debounce para evitar múltiples peticiones
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

    if (editarPropiedadForm) {
        editarPropiedadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCambiosPropiedad();
        });
    } else {
        // Usar delegación de eventos como alternativa
        document.body.addEventListener('submit', function(e) {
            if (e.target.id === 'editar-propiedad-form') {
                e.preventDefault();
                guardarCambiosPropiedad();
            }
        });
    }

    // Función para verificar si el usuario está autenticado
    function estaAutenticado() {
        const token = localStorage.getItem('authToken');
        const usuario = localStorage.getItem('usuarioData');
        return token !== null && usuario !== null;
    }

    async function cargarPropiedades() {
        try {
            propertyList.innerHTML = '<div class="col-12 text-center">Cargando propiedades...</div>';

            const response = await fetch('/api/propiedades');
            const data = await response.json();

            if (response.ok) {
                mostrarPropiedades(data.propiedades);
            } else {
                console.error('Error al cargar propiedades:', data.message);
                propertyList.innerHTML = '<div class="col-12 text-center">Error al cargar las propiedades</div>';
            }
        } catch (error) {
            console.error('Error:', error);
            propertyList.innerHTML = '<div class="col-12 text-center">Error de conexión</div>';
        }
    }

    function mostrarPropiedades(propiedades) {
        if (propiedades.length === 0) {
            propertyList.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info py-4 mt-3">
                        <i class="bi bi-info-circle me-2"></i> No hay propiedades disponibles
                    </div>
                </div>`;
            return;
        }

        let html = '';
        propiedades.forEach(propiedad => {
            // Verificar si la propiedad está disponible
            const estaDisponible = propiedad.disponible === 1 || propiedad.disponible === true;

            // Clase CSS para propiedades no disponibles
            const cardClass = estaDisponible ? 'propiedad-card' : 'propiedad-card no-disponible';

            // Formatear precio con separador de miles
            const precioFormateado = parseFloat(propiedad.precio).toLocaleString('es-MX');

            html += `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card ${cardClass} shadow-sm">
                    <div class="propiedad-img-container">
                        <img src="${propiedad.imagen || '/static/imgs/default-property.jpg'}"
                             class="card-img-top propiedad-img"
                             alt="${propiedad.nombre}">
                        ${!estaDisponible ? '<div class="no-disponible-badge">Rentada</div>' : ''}
                    </div>
                    <div class="card-body propiedad-body">
                        <h5 class="card-title">${propiedad.nombre}</h5>
                        <p class="card-text text-muted">
                            <i class="bi bi-geo-alt me-1"></i>${propiedad.direccion}
                        </p>
                        <p class="card-text propiedad-description">${propiedad.descripcion}</p>
                        <p class="card-text precio-destacado">$${precioFormateado} MXN</p>
                        <div class="propiedad-actions mt-3">
                            <button class="btn btn-primary ver-detalles w-100 mb-2" data-id="${propiedad.id}">
                                <i class="bi bi-eye me-1"></i> Ver detalles
                            </button>
                            ${estaDisponible ? `
                            <button class="btn btn-success btn-rentar w-100" 
                                    data-id="${propiedad.id}" 
                                    data-price="${propiedad.precio}"
                                    data-name="${propiedad.nombre}">
                                <i class="bi bi-credit-card me-1"></i> Rentar con PayPal
                            </button>
                            ` : `
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="bi bi-lock me-1"></i> No disponible
                            </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            `;
        });
        
        propertyList.innerHTML = html;
        
        // Agregar event listeners para los botones de detalles
        document.querySelectorAll('.ver-detalles').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                mostrarDetallesPropiedad(propiedadId);
            });
        });
        
        // Configurar botones de PayPal solo para propiedades disponibles
        document.querySelectorAll('.btn-rentar').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                const precio = this.getAttribute('data-price');
                const nombre = this.getAttribute('data-name');
                iniciarProcesoPago(propiedadId, precio, nombre);
            });
        });
    }
    
    function iniciarProcesoPago(propiedadId, precio, nombre) {
        // Verificar si existe algún modal previo y eliminarlo
        const modalExistente = document.getElementById('pagoModal');
        if (modalExistente) {
            const modalInstance = bootstrap.Modal.getInstance(modalExistente);
            if (modalInstance) modalInstance.dispose();
            modalExistente.remove();
        }
        
        // Crear modal para el pago con diseño mejorado
        const modalHtml = `
        <div class="modal fade" id="pagoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title"><i class="bi bi-credit-card me-2"></i>Rentar propiedad</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-flex align-items-center mb-4 p-3 bg-light rounded">
                            <i class="bi bi-house-door fs-1 text-primary me-3"></i>
                            <div>
                                <h5 class="mb-1">${nombre}</h5>
                                <p class="mb-0 fw-bold">Precio: $${parseFloat(precio).toLocaleString('es-MX')} MXN</p>
                            </div>
                        </div>
                        <div id="paypal-button-container" class="my-4"></div>
                        <div class="alert alert-info">
                            <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>Modo de prueba</h6>
                            <p class="mb-1">Usa los siguientes datos:</p>
                            <ul class="mb-0">
                                <li>Email: sb-43aoes28379307@personal.example.com</li>
                                <li>Contraseña: 12345678</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
        
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal
        const pagoModal = new bootstrap.Modal(document.getElementById('pagoModal'));
        pagoModal.show();
        
        // Limpiar y renderizar botón de PayPal una sola vez
        const paypalContainer = document.getElementById('paypal-button-container');
        paypalContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
        
        // Renderizar botón de PayPal
        paypal.Buttons({
            style: {
                color: 'blue',
                shape: 'rect',
                label: 'pay'
            },
            // Configuración para crear una orden
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: `Renta de: ${nombre}`,
                        amount: {
                            value: precio
                        }
                    }]
                });
            },
            // Capturar el pago cuando se completa
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(orderData) {
                    // Registrar la transacción en el servidor
                    registrarTransaccion(propiedadId, orderData)
                        .then(response => {
                            // Mostrar mensaje de éxito
                            Swal.fire({
                                icon: 'success',
                                title: '¡Pago completado!',
                                text: 'Has rentado esta propiedad con éxito',
                                confirmButtonColor: '#3085d6'
                            }).then(() => {
                                // Cerrar el modal de pago
                                const pagoModal = bootstrap.Modal.getInstance(document.getElementById('pagoModal'));
                                if (pagoModal) pagoModal.hide();
                                // Recargar la página para mostrar los cambios
                                window.location.reload();
                            });
                        })
                        .catch(error => {
                            console.error("Error al registrar la transacción:", error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Hubo un problema al registrar tu pago. El pago se realizó pero hubo un error interno.',
                                confirmButtonColor: '#3085d6'
                            });
                        });
                });
            },
            // Manejar errores
            onError: function(err) {
                console.error('Error en el pago:', err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error en el pago',
                    text: 'Ha ocurrido un error al procesar el pago',
                    confirmButtonColor: '#3085d6'
                });
            }
        }).render('#paypal-button-container');
        
        // Evento para limpiar cuando el modal se cierra
        document.getElementById('pagoModal').addEventListener('hidden.bs.modal', function () {
            // Eliminar el modal del DOM al cerrarse para evitar duplicados
            setTimeout(() => {
                this.remove();
            }, 300);
        });
    }
    
    async function registrarTransaccion(propiedadId, orderData) {
        try {
            // Usar la función getToken() del api-helper.js en lugar de authToken
            const token = window.getToken ? window.getToken() : null;
            
            // Datos de la transacción
            const transaccionData = {
                propiedad_id: propiedadId,
                orden_id: orderData.id,
                monto: orderData.purchase_units[0].amount.value,
                estado: orderData.status
            };
            
            // Configurar headers con o sin token
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Enviar petición
            const response = await fetch('/api/transacciones', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(transaccionData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar la transacción');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error en registrarTransaccion:', error);
            throw error;
        }
    }
    
    // Función para mostrar el modal con detalles
    async function mostrarDetallesPropiedad(propiedadId) {
        try {
            // Usar la ruta correcta según tu API
            const response = await fetch(`/api/propiedades/${propiedadId}`);
            if (!response.ok) throw new Error('Error al cargar los detalles');
            
            const data = await response.json();
            const propiedad = data.propiedad;

            // Actualizar el contenido del modal con los datos de la propiedad
            document.getElementById('detalles-nombre').textContent = propiedad.nombre;
            document.getElementById('detalles-direccion').textContent = propiedad.direccion;
            document.getElementById('detalles-descripcion').textContent = propiedad.descripcion;
            document.getElementById('detalles-precio').textContent = parseFloat(propiedad.precio).toLocaleString('es-MX');
            
            // Configurar estado de disponibilidad
            const disponibleEl = document.getElementById('detalles-disponible');
            const estaDisponible = propiedad.disponible === 1 || propiedad.disponible === true;
            disponibleEl.innerHTML = estaDisponible ?
                '<span class="badge bg-success">Disponible</span>' :
                '<span class="badge bg-danger">No disponible</span>';
            
            // Configurar enlace para contacto
            const correoEl = document.getElementById('detalles-correo');
            const correoLink = document.getElementById('detalles-correo-link');
            
            // Obtener información del propietario
            const propietarioResponse = await fetch(`/api/usuario/${propiedad.id_propietario}`);
            if (propietarioResponse.ok) {
                const propietarioData = await propietarioResponse.json();
                correoEl.textContent = propietarioData.usuario.correo;
                correoLink.href = `mailto:${propietarioData.usuario.correo}`;
            }
            
            // Configurar el carrusel de imágenes
            const carouselInner = document.getElementById('carousel-inner-detalles');
            carouselInner.innerHTML = ''; // Limpiar contenido previo
            
            // Comprobar si la imagen es una URL o un array
            const imagenes = typeof propiedad.imagen === 'string' ?
                [propiedad.imagen] :
                JSON.parse(propiedad.imagen);

            // Agregar cada imagen al carrusel
            imagenes.forEach((img, index) => {
                const divItem = document.createElement('div');
                divItem.classList.add('carousel-item');
                if (index === 0) divItem.classList.add('active');
                
                divItem.innerHTML = `
                    <img src="${img}" class="d-block w-100" alt="Imagen de propiedad" style="height: 300px; object-fit: cover;">
                `;
                carouselInner.appendChild(divItem);
            });
            
            // Configurar botón de rentar dentro del modal
            const btnRentarModal = document.getElementById('btn-rentar-modal');
            if (estaDisponible) {
                btnRentarModal.style.display = 'block';
                btnRentarModal.onclick = function() {
                    // Cerrar el modal de detalles
                    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('verDetallesModal'));
                    detailsModal.hide();
                    
                    // Abrir el modal de pago
                    iniciarProcesoPago(propiedad.id, propiedad.precio, propiedad.nombre);
                };
            } else {
                btnRentarModal.style.display = 'none';
            }
            
            // Mostrar el modal
            const modal = new bootstrap.Modal(document.getElementById('verDetallesModal'));
            modal.show();

            // Inicializar el mapa cuando el modal esté completamente visible
            document.getElementById('verDetallesModal').addEventListener('shown.bs.modal', function() {
                inicializarMapaDetalles(propiedad.direccion);
            }, { once: true });
            
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los detalles de la propiedad',
                confirmButtonColor: 'var(--bs-primary)'
            });
        }
    }
    
    async function inicializarMapaDetalles(direccion) {
        try {
            // Obtener token de Mapbox desde el servidor
            const tokenResponse = await fetch('/api/mapbox-token');
            const tokenData = await tokenResponse.json();
            const mapboxToken = tokenData.token;

            // Configurar Mapbox con el token
            mapboxgl.accessToken = mapboxToken;
            
            // Crear el mapa
            window.detallesMap = new mapboxgl.Map({
                container: 'mapa-detalles',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-99.1332, 19.4326], // Centro inicial (CDMX)
                zoom: 12
            });

            // Añadir controles de navegación
            window.detallesMap.addControl(new mapboxgl.NavigationControl());
            
            // Si hay una dirección, geocodificarla
            if (direccion) {
                // Esperar a que el mapa cargue antes de hacer la geocodificación
                window.detallesMap.on('load', function() {
                    // Crear geocoder fuera del evento load
                    const geocoder = new MapboxGeocoder({
                        accessToken: mapboxToken,
                        mapboxgl: mapboxgl,
                        marker: false // No mostrar marcador del geocoder
                    });
                    
                    // Usar setTimeout para asegurar que el mapa esté completamente listo
                    setTimeout(() => {
                        // Usar el servicio de geocodificación directamente
                        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json?access_token=${mapboxToken}&limit=1`)
                            .then(response => response.json())
                            .then(data => {
                                if (data.features && data.features.length > 0) {
                                    const coords = data.features[0].center;

                                    // Centrar mapa en las coordenadas encontradas
                                    window.detallesMap.flyTo({
                                        center: coords,
                                        zoom: 15,
                                        essential: true
                                    });
                                    
                                    // Añadir marcador
                                    new mapboxgl.Marker({color: '#FF0000'})
                                        .setLngLat(coords)
                                        .addTo(window.detallesMap);
                                }
                            })
                            .catch(error => {
                                console.error("Error en la geocodificación:", error);
                            });
                    }, 500); // Pequeño retraso para asegurar que el mapa esté listo
                });
            }
        } catch (error) {
            console.error('Error al inicializar mapa:', error);
            document.getElementById('mapa-detalles').innerHTML =
                '<div class="alert alert-warning">No se pudo cargar el mapa</div>';
        }
    }
    
    // Función para obtener datos del propietario
    async function obtenerDatosPropietario(propietarioId) {
        try {
            // Puedes crear un nuevo endpoint en el servidor para esto o usar uno existente
            const response = await fetch(`/api/usuario/${propietarioId}`);
            
            if (response.ok) {
                const data = await response.json();
                return data.usuario;
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener datos del propietario:', error);
            return null;
        }
    }
    
    // Función para contactar al propietario (ejemplo)
    function contactarPropietario(propiedadId) {
        // Obtener el token del localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
            alert('Debe iniciar sesión para contactar al propietario');
            window.location.replace('/login');
            return;
        }

        // Aquí implementarías la lógica para contactar al propietario
        // Por ejemplo, podrías abrir un modal con un formulario de contacto
        alert(`Función de contacto para la propiedad ${propiedadId}. Esta función será implementada próximamente.`);
    }

    // Botón para publicar nueva propiedad con mejor diseño
    const agregarBtnContainer = document.createElement('div');
    agregarBtnContainer.className = 'text-end';
    agregarBtnContainer.innerHTML = `
        <button id="agregar-propiedad" class="btn btn-success">
            <i class="bi bi-plus-circle"></i> Publicar nueva propiedad
        </button>
    `;

    // Configurar el contenedor de publicar propiedad
    if (estaAutenticado()) {
        const publicarContainer = document.getElementById('publicar-container');
        if (publicarContainer) {
            publicarContainer.appendChild(agregarBtnContainer);
            
            // Agregar event listener al botón
            document.getElementById('agregar-propiedad').addEventListener('click', function() {
                window.location.replace('/publicar');
            });
        }
    }

    // Actualizar la interfaz si el estado de autenticación cambia
    window.addEventListener('storage', function(event) {
        if (event.key === 'authToken' || event.key === 'usuarioData') {
            // Recargar la página para actualizar los elementos basados en la autenticación
            window.location.reload();
        }
    });

    // Cargar propiedades al iniciar
    cargarPropiedades();
});