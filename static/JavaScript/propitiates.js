document.addEventListener('DOMContentLoaded', function() {
    const propertyList = document.getElementById('property-list');
    const editarPropiedadForm = document.getElementById('editar-propiedad-form');

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
            propertyList.innerHTML = '<div class="col-12 text-center">No hay propiedades disponibles</div>';
            return;
        }

        let html = '';
        propiedades.forEach(propiedad => {
            html += `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <img src="${propiedad.imagen || '/static/imgs/default-property.jpg'}" class="card-img-top" alt="${propiedad.nombre}">
                    <div class="card-body">
                        <h5 class="card-title">${propiedad.nombre}</h5>
                        <p class="card-text">${propiedad.direccion}</p>
                        <p class="card-text">${propiedad.descripcion}</p>
                        <p class="card-text"><strong>Precio:</strong> $${propiedad.precio}</p>
                        <button class="btn btn-primary ver-detalles" data-id="${propiedad.id}">Ver detalles</button>
                        ${estaAutenticado() ? `
                        <div class="mt-2">
                            <button class="btn btn-outline-success contactar" data-id="${propiedad.id}">Contactar</button>
                        </div>` : ''}
                    </div>
                </div>
            </div>
            `;
        });

        propertyList.innerHTML = html;

        // Agregar event listeners para los botones de detalles
        document.querySelectorAll('.ver-detalles').forEach(button => {
            button.addEventListener('click', async function() {
                const propiedadId = this.getAttribute('data-id');
                mostrarDetallesPropiedad(propiedadId);
            });
        });

        // Agregar event listeners para los botones de contactar (solo para usuarios autenticados)
        if (estaAutenticado()) {
            document.querySelectorAll('.contactar').forEach(button => {
                button.addEventListener('click', function() {
                    const propiedadId = this.getAttribute('data-id');
                    contactarPropietario(propiedadId);
                });
            });
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
            document.getElementById('detalles-precio').textContent = propiedad.precio.toFixed(2);

            // Configurar estado de disponibilidad
            const disponibleEl = document.getElementById('detalles-disponible');
            disponibleEl.innerHTML = propiedad.disponible ?
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

    // Botón para publicar nueva propiedad (solo visible para usuarios autenticados)
    const agregarBtnContainer = document.createElement('div');
    agregarBtnContainer.className = 'text-end mb-3';
    agregarBtnContainer.innerHTML = `
        <button id="agregar-propiedad" class="btn btn-success">
            <i class="bi bi-plus-circle"></i> Publicar nueva propiedad
        </button>
    `;

    // Insertar el botón antes de la lista de propiedades si el usuario está autenticado
    if (estaAutenticado()) {
        const container = propertyList.parentElement;
        container.insertBefore(agregarBtnContainer, propertyList);

        // Agregar event listener al botón
        document.getElementById('agregar-propiedad').addEventListener('click', function() {
            window.location.replace('/publicar');
        });
    }

    // Cargar propiedades al iniciar
    cargarPropiedades();

    // Actualizar la interfaz si el estado de autenticación cambia
    window.addEventListener('storage', function(event) {
        if (event.key === 'authToken' || event.key === 'usuarioData') {
            // Recargar la página para actualizar los elementos basados en la autenticación
            window.location.reload();
        }
    });
});