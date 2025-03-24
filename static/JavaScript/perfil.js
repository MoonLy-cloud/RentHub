document.addEventListener('DOMContentLoaded', function() {

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
});

function cargarPerfil() {
    const cargando = document.getElementById('perfil-loading');
    const contenido = document.getElementById('perfil-content');

    fetchAutenticado('/api/mi-perfil')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar perfil');
            }
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

            // Llenar el formulario
            document.getElementById('nombre').value = data.perfil.nombre;
            document.getElementById('apellido1').value = data.perfil.apellido1;
            document.getElementById('apellido2').value = data.perfil.apellido2 || '';
            document.getElementById('correo').value = data.perfil.correo;

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
    const nombre = document.getElementById('nombre').value;
    const apellido1 = document.getElementById('apellido1').value;
    const apellido2 = document.getElementById('apellido2').value;
    const correo = document.getElementById('correo').value;
    const passwordActual = document.getElementById('password_actual').value;
    const passwordNuevo = document.getElementById('password_nuevo').value;

    const userData = {
        nombre: nombre,
        apellido1: apellido1,
        apellido2: apellido2,
        correo: correo
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
    // Simulación de conexión con PayPal
    const email = prompt('Por favor, introduce tu correo de PayPal:');

    if (!email) return;

    fetchAutenticado('/api/conectar-paypal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paypal_email: email })
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al conectar PayPal');
            return response.json();
        })
        .then(data => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Cuenta de PayPal conectada correctamente',
                icon: 'success',
                confirmButtonColor: 'var(--bs-primary)'
            });
            mostrarPayPalConectado(email);
        })
        .catch(error => {
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: 'var(--bs-primary)'
            });
            console.error('Error:', error);
        });
}

function desconectarPayPal() {
    if (!confirm('¿Estás seguro de que quieres desconectar tu cuenta de PayPal?')) {
        return;
    }

    fetchAutenticado('/api/desconectar-paypal', {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) throw new Error('Error al desconectar PayPal');
            return response.json();
        })
        .then(data => {
            Swal.fire({
                title: '¡Éxito!',
                text: 'Cuenta de PayPal desconectada correctamente',
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
                text: error.message,
                icon: 'error',
                confirmButtonColor: 'var(--bs-primary)'
            })
            console.error('Error:', error);
        });
}

function mostrarPayPalConectado(email) {
    document.getElementById('status-paypal').textContent = 'Conectado';
    document.getElementById('email-paypal').textContent = email;
    document.getElementById('btn-conectar-paypal').style.display = 'none';
    document.getElementById('btn-desconectar-paypal').style.display = 'inline-block';
}

function editarPropiedad(id) {
    // Redirigir a la página de edición de propiedad
    window.location.href = `/editar-propiedad/${id}`;
}

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