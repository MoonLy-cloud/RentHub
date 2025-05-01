document.addEventListener('DOMContentLoaded', function() {
    // Referencias globales para el mapa
    window.map = null;
    window.marker = null;
    window.geocoder = null;

    // Verificar autenticación usando auth.js
    verificarAutenticacion().then(autenticado => {
        if (!autenticado) {
            Swal.fire({
                icon: 'warning',
                title: 'Sesión requerida',
                text: 'Debes iniciar sesión para publicar una propiedad',
                confirmButtonColor: '#0d6efd'
            }).then(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
        }
    });

    // Inicializar mapa
    inicializarMapa();

    // Botón para usar ubicación actual del usuario
    document.getElementById('btn-ubicacion-actual').addEventListener('click', function() {
        Swal.fire({
            title: 'Obteniendo ubicación',
            text: 'Por favor espere mientras obtenemos su ubicación...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                posicion => {
                    const lat = posicion.coords.latitude;
                    const lng = posicion.coords.longitude;
                    
                    // Actualizar mapa con la posición exacta
                    actualizarUbicacionEnMapa(lng, lat);
                    Swal.close();
                },
                error => {
                    Swal.close();
                    manejarErrorUbicacion(error);
                },
                {
                    enableHighAccuracy: true,  // Alta precisión
                    timeout: 10000,  // 10 segundos de timeout
                    maximumAge: 0  // No usar posiciones en caché
                }
            );
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Geolocalización no soportada',
                text: 'Tu navegador no soporta la geolocalización'
            });
        }
    });

    // Botón para refinar manualmente la ubicación
    document.getElementById('btn-refinar-ubicacion').addEventListener('click', function() {
        const lat = document.getElementById('latitud').value;
        const lng = document.getElementById('longitud').value;
        
        if (!lat || !lng) {
            Swal.fire({
                icon: 'warning',
                title: 'Ubicación no seleccionada',
                text: 'Primero selecciona una ubicación en el mapa'
            });
            return;
        }
        
        Swal.fire({
            title: 'Ajustar ubicación',
            html: `
                <div class="mb-3">
                    <label class="form-label">Latitud</label>
                    <input id="swal-input-lat" class="form-control" type="number" step="0.0000001" value="${lat}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Longitud</label>
                    <input id="swal-input-lng" class="form-control" type="number" step="0.0000001" value="${lng}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            preConfirm: () => {
                const newLat = document.getElementById('swal-input-lat').value;
                const newLng = document.getElementById('swal-input-lng').value;
                
                if (!newLat || !newLng) {
                    Swal.showValidationMessage('Debes ingresar valores válidos');
                    return false;
                }
                
                return {
                    lat: parseFloat(newLat),
                    lng: parseFloat(newLng)
                };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                actualizarUbicacionEnMapa(result.value.lng, result.value.lat);
            }
        });
    });

    // Inicializar el mapa con Mapbox
    async function inicializarMapa() {
        try {
            // Obtener token de MapBox
            const response = await fetch('/api/mapbox-token');
            const data = await response.json();
            const mapboxToken = data.token;

            // Inicializar el mapa
            mapboxgl.accessToken = mapboxToken;
            window.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [-99.1332, 19.4326], // Centro de México por defecto
                zoom: 13,
                language: 'es'
            });

            // Añadir controles al mapa
            window.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
            window.map.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
            window.map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
            
            // Geocodificador para búsqueda de direcciones
            window.geocoder = new MapboxGeocoder({
                accessToken: mapboxgl.accessToken,
                mapboxgl: mapboxgl,
                marker: false,
                countries: 'mx', // Limitar búsqueda a México
                language: 'es', // Resultados en español
                placeholder: 'Buscar dirección (calle, colonia, ciudad...)',
                zoom: 15,
                flyTo: true
            });
            
            document.getElementById('geocoder').appendChild(window.geocoder.onAdd(window.map));

            // Crear marcador arrastrables
            window.marker = new mapboxgl.Marker({
                draggable: true,
                color: '#0d6efd'
            });

            // Evento cuando el geocodificador encuentra un resultado
            window.geocoder.on('result', function(e) {
                const coords = e.result.center;
                actualizarUbicacionConMarcador(coords[0], coords[1]);
            });

            // Evento cuando el mapa carga
            window.map.on('load', function() {
                // Añadir capa de geocodificación inversa (para obtener dirección al hacer clic)
                window.map.on('click', function(e) {
                    actualizarUbicacionConMarcador(e.lngLat.lng, e.lngLat.lat);
                });
            });

            // Evento cuando se arrastra el marcador
            window.marker.on('dragend', function() {
                const lngLat = window.marker.getLngLat();
                document.getElementById('latitud').value = lngLat.lat.toFixed(7);
                document.getElementById('longitud').value = lngLat.lng.toFixed(7);
                obtenerDireccionDesdeCoords(lngLat.lng, lngLat.lat);
            });

        } catch (error) {
            console.error("Error al inicializar mapa:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error al cargar el mapa',
                text: 'No se pudo inicializar el mapa. Por favor, intenta recargar la página.'
            });
        }
    }

    // Función para actualizar la ubicación con un marcador
    function actualizarUbicacionConMarcador(lng, lat) {
        // Validar coordenadas
        if (!isValidCoordinate(lng, lat)) {
            Swal.fire({
                icon: 'error',
                title: 'Coordenadas inválidas',
                text: 'Las coordenadas proporcionadas no son válidas'
            });
            return;
        }

        // Establecer el marcador en el mapa
        window.marker.setLngLat([lng, lat]).addTo(window.map);
        
        // Actualizar campos ocultos con las coordenadas
        document.getElementById('latitud').value = lat.toFixed(7);
        document.getElementById('longitud').value = lng.toFixed(7);
        
        // Obtener la dirección a partir de las coordenadas
        obtenerDireccionDesdeCoords(lng, lat);
        
        // Centrar el mapa en la ubicación
        window.map.flyTo({
            center: [lng, lat],
            zoom: 16,
            essential: true
        });
    }

    // Función para actualizar la ubicación en el mapa
    function actualizarUbicacionEnMapa(longitude, latitude) {
        actualizarUbicacionConMarcador(longitude, latitude);
    }

    // Validar coordenadas
    function isValidCoordinate(lng, lat) {
        return (
            isFinite(lng) && isFinite(lat) &&
            lng >= -180 && lng <= 180 && 
            lat >= -90 && lat <= 90
        );
    }

    // Función para obtener dirección a partir de coordenadas
    async function obtenerDireccionDesdeCoords(lng, lat) {
        try {
            // Mostrar spinner en el indicador de dirección
            const direccionDisplay = document.getElementById('direccion-display');
            direccionDisplay.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i> Obteniendo dirección...';
            
            // Obtener token de mapbox
            const tokenResponse = await fetch('/api/mapbox-token');
            const tokenData = await tokenResponse.json();
            const mapboxToken = tokenData.token;
            
            // Construir URL para geocodificación inversa con opciones mejoradas
            const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=es&types=address,neighborhood,locality,place&limit=1`;
            
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.features && data.features.length > 0) {
                const direccion = data.features[0].place_name;
                document.getElementById('direccion').value = direccion;
                
                // Actualizar el elemento visual con la dirección
                direccionDisplay.innerHTML = `<i class="bi bi-pin-map me-2"></i> ${direccion}`;
                
                // Intentar extraer información adicional de precisión
                if (data.features[0].properties && data.features[0].properties.accuracy) {
                    console.log(`Precisión: ${data.features[0].properties.accuracy}`);
                }
                
                return direccion;
            } else {
                // Si no se encuentra dirección con MapBox, intentar con OpenStreetMap
                return obtenerDireccionAlternativa(lng, lat);
            }
        } catch (error) {
            console.error("Error al obtener dirección:", error);
            // Intentar método alternativo
            return obtenerDireccionAlternativa(lng, lat);
        }
    }

    // Función alternativa para obtener dirección usando OpenStreetMap Nominatim
    async function obtenerDireccionAlternativa(lng, lat) {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept-Language': 'es',
                    'User-Agent': 'RentHub/1.0' // Identificación para el servicio
                }
            });
            
            const data = await response.json();
            
            if (data && data.display_name) {
                const direccion = data.display_name;
                document.getElementById('direccion').value = direccion;
                
                // Actualizar el elemento visual con la dirección
                document.getElementById('direccion-display').innerHTML = `<i class="bi bi-pin-map me-2"></i> ${direccion}`;
                
                return direccion;
            } else {
                throw new Error("No se pudo obtener la dirección");
            }
        } catch (error) {
            console.error("Error con proveedor alternativo:", error);
            document.getElementById('direccion-display').innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i> No se pudo determinar la dirección. Por favor, intenta de nuevo.`;
            
            return "Dirección no disponible";
        }
    }

    // Manejar errores de geolocalización
    function manejarErrorUbicacion(error) {
        let errorMsg;
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMsg = "No has dado permiso para acceder a tu ubicación.";
                break;
            case error.POSITION_UNAVAILABLE:
                errorMsg = "La información de ubicación no está disponible.";
                break;
            case error.TIMEOUT:
                errorMsg = "La solicitud para obtener tu ubicación expiró.";
                break;
            default:
                errorMsg = "Ocurrió un error desconocido al obtener la ubicación.";
        }

        Swal.fire({
            icon: 'error',
            title: 'Error de ubicación',
            text: errorMsg
        });
    }

    // Vista previa de la imagen con mejoras
    const inputImagen = document.getElementById('imagen');
    const previewImagen = document.getElementById('image-preview');
    
    inputImagen.addEventListener('change', function(event) {
        if (this.files && this.files[0]) {
            // Validar tamaño (máximo 5MB)
            const MAX_SIZE = 5 * 1024 * 1024; // 5MB en bytes
            if (this.files[0].size > MAX_SIZE) {
                Swal.fire({
                    icon: 'error',
                    title: 'Imagen demasiado grande',
                    text: 'La imagen no debe superar los 5MB'
                });
                this.value = "";
                previewImagen.src = "";
                previewImagen.classList.remove('active');
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewImagen.src = e.target.result;
                previewImagen.classList.add('active');
                
                // Comprobar dimensiones para recomendar optimización
                const img = new Image();
                img.onload = function() {
                    if (img.width > 1920 || img.height > 1080) {
                        const optimizeButton = document.createElement('button');
                        optimizeButton.className = 'btn btn-sm btn-warning position-absolute bottom-0 end-0 m-2';
                        optimizeButton.innerHTML = '<i class="bi bi-image"></i> Optimizar';
                        optimizeButton.onclick = function(e) {
                            e.preventDefault();
                            Swal.fire({
                                icon: 'info',
                                title: 'Imagen grande detectada',
                                text: 'La imagen es muy grande. Recomendamos reducir su tamaño para mejorar el rendimiento.',
                                showCancelButton: true,
                                confirmButtonText: 'Aceptar',
                                cancelButtonText: 'Mantener original'
                            });
                        };
                        
                        const container = previewImagen.parentElement;
                        if (!container.querySelector('.btn-warning')) {
                            container.appendChild(optimizeButton);
                        }
                    }
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Manejar el envío del formulario con validaciones mejoradas
    document.getElementById('property-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validar el formulario
        if (!this.checkValidity()) {
            event.stopPropagation();
            this.classList.add('was-validated');
            
            // Mostrar mensaje de campos faltantes
            Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Por favor completa todos los campos requeridos'
            });
            return;
        }

        // Verificar si se seleccionó una ubicación
        const latitud = document.getElementById('latitud').value;
        const longitud = document.getElementById('longitud').value;
        const direccion = document.getElementById('direccion').value;

        if (!latitud || !longitud || !direccion) {
            Swal.fire({
                icon: 'error',
                title: 'Ubicación requerida',
                text: 'Por favor selecciona una ubicación en el mapa'
            });
            return;
        }

        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Sesión expirada',
                text: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.'
            }).then(() => {
                const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                loginModal.show();
            });
            return;
        }

        // Obtener valores
        const nombre = document.getElementById('nombre').value;
        const descripcion = document.getElementById('descripcion').value;
        const precio = document.getElementById('precio').value;
        const disponible = document.querySelector('input[name="disponible"]:checked').value;

        // Obtener la imagen
        const file = document.getElementById('imagen').files[0];
        if (!file) {
            Swal.fire({
                icon: 'error',
                title: 'Imagen requerida',
                text: 'Por favor selecciona una imagen para tu propiedad'
            });
            return;
        }

        // Mostrar pantalla de carga
        Swal.fire({
            title: 'Publicando propiedad',
            html: 'Estamos procesando tu información...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Convertir imagen a base64
        const reader = new FileReader();

        reader.onloadend = async function() {
            try {
                const base64Image = reader.result;

                // Crear el objeto de datos
                const payload = {
                    propiedad: {
                        nombre: nombre,
                        direccion: direccion,
                        descripcion: descripcion,
                        precio: precio,
                        imagen: base64Image,
                        disponible: disponible,
                        latitud: latitud,
                        longitud: longitud
                    }
                };

                // Enviar la solicitud al servidor
                const response = await fetch('/api/propiedades', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Propiedad publicada!',
                        text: 'Tu propiedad ha sido publicada exitosamente',
                        showCancelButton: true,
                        confirmButtonText: 'Ver mis propiedades',
                        cancelButtonText: 'Publicar otra'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/mi-perfil';
                        } else {
                            // Resetear el formulario
                            document.getElementById('property-form').reset();
                            document.getElementById('image-preview').classList.remove('active');
                            document.getElementById('image-preview').src = '';
                            document.getElementById('latitud').value = '';
                            document.getElementById('longitud').value = '';
                            document.getElementById('direccion').value = '';
                            document.getElementById('direccion-display').innerHTML = '<i class="bi bi-pin-map"></i> <span>Selecciona una ubicación en el mapa</span>';
                            
                            // Reiniciar marcador
                            if (window.marker) {
                                window.marker.remove();
                            }
                            window.map.flyTo({
                                center: [-99.1332, 19.4326],
                                zoom: 12
                            });
                        }
                    });
                } else {
                    throw new Error(data.message || 'Error al publicar la propiedad');
                }
            } catch (error) {
                console.error("Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error al publicar',
                    text: error.message || 'Ocurrió un error al publicar tu propiedad'
                });
            }
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    });

    // Clase de utilidad para spinner
    const style = document.createElement('style');
    style.textContent = `
        .spin {
            animation: spinner-border 0.75s linear infinite;
            display: inline-block;
        }
    `;
    document.head.appendChild(style);
});