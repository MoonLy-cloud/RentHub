document.addEventListener('DOMContentLoaded', function() {
    // Cargar el modal de auth desde components
    fetch('/static/components/auth-modals.html')
        .then(response => response.text())
        .then(html => {
            // Añadir el contenido al final del body
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = html;
            document.body.appendChild(modalContainer);

            // Inicializar eventos después de cargar el modal
            inicializarEventos();
        });
});

// Variables globales para MapBox
let map;
let marker;
let geocoder;

// Función para inicializar el mapa
async function inicializarMapa(direccion) {
    try {
        // Obtener token de MapBox desde el servidor
        const respuesta = await fetch('/api/mapbox-token');
        const datos = await respuesta.json();
        const mapboxToken = datos.token;

        // Si ya hay un mapa, destruirlo
        if (map) {
            map.remove();
            map = null;
        }

        // Inicializar mapa
        mapboxgl.accessToken = mapboxToken;

        // Coordenadas iniciales (centro de México como fallback)
        let coordenadas = [-99.1332, 19.4326];

        // Si hay dirección, geocodificarla
        if (direccion) {
            try {
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json?access_token=${mapboxToken}&limit=1`;
                const geocodeResponse = await fetch(url);
                const geocodeData = await geocodeResponse.json();

                if (geocodeData.features && geocodeData.features.length > 0) {
                    coordenadas = geocodeData.features[0].center;
                }
            } catch (error) {
                console.error("Error al geocodificar:", error);
            }
        }

        // Crear mapa
        map = new mapboxgl.Map({
            container: 'map-container',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: coordenadas,
            zoom: 15
        });

        // Añadir controles
        map.addControl(new mapboxgl.NavigationControl());

        // Añadir marcador arrastrable
        marker = new mapboxgl.Marker({ draggable: true })
            .setLngLat(coordenadas)
            .addTo(map);

        // Al arrastrar el marcador, actualizar la dirección
        marker.on('dragend', async function() {
            const lngLat = marker.getLngLat();
            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lngLat.lng},${lngLat.lat}.json?access_token=${mapboxToken}&limit=1`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    document.getElementById('editar-direccion').value = data.features[0].place_name;
                }
            } catch (error) {
                console.error("Error al obtener dirección:", error);
            }
        });

        // Añadir geocodificador para buscar direcciones
        geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            marker: false,
            placeholder: 'Buscar dirección'
        });

        map.addControl(geocoder);

        // Al seleccionar una dirección, actualizar el marcador
        geocoder.on('result', function(e) {
            const coords = e.result.center;
            marker.setLngLat(coords);
            document.getElementById('editar-direccion').value = e.result.place_name;
        });

    } catch (error) {
        console.error("Error al inicializar mapa:", error);
        // Mostrar mensaje si hay error
        document.getElementById('map-container').innerHTML =
            '<div class="alert alert-danger">Error al cargar el mapa. Intenta más tarde.</div>';
    }
}

// Función para guardar los cambios de la propiedad
function guardarCambiosPropiedad() {
    const id = document.getElementById('editar-propiedad-id').value;
    const nombre = document.getElementById('editar-nombre').value;
    const direccion = document.getElementById('editar-direccion').value;
    const descripcion = document.getElementById('editar-descripcion').value;
    const precio = document.getElementById('editar-precio').value;
    const imagen = document.getElementById('editar-imagen').value;
    const disponible = document.getElementById('editar-disponible').checked ? 1 : 0;

    const propiedadData = {
        nombre,
        direccion,
        descripcion,
        precio,
        imagen,
        disponible
    };

    // Mostrar carga
    Swal.fire({
        title: 'Guardando cambios...',
        didOpen: () => {
            Swal.showLoading();
        },
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
    });

    fetchAutenticado(`/api/propiedades/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propiedad: propiedadData })
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                Swal.fire({
                    title: 'Éxito',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: 'var(--color-primary)'
                });

                // Cerrar el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('editarPropiedadModal'));
                modal.hide();

                // Recargar la lista de propiedades
                cargarMisPropiedades();
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Error',
                text: 'Ocurrió un error al actualizar la propiedad',
                icon: 'error'
            });
        });
}

function inicializarEventos() {
    const imagenActual = document.getElementById('imagen-perfil-actual');
    const btnCambiarImagen = document.getElementById('btn-cambiar-imagen');
    const uploadContainer = document.getElementById('upload-container');
    const btnCancelarUpload = document.getElementById('btn-cancelar-upload');
    const formImagenPerfil = document.getElementById('form-imagen-perfil');
    const inputImagen = document.getElementById('imagen-perfil');
    const previewContainer = document.getElementById('preview-container');
    const imagenPreview = document.getElementById('imagen-preview');
    const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');

    if (btnEliminarCuenta) {
        btnEliminarCuenta.addEventListener('click', function() {
            eliminarCuenta();
        });
    }

    if (btnCambiarImagen) {
        btnCambiarImagen.addEventListener('click', function() {
            uploadContainer.classList.remove('d-none');

            // Mostrar la imagen actual en la vista previa
            if (imagenActual.src) {
                imagenPreview.src = imagenActual.src;
                previewContainer.classList.remove('d-none');
            }
        });
    }


    // Cancelar carga
    if (btnCancelarUpload) {
        btnCancelarUpload.addEventListener('click', function() {
            uploadContainer.classList.add('d-none');
            inputImagen.value = '';
            previewContainer.classList.add('d-none');
        });
    }

    // Vista previa de imagen
    if (inputImagen) {
        inputImagen.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                // Validar tamaño (5MB máximo)
                if (this.files[0].size > 5 * 1024 * 1024) {
                    Swal.fire({
                        title: 'Error',
                        text: 'La imagen no debe superar los 5MB',
                        icon: 'error',
                        confirmButtonColor: 'var(--bs-primary)'
                    });
                    this.value = '';
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    imagenPreview.src = e.target.result;
                    previewContainer.classList.remove('d-none');
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    // Enviar formulario
    if (formImagenPerfil) {
        formImagenPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Formulario de imagen enviado");

            // Verificar autenticación
            const token = localStorage.getItem('token');
            if (!token) {
                Swal.fire({
                    title: 'Error',
                    text: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    icon: 'error',
                    confirmButtonColor: 'var(--bs-primary)'
                });
                return;
            }

            if (!inputImagen.files || !inputImagen.files[0]) {
                Swal.fire({
                    title: 'Error',
                    text: 'Selecciona una imagen',
                    icon: 'error',
                    confirmButtonColor: 'var(--bs-primary)'
                });
                return;
            }

            const formData = new FormData();
            formData.append('file', inputImagen.files[0]);

            // Mostrar loader
            Swal.fire({
                title: 'Subiendo imagen...',
                text: 'Por favor espera',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Enviar al servidor
            fetch('/api/actualizar-imagen', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
                .then(response => {
                    console.log("Estado de respuesta:", response.status);
                    return response.json().then(data => {
                        if (!response.ok) {
                            throw new Error(data.message || "Error al actualizar imagen");
                        }
                        return data;
                    });
                })
                .then(data => {
                    console.log("Datos recibidos:", data);

                    // Actualizar todas las imágenes del perfil
                    imagenActual.src = data.imagen_path + '?t=' + new Date().getTime(); // Añadir timestamp para evitar caché
                    localStorage.setItem('user_image', data.imagen_path);

                    // Cerrar formulario
                    uploadContainer.classList.add('d-none');
                    inputImagen.value = '';
                    previewContainer.classList.add('d-none');

                    Swal.fire({
                        title: 'Éxito',
                        text: 'Imagen actualizada correctamente',
                        icon: 'success',
                        confirmButtonColor: 'var(--bs-primary)'
                    });

                    // Actualizar imagen en navbar
                    document.querySelectorAll('.user-img').forEach(img => {
                        img.src = data.imagen_path + '?t=' + new Date().getTime();
                    });
                })
                .catch(error => {
                    console.error('Error completo:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al subir la imagen',
                        icon: 'error',
                        confirmButtonColor: 'var(--bs-primary)'
                    });
                });
        });
    } else {
        console.error("No se encontró el formulario de imagen");
    }

    // Verificar autenticación usando el sistema global
    verificarAutenticacion().then(() => {
        if (!localStorage.getItem('token')) {
            window.location.replace('/');
            return;
        }

        // Cargar datos del perfil
        cargarPerfil();
        cargarMisPropiedades();
        cargarPropiedadesRentadas(); // Añadir esta línea

        // Configurar formulario de edición
        document.getElementById('editar-perfil-form').addEventListener('submit', function(e) {
            e.preventDefault();
            actualizarPerfil();
        });

        // Configurar botones PayPal
        document.getElementById('btn-conectar-paypal').addEventListener('click', conectarPayPal);
        document.getElementById('btn-desconectar-paypal').addEventListener('click', desconectarPayPal);

        // Mejorada la implementación de validación de contraseña
        const passwordNuevo = document.getElementById('password_nuevo');
        if (passwordNuevo) {
            // Verificar si isPasswordSecure está disponible
            if (typeof isPasswordSecure !== 'function') {
                console.error('La función isPasswordSecure no está disponible');
                return;
            }

            // Crear contenedor para feedback si no existe
            let feedbackDiv = document.getElementById('perfil-password-feedback');
            if (!feedbackDiv) {
                feedbackDiv = document.createElement('div');
                feedbackDiv.id = 'perfil-password-feedback';
                feedbackDiv.className = 'mt-2';
                passwordNuevo.parentNode.appendChild(feedbackDiv);
            }

            // Validar en tiempo real
            passwordNuevo.addEventListener('input', () => {
                if (passwordNuevo.value) {
                    const passwordCheck = isPasswordSecure(passwordNuevo.value);
                    feedbackDiv.innerHTML = passwordCheck.requirementsHTML;
                } else {
                    feedbackDiv.innerHTML = '';
                }
            });
        }
    });
}

function cargarPropiedadesRentadas() {
    const contenedor = document.getElementById('mis-propiedades-rentadas');
    contenedor.innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando propiedades rentadas...</p>
        </div>
    `;

    fetchAutenticado('/api/mis-transacciones')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener transacciones');
            }
            return response.json();
        })
        .then(data => {
            console.log("Transacciones recibidas:", data); // Depuración

            if (!data.transacciones || data.transacciones.length === 0) {
                contenedor.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-house-slash fs-1 text-muted"></i>
                        <p class="mt-2">No has rentado ninguna propiedad todavía.</p>
                    </div>
                `;
                return;
            }

            // Limpiar el contenedor
            contenedor.innerHTML = '';

            // Mostrar cada transacción
            data.transacciones.forEach(transaccion => {
                console.log("Procesando transacción:", transaccion); // Depuración

                const propiedad = transaccion.propiedad || {};
                const inquilino = transaccion.inquilino || {};
                const fecha = transaccion.fecha ? new Date(transaccion.fecha).toLocaleDateString() : 'Fecha no disponible';

                const elemento = document.createElement('div');
                elemento.className = 'col-md-12 mb-3';
                elemento.innerHTML = `
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-header bg-success bg-opacity-25 py-2">
                            <small class="text-muted">Fecha: ${fecha}</small>
                            <span class="badge bg-success float-end">ID: ${transaccion.orden_id || 'N/A'}</span>
                        </div>
                        <div class="card-body">
                            <div class="d-flex mb-3">
                                <img src="${propiedad.imagen || '/static/imgs/property.jpg'}"
                                    class="rounded me-3" style="width: 80px; height: 80px; object-fit: cover;"
                                    alt="${propiedad.nombre || 'Propiedad'}">
                                <div>
                                    <h5 class="card-title mb-1">${propiedad.nombre || 'Propiedad rentada'}</h5>
                                    <p class="text-muted small mb-1">${propiedad.direccion || 'Sin dirección'}</p>
                                    <div class="d-flex align-items-center">
                                        <span class="badge bg-info me-2">Monto: $${transaccion.monto_total || 0}</span>
                                        <span class="badge bg-success">Ganancia: $${transaccion.monto_dueno || 0}</span>
                                    </div>
                                </div>
                            </div>

                            <hr>

                            <div class="d-flex align-items-center">
                                <h6 class="mb-0">Rentada por:</h6>
                            </div>

                            <div class="d-flex align-items-center mt-2">
                                <img src="${inquilino.imagen_perfil || '/static/imgs/user.gif'}"
                                    class="rounded-circle me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                <div>
                                    <h6 class="mb-0">${inquilino.nombre || 'Usuario'} ${inquilino.apellido1 || ''} ${inquilino.apellido2 || ''}</h6>
                                    <p class="text-muted small mb-0">${inquilino.correo || 'Usuario anónimo'}</p>
                                    ${inquilino.correo ? `<a href="mailto:${inquilino.correo}" class="btn btn-sm btn-outline-primary mt-1">
                                        <i class="bi bi-envelope"></i> Contactar
                                    </a>` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                contenedor.appendChild(elemento);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            contenedor.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
                    <p class="mt-2">Error al cargar propiedades rentadas: ${error.message}</p>
                </div>
            `;
        });
}

function cargarPerfil() {
    const cargando = document.getElementById('perfil-loading');
    const contenido = document.getElementById('perfil-content');

    fetchAutenticado('/api/mi-perfil')
        .then(response => {
            return response.json();
        })
        .then(data => {
            // Ocultar pantalla de carga
            cargando.style.display = 'none';
            contenido.style.display = 'flex';

            // Mostrar información básica
            document.getElementById('nombre-completo').textContent =
                `${data.perfil.nombre} ${data.perfil.apellido1} ${data.perfil.apellido2 || ''}`;
            document.getElementById('correo-usuario').textContent = data.perfil.correo;

            // Fecha de registro formateada
            const fecha = new Date(data.perfil.fecha_registro);
            document.getElementById('fecha-registro').textContent =
                fecha.toLocaleDateString('es-ES');

            // Llenar el formulario - verificando antes si existen los elementos
            const nombreElement = document.getElementById('nombre');
            if (nombreElement) nombreElement.value = data.perfil.nombre;

            const apellido1Element = document.getElementById('apellido1');
            if (apellido1Element) apellido1Element.value = data.perfil.apellido1;

            const apellido2Element = document.getElementById('apellido2');
            if (apellido2Element) apellido2Element.value = data.perfil.apellido2 || '';

            // Verificar si existe el campo de correo en el formulario
            const correoElement = document.getElementById('correo');
            if (correoElement) correoElement.value = data.perfil.correo;

            // Agregar CURP si existe en los datos y el elemento
            const curpElement = document.getElementById('curp');
            if (curpElement && data.perfil.curp) curpElement.value = data.perfil.curp;

                // Verificar si hay PayPal conectado
            if (data.perfil.paypal_email) {
                mostrarPayPalConectado(data.perfil.paypal_email);
            }
            if (data.perfil.imagen_perfil) {
                document.getElementById('imagen-perfil-actual').src = data.perfil.imagen_perfil;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cargar la información del perfil');
        });
}

function cargarMisPropiedades() {
    fetchAutenticado('/api/mis-propiedades')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar propiedades');
            return response.json();
        })
        .then(data => {
            const container = document.getElementById('mis-propiedades');
            container.innerHTML = '';

            if (!data.propiedades || data.propiedades.length === 0) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="bi bi-house-x fs-1 text-muted"></i>
                        <h5 class="mt-3">No tienes propiedades publicadas</h5>
                        <p class="text-muted">Comienza publicando tu primer lugar ahora.</p>
                        <a href="/publicar" class="btn btn-primary mt-2">
                            <i class="bi bi-plus-circle"></i> Publicar lugar
                        </a>
                    </div>
                `;
                document.getElementById('num-propiedades').textContent = '0';
                return;
            }

            // Actualizar contador de propiedades
            document.getElementById('num-propiedades').textContent = data.propiedades.length;

            // Mostrar cada propiedad
            data.propiedades.forEach(propiedad => {
                const disponibleBadge = propiedad.disponible ?
                    '<span class="badge bg-success">Disponible</span>' :
                    '<span class="badge bg-danger">No Disponible</span>';

                const card = document.createElement('div');
                card.className = 'col-md-6 col-lg-4 mb-4';
                card.innerHTML = `
                    <div class="card h-100 border-0 shadow-sm">
                        <img src="${propiedad.imagen}" class="card-img-top property-img" alt="${propiedad.nombre}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title">${propiedad.nombre}</h5>
                                ${disponibleBadge}
                            </div>
                            <p class="card-text text-truncate">${propiedad.direccion}</p>
                            <p class="card-text"><strong>$${propiedad.precio}</strong> /mes</p>
                        </div>
                        <div class="card-footer bg-white border-0 pt-0">
                            <div class="d-flex justify-content-between">
                                <button class="btn btn-outline-secondary btn-sm" onclick="editarPropiedad(${propiedad.id})">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" onclick="eliminarPropiedad(${propiedad.id})">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Error:', error);
            const container = document.getElementById('mis-propiedades');
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning"></i>
                    <h5 class="mt-3">Error al cargar propiedades</h5>
                    <p class="text-muted">No se pudieron cargar tus propiedades.</p>
                </div>
            `;
        });
}

function actualizarPerfil() {
    const correo = document.getElementById('correo').value;
    const passwordActual = document.getElementById('password_actual').value;
    const passwordNuevo = document.getElementById('password_nuevo').value;

    const userData = {
        // No incluimos nombre, apellidos o CURP ya que ahora son de solo lectura
        correo: correo,
        // Mantenemos los datos originales de estos campos
        nombre: document.getElementById('nombre').value,
        apellido1: document.getElementById('apellido1').value,
        apellido2: document.getElementById('apellido2').value
    };

    // Añadir contraseñas solo si se están cambiando
    if (passwordActual && passwordNuevo) {
        // Validar la nueva contraseña
        const passwordCheck = isPasswordSecure(passwordNuevo);
        if (!passwordCheck.isValid) {
            Swal.fire({
                title: 'Contraseña insegura',
                text: 'Por favor, use una contraseña que cumpla con todos los requisitos',
                icon: 'warning',
                confirmButtonColor: 'var(--bs-primary)'
            });
            return;
        }

        userData.passwordActual = passwordActual;
        userData.passwordNuevo = passwordNuevo;
    }

    fetchAutenticado('/api/actualizar-perfil', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Error al actualizar perfil');
                });
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Perfil actualizado correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--bs-primary)'
            });
            // Recargar datos
            cargarPerfil();
            // Limpiar campos de contraseña
            document.getElementById('password_actual').value = '';
            document.getElementById('password_nuevo').value = '';
        })
        .catch(error => {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: 'var(--bs-primary)'
            });
        });
}

function conectarPayPal() {
    Swal.fire({
        title: 'Conectar PayPal',
        text: 'Introduce tu correo electrónico de PayPal para recibir pagos',
        input: 'email',
        inputPlaceholder: 'correo@ejemplo.com',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Conectar',
        confirmButtonColor: 'var(--bs-primary)',
        inputValidator: (value) => {
            if (!value) {
                return 'Debes ingresar un correo electrónico';
            }

            // Validación básica de formato de correo
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Por favor, ingresa un correo electrónico válido';
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const email = result.value;

            // Mostrar loading mientras se procesa
            Swal.fire({
                title: 'Conectando...',
                text: 'Estableciendo conexión con PayPal',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetchAutenticado('/api/conectar-paypal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paypal_email: email })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.message || 'Error al conectar PayPal');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire({
                        title: '¡Conectado con éxito!',
                        text: 'Tu cuenta de PayPal ha sido vinculada correctamente',
                        icon: 'success',
                        confirmButtonColor: 'var(--bs-primary)'
                    });
                    mostrarPayPalConectado(email);
                })
                .catch(error => {
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'No se pudo conectar la cuenta de PayPal',
                        icon: 'error',
                        confirmButtonColor: 'var(--bs-primary)'
                    });
                    console.error('Error:', error);
                });
        }
    });
}

function desconectarPayPal() {
    Swal.fire({
        title: '¿Desconectar PayPal?',
        text: 'Ya no podrás recibir pagos directamente hasta que vuelvas a conectar una cuenta',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desconectar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: 'var(--bs-secondary)'
    }).then((result) => {
        if (result.isConfirmed) {
            // Mostrar loading
            Swal.fire({
                title: 'Desconectando...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetchAutenticado('/api/desconectar-paypal', {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(err => {
                            throw new Error(err.message || 'Error al desconectar PayPal');
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    Swal.fire({
                        title: 'Desconectado',
                        text: 'Tu cuenta de PayPal ha sido desvinculada correctamente',
                        icon: 'success',
                        confirmButtonColor: 'var(--bs-primary)'
                    });

                    // Actualizar la interfaz
                    document.getElementById('status-paypal').textContent = 'No conectado';
                    document.getElementById('email-paypal').textContent = 'Conecta tu cuenta de PayPal para recibir pagos';
                    document.getElementById('btn-conectar-paypal').style.display = 'inline-block';
                    document.getElementById('btn-desconectar-paypal').style.display = 'none';
                })
                .catch(error => {
                    Swal.fire({
                        title: 'Error',
                        text: error.message || 'Error al desconectar la cuenta de PayPal',
                        icon: 'error',
                        confirmButtonColor: 'var(--bs-primary)'
                    });
                    console.error('Error:', error);
                });
        }
    });
}

function mostrarPayPalConectado(email) {
    document.getElementById('status-paypal').textContent = 'Conectado';
    document.getElementById('email-paypal').textContent = email;
    document.getElementById('btn-conectar-paypal').style.display = 'none';
    document.getElementById('btn-desconectar-paypal').style.display = 'inline-block';
}

// Función para editar una propiedad (llamada desde el botón)
function editarPropiedad(id) {
    // Mostrar indicador de carga
    Swal.fire({
        title: 'Cargando...',
        text: 'Obteniendo datos de la propiedad',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Obtener datos de la propiedad
    fetchAutenticado(`/api/propiedades/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo obtener la información de la propiedad');
            }
            return response.json();
        })
        .then(data => {
            Swal.close();

            // Verificar si el modal existe y si no, cargarlo
            if (!document.getElementById('editarPropiedadModal')) {
                fetch('/static/components/auth-modals.html')
                    .then(response => response.text())
                    .then(html => {
                        // Extraer solo el modal de edición
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const modal = doc.getElementById('editarPropiedadModal');

                        // Añadir el modal al final del body
                        document.body.appendChild(modal);

                        // Ahora rellenar el formulario
                        rellenarFormularioEdicion(data.propiedad);
                    });
            } else {
                // El modal ya existe, solo rellenar el formulario
                rellenarFormularioEdicion(data.propiedad);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la información de la propiedad'
            });
        });
}

// Función para inicializar el manejo de imágenes en el modal
function inicializarManejadorDeImagenes() {
    const btnAgregarImagen = document.getElementById('btn-agregar-imagen');
    const inputFile = document.getElementById('editar-imagen-file');
    const galeriaImagenes = document.getElementById('galeria-imagenes');
    const inputImagenHidden = document.getElementById('editar-imagen');

    if (!btnAgregarImagen) return; // Si no existe el botón, salir

    btnAgregarImagen.addEventListener('click', function() {
        if (!inputFile.files[0]) {
            Swal.fire('Error', 'Por favor selecciona una imagen primero', 'error');
            return;
        }

        const file = inputFile.files[0];
        // Validar tipo de archivo
        if (!file.type.match('image.*')) {
            Swal.fire('Error', 'El archivo debe ser una imagen', 'error');
            return;
        }

        // Crear URL temporal para la imagen
        const imageUrl = URL.createObjectURL(file);

        // Crear elemento para mostrar la imagen con botón de eliminar
        const imgContainer = document.createElement('div');
        imgContainer.className = 'position-relative border rounded p-1';
        imgContainer.innerHTML = `
      <img src="${imageUrl}" class="img-fluid" style="height: 100px; width: auto;">
      <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
              style="transform: translate(50%, -50%);">
        <i class="bi bi-x"></i>
      </button>
    `;

        // Guardar referencia al archivo en el contenedor
        imgContainer.dataset.file = file.name;

        // Añadir a la galería
        galeriaImagenes.appendChild(imgContainer);

        // Limpiar input file
        inputFile.value = '';

        // Actualizar input hidden con las URLs (separadas por '|')
        actualizarInputImagenes();
    });

    // Delegación de eventos para eliminar imágenes
    galeriaImagenes.addEventListener('click', function(e) {
        if (e.target.closest('.btn-danger')) {
            const imgContainer = e.target.closest('.position-relative');
            imgContainer.remove();
            actualizarInputImagenes();
        }
    });

    // Función para actualizar el input hidden con todas las imágenes
    function actualizarInputImagenes() {
        const imagenes = Array.from(galeriaImagenes.querySelectorAll('img')).map(img => img.src);
        inputImagenHidden.value = imagenes.join('|');
    }
}

// Modificar la función rellenarFormularioEdicion
function rellenarFormularioEdicion(propiedad) {
    // Código existente para asignar valores a los campos
    document.getElementById('editar-propiedad-id').value = propiedad.id;
    document.getElementById('editar-nombre').value = propiedad.nombre;
    document.getElementById('editar-direccion').value = propiedad.direccion;
    document.getElementById('editar-descripcion').value = propiedad.descripcion;
    document.getElementById('editar-precio').value = propiedad.precio;
    document.getElementById('editar-disponible').checked = propiedad.disponible === 1;

    // Limpiar galería de imágenes primero
    const galeriaImagenes = document.getElementById('galeria-imagenes');
    if (galeriaImagenes) {
        galeriaImagenes.innerHTML = '';

        // Si hay imágenes, dividir por el separador | y añadir cada una
        if (propiedad.imagen) {
            const imagenes = propiedad.imagen.split('|');
            imagenes.forEach(img => {
                if (!img) return;

                const imgContainer = document.createElement('div');
                imgContainer.className = 'position-relative border rounded p-1';
                imgContainer.innerHTML = `
          <img src="${img}" class="img-fluid" style="height: 100px; width: auto;">
          <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle"
                  style="transform: translate(50%, -50%);">
            <i class="bi bi-x"></i>
          </button>
        `;
                galeriaImagenes.appendChild(imgContainer);
            });
        }

        // Actualizar input hidden
        document.getElementById('editar-imagen').value = propiedad.imagen || '';
    }

    const modal = new bootstrap.Modal(document.getElementById('editarPropiedadModal'));
    modal.show();

    // Inicializar el mapa después que el modal esté visible
    modal._element.addEventListener('shown.bs.modal', function() {
        inicializarMapa(propiedad.direccion);
        inicializarManejadorDeImagenes();
    }, { once: true });
}

// Agregar esta función para manejar el formulario de edición
document.addEventListener('DOMContentLoaded', function() {
    const editarPropiedadForm = document.getElementById('editar-propiedad-form');

    // Resto de tu código usando editarPropiedadForm
    // O mejor usa la delegación de eventos como ya tienes:
    document.body.addEventListener('submit', function(e) {
        if (e.target.id === 'editar-propiedad-form') {
            e.preventDefault();
            guardarCambiosPropiedad();
        }
    });

    if (editarPropiedadForm) {
        editarPropiedadForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = document.getElementById('editar-propiedad-id').value;
            const propiedadData = {
                nombre: document.getElementById('editar-nombre').value,
                direccion: document.getElementById('editar-direccion').value,
                descripcion: document.getElementById('editar-descripcion').value,
                precio: parseFloat(document.getElementById('editar-precio').value),
                imagen: document.getElementById('editar-imagen').value,
                disponible: document.getElementById('editar-disponible').checked ? 1 : 0
            };

            // Mostrar carga mientras se actualiza
            Swal.fire({
                title: 'Guardando...',
                text: 'Actualizando la información de la propiedad',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetchAutenticado(`/api/propiedades/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ propiedad: propiedadData })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('No se pudo actualizar la propiedad');
                    }
                    return response.json();
                })
                .then(data => {
                    // Cerrar modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('editarPropiedadModal'));
                    modal.hide();

                    // Mostrar mensaje de éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'La propiedad se actualizó correctamente',
                        timer: 2000
                    }).then(() => {
                        // Recargar propiedades para mostrar los cambios
                        cargarMisPropiedades();
                    });
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se pudo actualizar la propiedad'
                    });
                });
        });
    }

    // Lo mismo para la vista previa de imágenes
    document.body.addEventListener('input', function(e) {
        if (e.target.id === 'editar-imagen') {
            const previewImg = document.querySelector('#preview-img-edit img');
            if (previewImg) {
                if (e.target.value) {
                    previewImg.src = e.target.value;
                    previewImg.style.display = 'block';
                } else {
                    previewImg.style.display = 'none';
                }
            }
        }
    });
});

function eliminarPropiedad(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta propiedad?')) {
        fetchAutenticado(`/api/propiedades/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) throw new Error('Error al eliminar propiedad');
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    title: '¡Éxito!',
                    text: 'Propiedad eliminada correctamente',
                    icon: 'success',
                    confirmButtonColor: 'var(--bs-primary)'
                });
                cargarMisPropiedades();
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: 'var(--bs-primary)'
                });
            });
    }
}

function eliminarCuenta() {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará permanentemente tu cuenta y todas tus propiedades. No podrás recuperar esta información.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar mi cuenta',
        cancelButtonText: 'Cancelar',
        footer: '<span class="text-danger">Advertencia: Esta acción es irreversible</span>'
    }).then((result) => {
        if (result.isConfirmed) {
            // Solicitar contraseña para confirmar eliminación
            Swal.fire({
                title: 'Confirma tu contraseña',
                input: 'password',
                inputPlaceholder: 'Ingresa tu contraseña actual',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Eliminar cuenta',
                confirmButtonColor: '#dc3545',
                cancelButtonText: 'Cancelar',
                showLoaderOnConfirm: true,
                preConfirm: (password) => {
                    if (!password) {
                        Swal.showValidationMessage('Debes ingresar tu contraseña');
                        return false;
                    }
                    return password;
                },
                allowOutsideClick: () => !Swal.isLoading()
            }).then((result) => {
                if (result.isConfirmed) {
                    // Realizar la solicitud al servidor
                    fetchAutenticado('/api/eliminar-cuenta', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password: result.value })
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                // Eliminar datos locales
                                localStorage.removeItem('token');
                                localStorage.removeItem('username');
                                localStorage.removeItem('usuarioData');
                                localStorage.removeItem('user_image');

                                Swal.fire({
                                    title: '¡Cuenta eliminada!',
                                    text: 'Tu cuenta ha sido eliminada correctamente',
                                    icon: 'success',
                                    confirmButtonColor: 'var(--bs-primary)'
                                }).then(() => {
                                    window.location.href = '/';
                                });
                            } else {
                                Swal.fire({
                                    title: 'Error',
                                    text: data.message || 'No se pudo eliminar la cuenta',
                                    icon: 'error',
                                    confirmButtonColor: 'var(--bs-primary)'
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            Swal.fire({
                                title: 'Error',
                                text: 'Ocurrió un error al procesar tu solicitud',
                                icon: 'error',
                                confirmButtonColor: 'var(--bs-primary)'
                            });
                        });
                }
            });
        }
    });
}

