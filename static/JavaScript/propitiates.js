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
                            <button class="btn btn-primary ver-detalles w-100" data-id="${propiedad.id}">
                                <i class="bi bi-eye me-1"></i> Ver detalles
                            </button>on class="btn btn-outline-primary flex-grow-1 ver-detalles" data-id="${propiedad.id}">
                            ${estaDisponible ? ` bi-info-circle me-1"></i> Detalles
                            <button class="btn btn-success btn-rentar w-100" 
                                    data-id="${propiedad.id}" 
                                    data-price="${propiedad.precio}" row-1 btn-rentar" 
                                    data-name="${propiedad.nombre}">
                                <i class="bi bi-credit-card me-1"></i> Rentar con PayPal
                            </button>   data-name="${propiedad.nombre}">
                            ` : `   <i class="bi bi-credit-card me-1"></i> Rentar
                            <button class="btn btn-secondary w-100" disabled>
                                <i class="bi bi-lock me-1"></i> No disponible
                            </button>on class="btn btn-secondary flex-grow-1" disabled>
                            `}      <i class="bi bi-lock me-1"></i> No disponible
                        </div>  </button>
                    </div>      `}
                </div>      </div>
            </div>      </div>
            `;      </div>
        });     </div>
            </div>
        propertyList.innerHTML = html;
        });
        // Agregar event listeners para los botones de detalles
        document.querySelectorAll('.ver-detalles').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                mostrarDetallesPropiedad(propiedadId);Each(button => {
            });ton.addEventListener('click', function() {
        });     const propiedadId = this.getAttribute('data-id');
                mostrarDetallesPropiedad(propiedadId);
        // Configurar botones de PayPal solo para propiedades disponibles
        document.querySelectorAll('.btn-rentar').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');ponibles
                const precio = this.getAttribute('data-price'); => {
                const nombre = this.getAttribute('data-name');
                iniciarProcesoPago(propiedadId, precio, nombre);;
            }); const precio = this.getAttribute('data-price');
        });     const nombre = this.getAttribute('data-name');
    }           iniciarProcesoPago(propiedadId, precio, nombre);
            });
    function iniciarProcesoPago(propiedadId, precio, nombre) {
        // Eliminar la verificación de autenticación al inicio
        // Continuar directamente con el proceso de pago
    function iniciarProcesoPago(propiedadId, precio, nombre) {
        // Verificar si existe algún modal previo y eliminarlo
        const modalExistente = document.getElementById('pagoModal');
        if (modalExistente) {
            const modalInstance = bootstrap.Modal.getInstance(modalExistente);
            if (modalInstance) modalInstance.dispose();'pagoModal');
            modalExistente.remove();
        }   const modalInstance = bootstrap.Modal.getInstance(modalExistente);
            if (modalInstance) modalInstance.dispose();
        // Crear modal para el pago con diseño mejorado
        const modalHtml = `
        <div class="modal fade" id="pagoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">n diseño mejorado
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">dden="true">
                        <h5 class="modal-title">Rentar propiedad</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>lass="modal-header bg-success text-white">
                    <div class="modal-body">le"><i class="bi bi-credit-card me-2"></i>Rentar propiedad</h5>
                        <div class="d-flex align-items-center mb-4">lose-white" data-bs-dismiss="modal" aria-label="Close"></button>
                            <i class="bi bi-house-door fs-1 text-primary me-3"></i>
                            <div>odal-body">
                                <h5 class="mb-1">${nombre}</h5>b-4 p-3 bg-light rounded">
                                <p class="mb-0 fw-bold">Precio: $${parseFloat(precio).toLocaleString('es-MX')} MXN</p>
                            </div>
                        </div>  <h5 class="mb-1">${nombre}</h5>
                        <div id="paypal-button-container" class="my-4"></div>(precio).toLocaleString('es-MX')} MXN</p>
                        <div class="alert alert-info">
                            <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>Modo de prueba</h6>
                            <p class="mb-1">Usa los siguientes datos:</p>div>
                            <ul class="mb-0">rt-info">
                                <li>Email: sb-43aoes28379307@personal.example.com</li>o de prueba</h6>
                                <li>Contraseña: 12345678</li>s datos:</p>
                            </ul>lass="mb-0">
                        </div>  <li>Email: sb-43aoes28379307@personal.example.com</li>
                    </div>      <li>Contraseña: 12345678</li>
                </div>      </ul>
            </div>      </div>
        </div>      </div>
        `;      </div>
            </div>
        // Agregar modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Mostrar modal al DOM
        const pagoModal = new bootstrap.Modal(document.getElementById('pagoModal'));
        pagoModal.show();
        // Mostrar modal
        // Limpiar y renderizar botón de PayPal una sola vezementById('pagoModal'));
        const paypalContainer = document.getElementById('paypal-button-container');
        paypalContainer.innerHTML = ''; // Limpiar el contenedor antes de renderizar
        // Limpiar y renderizar botón de PayPal una sola vez
        // Renderizar botón de PayPalent.getElementById('paypal-button-container');
        paypal.Buttons({innerHTML = ''; // Limpiar el contenedor antes de renderizar
            style: {
                color: 'blue', PayPal
                shape: 'rect',
                label: 'pay'
            },  color: 'blue',
            // Configuración para crear una orden
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{r una orden
                        description: `Renta de: ${nombre}`,
                        amount: {der.create({
                            value: precio
                        }escription: `Renta de: ${nombre}`,
                    }]  amount: {
                });         value: precio
            },          }
            // Capturar el pago cuando se completa
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(orderData) {
                    // Registrar la transacción en el servidor
                    registrarTransaccion(propiedadId, orderData)
                        .then(response => {e().then(function(orderData) {
                            // Mostrar mensaje de éxitoervidor
                            Swal.fire({n(propiedadId, orderData)
                                icon: 'success',
                                title: '¡Pago completado!',
                                text: 'Has rentado esta propiedad con éxito',
                                confirmButtonColor: '#3085d6'
                            }).then(() => {go completado!',
                                // Cerrar el modal de pagoopiedad con éxito',
                                const pagoModal = bootstrap.Modal.getInstance(document.getElementById('pagoModal'));
                                if (pagoModal) pagoModal.hide();
                                // Cerrar el modal de pago
                                // Recargar la página para mostrar los cambiosdocument.getElementById('pagoModal'));
                                window.location.reload();hide();
                            });
                        })      // Recargar la página para mostrar los cambios
                        .catch(error => {cation.reload();
                            console.error("Error al registrar la transacción:", error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',r al registrar la transacción:", error);
                                text: 'Hubo un problema al registrar tu pago. El pago se realizó pero hubo un error interno.',
                                confirmButtonColor: '#3085d6'
                            }); title: 'Error',
                        });     text: 'Hubo un problema al registrar tu pago. El pago se realizó pero hubo un error interno.',
                });             confirmButtonColor: '#3085d6'
            },              });
            // Manejar errores
            onError: function(err) {
                console.error('Error en el pago:', err);
                Swal.fire({res
                    icon: 'error', {
                    title: 'Error en el pago',o:', err);
                    text: 'Ha ocurrido un error al procesar el pago',
                    confirmButtonColor: '#3085d6'
                }); title: 'Error en el pago',
            }       text: 'Ha ocurrido un error al procesar el pago',
        }).render('#paypal-button-container');d6'
                });
        // Evento para limpiar cuando el modal se cierra
        document.getElementById('pagoModal').addEventListener('hidden.bs.modal', function () {
            // Eliminar el modal del DOM al cerrarse para evitar duplicados
            setTimeout(() => { cuando el modal se cierra
                this.remove();d('pagoModal').addEventListener('hidden.bs.modal', function () {
            }, 300);nar el modal del DOM al cerrarse para evitar duplicados
        }); setTimeout(() => {
    }           this.remove();
            }, 300);
    async function registrarTransaccion(propiedadId, orderData) {
        try {
            // Usar la función getToken() del api-helper.js en lugar de authToken
            const token = window.getToken();iedadId, orderData) {
        try {
            // Datos de la transacciónn() del api-helper.js en lugar de authToken
            const transaccionData = {oken();
                propiedad_id: propiedadId,
                orden_id: orderData.id,
                monto: orderData.purchase_units[0].amount.value,
                estado: orderData.statusd,
            };  orden_id: orderData.id,
                monto: orderData.purchase_units[0].amount.value,
            // Configurar headers con o sin token
            const headers = {
                'Content-Type': 'application/json'
            }; Configurar headers con o sin token
            const headers = {
            if (token) {-Type': 'application/json'
                headers['Authorization'] = `Bearer ${token}`;
            }
            if (token) {
            // Enviar peticiónrization'] = `Bearer ${token}`;
            const response = await fetch('/api/transacciones', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(transaccionData)cciones', {
            }); method: 'POST',
                headers: headers,
            if (!response.ok) {ngify(transaccionData)
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar la transacción');
            }f (!response.ok) {
                const errorData = await response.json();
            return await response.json();.message || 'Error al registrar la transacción');
        } catch (error) {
            console.error('Error en registrarTransaccion:', error);
            throw error; response.json();
        } catch (error) {
    }       console.error('Error en registrarTransaccion:', error);
            throw error;
    // Función para mostrar el modal con detalles
    async function mostrarDetallesPropiedad(propiedadId) {
        try {
            // Usar la ruta correcta según tu API
            const response = await fetch(`/api/propiedades/${propiedadId}`);
            if (!response.ok) throw new Error('Error al cargar los detalles');
            // Usar la ruta correcta según tu API
            const data = await response.json();propiedades/${propiedadId}`);
            const propiedad = data.propiedad;('Error al cargar los detalles');

            // Actualizar el contenido del modal con los datos de la propiedad
            document.getElementById('detalles-nombre').textContent = propiedad.nombre;
            document.getElementById('detalles-direccion').textContent = propiedad.direccion;
            document.getElementById('detalles-descripcion').textContent = propiedad.descripcion;
            document.getElementById('detalles-precio').textContent = parseFloat(propiedad.precio).toLocaleString('es-MX');
            document.getElementById('detalles-direccion').textContent = propiedad.direccion;
            // Configurar estado de disponibilidadripcion').textContent = propiedad.descripcion;
            const disponibleEl = document.getElementById('detalles-disponible');recio.toFixed(2);
            const estaDisponible = propiedad.disponible === 1 || propiedad.disponible === true;
            disponibleEl.innerHTML = estaDisponible ?
                '<span class="badge bg-success">Disponible</span>' :sponible');
                '<span class="badge bg-danger">No disponible</span>';            disponibleEl.innerHTML = propiedad.disponible ?
">Disponible</span>' :
            // Configurar enlace para contacto
            const correoEl = document.getElementById('detalles-correo');
            const correoLink = document.getElementById('detalles-correo-link');            // Configurar enlace para contacto
Id('detalles-correo');
            // Obtener información del propietario
            const propietarioResponse = await fetch(`/api/usuario/${propiedad.id_propietario}`);
            if (propietarioResponse.ok) {
                const propietarioData = await propietarioResponse.json();opiedad.id_propietario}`);
                correoEl.textContent = propietarioData.usuario.correo;
                correoLink.href = `mailto:${propietarioData.usuario.correo}`;   const propietarioData = await propietarioResponse.json();
            }                correoEl.textContent = propietarioData.usuario.correo;
etarioData.usuario.correo}`;
            // Configurar el carrusel de imágenes
            const carouselInner = document.getElementById('carousel-inner-detalles');
            carouselInner.innerHTML = ''; // Limpiar contenido previo            // Configurar el carrusel de imágenes
carousel-inner-detalles');
            // Comprobar si la imagen es una URL o un arrayio
            const imagenes = typeof propiedad.imagen === 'string' ?
                [propiedad.imagen] :URL o un array
                JSON.parse(propiedad.imagen);            const imagenes = typeof propiedad.imagen === 'string' ?

            // Agregar cada imagen al carrusel
            imagenes.forEach((img, index) => {
                const divItem = document.createElement('div');
                divItem.classList.add('carousel-item');
                if (index === 0) divItem.classList.add('active');                const divItem = document.createElement('div');
('carousel-item');
                divItem.innerHTML = `
                <img src="${img}" class="d-block w-100" alt="Imagen de propiedad" style="height: 300px; object-fit: cover;">
            `;
                carouselInner.appendChild(divItem); <img src="${img}" class="d-block w-100" alt="Imagen de propiedad" style="height: 300px; object-fit: cover;">
            });            `;
ppendChild(divItem);
            // Configurar botón de rentar dentro del modal
            const btnRentarModal = document.getElementById('btn-rentar-modal');
            if (estaDisponible) {            // Mostrar el modal
                btnRentarModal.style.display = 'block';allesModal'));
                btnRentarModal.onclick = function() {
                    // Cerrar el modal de detalles
                    const detailsModal = bootstrap.Modal.getInstance(document.getElementById('verDetallesModal'));apa cuando el modal esté completamente visible
                    detailsModal.hide();            document.getElementById('verDetallesModal').addEventListener('shown.bs.modal', function() {
                    arMapaDetalles(propiedad.direccion);
                    // Abrir el modal de pago
                    iniciarProcesoPago(propiedad.id, propiedad.precio, propiedad.nombre);
                };
            } else {r:', error);
                btnRentarModal.style.display = 'none';
            }
 title: 'Error',
            // Mostrar el modal       text: 'No se pudieron cargar los detalles de la propiedad',
            const modal = new bootstrap.Modal(document.getElementById('verDetallesModal'));           confirmButtonColor: 'var(--bs-primary)'
            modal.show();            });

            // Inicializar el mapa cuando el modal esté completamente visible
            document.getElementById('verDetallesModal').addEventListener('shown.bs.modal', function() {
                inicializarMapaDetalles(propiedad.direccion);
            }, { once: true });
servidor
        } catch (error) {            const tokenResponse = await fetch('/api/mapbox-token');
            console.error('Error:', error);onse.json();
            Swal.fire({;
                icon: 'error',
                title: 'Error',pbox con el token
                text: 'No se pudieron cargar los detalles de la propiedad',
                confirmButtonColor: 'var(--bs-primary)'
            });
        }
    }r: 'mapa-detalles',
 style: 'mapbox://styles/mapbox/streets-v12',
    async function inicializarMapaDetalles(direccion) {                center: [-99.1332, 19.4326], // Centro inicial (CDMX)
        try {
            // Obtener token de Mapbox desde el servidor
            const tokenResponse = await fetch('/api/mapbox-token');
            const tokenData = await tokenResponse.json();
            const mapboxToken = tokenData.token;ap.addControl(new mapboxgl.NavigationControl());

            // Configurar Mapbox con el token
            mapboxgl.accessToken = mapboxToken;
hacer la geocodificación
            // Crear el mapaction() {
            window.detallesMap = new mapboxgl.Map({ del evento load
                container: 'mapa-detalles',
                style: 'mapbox://styles/mapbox/streets-v12', accessToken: mapboxToken,
                center: [-99.1332, 19.4326], // Centro inicial (CDMX)                        mapboxgl: mapboxgl,
                zoom: 12
            });

            // Añadir controles de navegación
            window.detallesMap.addControl(new mapboxgl.NavigationControl());
 de geocodificación directamente
            // Si hay una dirección, geocodificarla/${encodeURIComponent(direccion)}.json?access_token=${mapboxToken}&limit=1`)
            if (direccion) {
                // Esperar a que el mapa cargue antes de hacer la geocodificación                            .then(data => {
                window.detallesMap.on('load', function() {
                    // Crear geocoder fuera del evento loades[0].center;
                    const geocoder = new MapboxGeocoder({
                        accessToken: mapboxToken,pa en las coordenadas encontradas
                        mapboxgl: mapboxgl,flyTo({
                        marker: false // No mostrar marcador del geocoder center: coords,
                    });                                        zoom: 15,
e
                    // Usar setTimeout para asegurar que el mapa esté completamente listo
                    setTimeout(() => {
                        // Usar el servicio de geocodificación directamente
                        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json?access_token=${mapboxToken}&limit=1`)   new mapboxgl.Marker({color: '#FF0000'})
                            .then(response => response.json())          .setLngLat(coords)
                            .then(data => {o(window.detallesMap);
                                if (data.features && data.features.length > 0) {
                                    const coords = data.features[0].center;

                                    // Centrar mapa en las coordenadas encontradas             console.error("Error en la geocodificación:", error);
                                    window.detallesMap.flyTo({               });
                                        center: coords,0); // Pequeño retraso para asegurar que el mapa esté listo
                                        zoom: 15,
                                        essential: true
                                    });
   console.error('Error al inicializar mapa:', error);
                                    // Añadir marcador       document.getElementById('mapa-detalles').innerHTML =
                                    new mapboxgl.Marker({color: '#FF0000'})                '<div class="alert alert-warning">No se pudo cargar el mapa</div>';
                                        .setLngLat(coords)
                                        .addTo(window.detallesMap);
                                }
                            })
                            .catch(error => {
                                console.error("Error en la geocodificación:", error);        try {
                            }); nuevo endpoint en el servidor para esto o usar uno existente
                    }, 500); // Pequeño retraso para asegurar que el mapa esté listorio/${propietarioId}`);
                });
            }f (response.ok) {
        } catch (error) {                const data = await response.json();
            console.error('Error al inicializar mapa:', error);ata.usuario;
            document.getElementById('mapa-detalles').innerHTML =
                '<div class="alert alert-warning">No se pudo cargar el mapa</div>';
        }
    } catch (error) {
       console.error('Error al obtener datos del propietario:', error);
    // Función para obtener datos del propietario            return null;
    async function obtenerDatosPropietario(propietarioId) {
        try {
            // Puedes crear un nuevo endpoint en el servidor para esto o usar uno existente
            const response = await fetch(`/api/usuario/${propietarioId}`);
    function contactarPropietario(propiedadId) {
            if (response.ok) { token del localStorage
                const data = await response.json();
                return data.usuario;
            } {
   alert('Debe iniciar sesión para contactar al propietario');
            return null;            window.location.replace('/login');
        } catch (error) {
            console.error('Error al obtener datos del propietario:', error);
            return null;
        }   // Aquí implementarías la lógica para contactar al propietario
    }        // Por ejemplo, podrías abrir un modal con un formulario de contacto
iedadId}. Esta función será implementada próximamente.`);
    // Función para contactar al propietario (ejemplo)
    function contactarPropietario(propiedadId) {
        // Obtener el token del localStorageiedad con mejor diseño
        const token = localStorage.getItem('authToken');

        if (!token) {tainer.innerHTML = `
            alert('Debe iniciar sesión para contactar al propietario');  <button id="agregar-propiedad" class="btn btn-success">
            window.location.replace('/login');            <i class="bi bi-plus-circle"></i> Publicar nueva propiedad
            return;
        }

        // Aquí implementarías la lógica para contactar al propietariode publicar propiedad
        // Por ejemplo, podrías abrir un modal con un formulario de contacto
        alert(`Función de contacto para la propiedad ${propiedadId}. Esta función será implementada próximamente.`);t publicarContainer = document.getElementById('publicar-container');
    }

    // Botón para publicar nueva propiedad con mejor diseño
    const agregarBtnContainer = document.createElement('div');Agregar event listener al botón
    agregarBtnContainer.className = 'text-end';   document.getElementById('agregar-propiedad').addEventListener('click', function() {
    agregarBtnContainer.innerHTML = `           window.location.replace('/publicar');
        <button id="agregar-propiedad" class="btn btn-success">            });
            <i class="bi bi-plus-circle"></i> Publicar nueva propiedad
        </button>
    `;

    // Configurar el contenedor de publicar propiedad
    if (estaAutenticado()) {
        const publicarContainer = document.getElementById('publicar-container');
        if (publicarContainer) {, function(event) {
            publicarContainer.appendChild(agregarBtnContainer);f (event.key === 'authToken' || event.key === 'usuarioData') {
                 // Recargar la página para actualizar los elementos basados en la autenticación
            // Agregar event listener al botón         window.location.reload();

















});    });        }            window.location.reload();            // Recargar la página para actualizar los elementos basados en la autenticación        if (event.key === 'authToken' || event.key === 'usuarioData') {    window.addEventListener('storage', function(event) {    // Actualizar la interfaz si el estado de autenticación cambia    cargarPropiedades();    // Cargar propiedades al iniciar    }        }            });                window.location.replace('/publicar');            document.getElementById('agregar-propiedad').addEventListener('click', function() {        }
    });
});