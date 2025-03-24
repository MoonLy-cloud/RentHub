document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación antes de mostrar la página
    verificarAutenticacion().then(() => {
        if (!localStorage.getItem('token')) {
            window.location.replace('/');
            return;
        }

        // Obtener el token de MapBox del servidor
        fetch('/api/mapbox-token')
            .then(response => response.json())
            .then(data => {
                mapboxgl.accessToken = data.token;
                inicializarMapa();
            })
            .catch(error => {
                console.error('Error al obtener token de MapBox:', error);
                mapboxgl.accessToken = 'pk.eyJ1IjoibW9vbmx5MTIiLCJhIjoiY204bjNreGduMG1weTJtcHE5OGdtejJvNCJ9.pdpFMcxEu9w0np44GEEu4g';
                inicializarMapa();
            });
    });

    // Función global para inicializar el mapa
    function inicializarMapa() {
        // Variables globales para el mapa y el marcador
        window.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [-99.1332, 19.4326], // Centro de México
            zoom: 9
        });

        // Agregar controles al mapa
        window.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Crear marcador arrastrable
        window.marker = new mapboxgl.Marker({
            draggable: true
        }).setLngLat([-99.1332, 19.4326]).addTo(window.map);

        // Actualizar coordenadas cuando se arrastra el marcador
        function onDragEnd() {
            const lngLat = window.marker.getLngLat();
            document.getElementById('latitud').value = lngLat.lat;
            document.getElementById('longitud').value = lngLat.lng;

            // Obtener dirección a partir de coordenadas (geocodificación inversa)
            obtenerDireccionDesdeCoords(lngLat.lng, lngLat.lat);
        }

        window.marker.on('dragend', onDragEnd);

        // Inicializar el geocodificador
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false, // No añadir un segundo marcador
            placeholder: 'Ingresa una dirección o ubicación',
            language: 'es',
            countries: 'mx' // Limitar búsqueda a México
        });

        // Añadir geocodificador al contenedor
        document.getElementById('geocoder').appendChild(geocoder.onAdd(window.map));

        // Cuando se selecciona una dirección con el geocodificador
        geocoder.on('result', function(e) {
            const coords = e.result.center;

            // Guardar la dirección formateada
            const direccion = e.result.place_name;

            // Actualizar posición del marcador
            window.marker.setLngLat(coords);

            // Actualizar valores ocultos
            document.getElementById('latitud').value = coords[1];
            document.getElementById('longitud').value = coords[0];

            // Guardar la dirección completa
            document.getElementById('direccion').value = direccion;
        });

        // Botón para usar ubicación actual con mejor precisión
        document.getElementById('btn-ubicacion-actual').addEventListener('click', function() {
            if (!navigator.geolocation) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Tu navegador no soporta geolocalización'
                });
                return;
            }

            // Mostrar indicador de carga
            Swal.fire({
                title: 'Obteniendo ubicación...',
                text: 'Por favor espere',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Implementación mejorada usando watchPosition
            const options = {
                enableHighAccuracy: true, // Alta precisión
                timeout: 20000,          // Tiempo de espera ampliado
                maximumAge: 0            // No usar caché
            };

            // Contador para intentos y precisión mínima aceptable
            let watchId;
            let bestAccuracy = Infinity;
            let bestPosition = null;
            let attempts = 0;
            const MAX_ATTEMPTS = 10;
            const MAX_ACCEPTABLE_ACCURACY = 100; // metros

            // Usar watchPosition para mejorar precisión con múltiples lecturas
            watchId = navigator.geolocation.watchPosition(
                // Éxito en la lectura
                function(position) {
                    attempts++;

                    // Verificar si tenemos una mejor lectura
                    if (position.coords.accuracy < bestAccuracy) {
                        bestAccuracy = position.coords.accuracy;
                        bestPosition = position;

                        // Si la precisión es suficientemente buena, usarla inmediatamente
                        if (bestAccuracy <= MAX_ACCEPTABLE_ACCURACY || attempts >= MAX_ATTEMPTS) {
                            navigator.geolocation.clearWatch(watchId);

                            // Usar los mejores datos obtenidos
                            const latitude = bestPosition.coords.latitude;
                            const longitude = bestPosition.coords.longitude;

                            // Aplica corrección usando Turf.js si es necesario
                            let adjustedCoords = [longitude, latitude];
                            try {
                                // Verificar si hay sesgo sistemático usando los datos anteriores
                                // y aplicar factor de corrección si está disponible
                                const storedCorrection = localStorage.getItem('locationCorrection');
                                if (storedCorrection) {
                                    const correction = JSON.parse(storedCorrection);
                                    adjustedCoords = turf.transformTranslate(
                                        turf.point([longitude, latitude]),
                                        correction.distance,
                                        correction.bearing
                                    ).geometry.coordinates;
                                }
                            } catch (e) {
                                console.error('Error al ajustar coordenadas:', e);
                            }

                            // Actualizar mapa con las coordenadas ajustadas
                            actualizarUbicacionEnMapa(adjustedCoords[0], adjustedCoords[1]);

                            // Cerrar el indicador de carga
                            Swal.close();

                            // Mostrar información sobre la precisión
                            Swal.fire({
                                icon: 'success',
                                title: 'Ubicación obtenida',
                                text: `Precisión: aproximadamente ${Math.round(bestAccuracy)} metros`,
                                timer: 2000,
                                showConfirmButton: false
                            });
                        }
                    }
                },
                // Error
                function(error) {
                    navigator.geolocation.clearWatch(watchId);
                    Swal.close();
                    manejarErrorUbicacion(error);

                    // Intentar una vez más con getCurrentPosition como fallback
                    navigator.geolocation.getCurrentPosition(
                        function(position) {
                            const latitude = position.coords.latitude;
                            const longitude = position.coords.longitude;
                            actualizarUbicacionEnMapa(longitude, latitude);
                        },
                        function(error) {
                            manejarErrorUbicacion(error);
                        },
                        options
                    );
                },
                options
            );

            // Establecer un timeout para detener el watch si tarda demasiado
            setTimeout(() => {
                if (watchId) {
                    navigator.geolocation.clearWatch(watchId);
                    if (!bestPosition) {
                        Swal.close();
                        Swal.fire({
                            icon: 'warning',
                            title: 'Tiempo agotado',
                            text: 'No se pudo obtener una ubicación precisa. Inténtalo nuevamente.'
                        });
                    }
                }
            }, options.timeout);
        });
    }

    // Función para actualizar la ubicación en el mapa
    function actualizarUbicacionEnMapa(longitude, latitude) {
        // Validar coordenadas
        if (!isFinite(longitude) || !isFinite(latitude) ||
            longitude < -180 || longitude > 180 ||
            latitude < -90 || latitude > 90) {

            Swal.fire({
                icon: 'error',
                title: 'Error de ubicación',
                text: 'Las coordenadas obtenidas no son válidas.'
            });
            return;
        }

        // Actualizar mapa y marcador
        window.map.flyTo({
            center: [longitude, latitude],
            zoom: 17,
            essential: true
        });

        window.marker.setLngLat([longitude, latitude]);

        // Actualizar campos ocultos
        document.getElementById('latitud').value = latitude;
        document.getElementById('longitud').value = longitude;

        // Obtener dirección usando geocodificación inversa
        obtenerDireccionDesdeCoords(longitude, latitude);
    }

    // Función para obtener dirección a partir de coordenadas
    function obtenerDireccionDesdeCoords(lng, lat) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=es&types=address,place,locality,neighborhood&limit=1`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.features && data.features.length > 0) {
                    const direccion = data.features[0].place_name;
                    document.getElementById('direccion').value = direccion;

                    // Notificación visual sutil
                    const direccionInput = document.getElementById('direccion');
                    direccionInput.classList.add('bg-light');
                    setTimeout(() => {
                        direccionInput.classList.remove('bg-light');
                    }, 500);
                } else {
                    obtenerDireccionAlternativa(lng, lat);
                }
            })
            .catch(error => {
                console.error('Error en geocodificación inversa:', error);
                obtenerDireccionAlternativa(lng, lat);
            });
    }

    // Función alternativa para obtener dirección usando OpenStreetMap Nominatim
    function obtenerDireccionAlternativa(lng, lat) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data && data.display_name) {
                    document.getElementById('direccion').value = data.display_name;
                } else {
                    document.getElementById('direccion').value = `Latitud: ${lat}, Longitud: ${lng}`;
                }
            })
            .catch(error => {
                console.error('Error en geocodificación inversa alternativa:', error);
                document.getElementById('direccion').value = `Latitud: ${lat}, Longitud: ${lng}`;
            });
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

    // Vista previa de la imagen
    document.getElementById('imagen').addEventListener('change', function(event) {
        const reader = new FileReader();
        reader.onload = function() {
            const preview = document.getElementById('image-preview');
            preview.src = reader.result;
            preview.classList.add('active');
        }
        reader.readAsDataURL(event.target.files[0]);
    });

    // Manejar el envío del formulario
    document.getElementById('property-form').addEventListener('submit', async function(event) {
        event.preventDefault();

        // Validar el formulario
        if (!this.checkValidity()) {
            event.stopPropagation();
            this.classList.add('was-validated');
            return;
        }

        // Verificar si se seleccionó una ubicación
        const latitud = document.getElementById('latitud').value;
        const longitud = document.getElementById('longitud').value;
        const direccion = document.getElementById('direccion').value;

        if (!latitud || !longitud) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor selecciona una ubicación en el mapa'
            });
            return;
        }

        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo autenticar. Por favor inicia sesión nuevamente.'
            });
            return;
        }

        // Obtener valores
        const nombre = document.getElementById('nombre').value;
        const descripcion = document.getElementById('descripcion').value;
        const precio = document.getElementById('precio').value;
        const disponible = document.querySelector('input[name="disponible"]:checked').value;

        // Obtener la imagen como base64
        const file = document.getElementById('imagen').files[0];
        if (!file) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor selecciona una imagen'
            });
            return;
        }

        // Mostrar indicador de carga
        Swal.fire({
            title: 'Registrando propiedad',
            text: 'Por favor espere...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const reader = new FileReader();

        reader.onloadend = async function() {
            const base64Image = reader.result;

            // Crear el objeto de datos para enviar
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

            try {
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
                        title: '¡Éxito!',
                        text: 'Propiedad registrada correctamente',
                        confirmButtonText: 'Ver propiedades',
                        showCancelButton: true,
                        cancelButtonText: 'Publicar otra'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/propiedades';
                        } else {
                            document.getElementById('property-form').reset();
                            document.getElementById('image-preview').classList.remove('active');
                            document.getElementById('image-preview').src = '';
                            document.getElementById('latitud').value = '';
                            document.getElementById('longitud').value = '';
                            document.getElementById('direccion').value = '';
                            window.marker.setLngLat([-99.1332, 19.4326]);
                            window.map.flyTo({
                                center: [-99.1332, 19.4326],
                                zoom: 9
                            });
                        }
                    });
                } else {
                    throw new Error(data.message || 'Error al registrar la propiedad');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Error al registrar la propiedad'
                });
            }
        };

        if (file) {
            reader.readAsDataURL(file);
        }
    });
});