document.addEventListener('DOMContentLoaded', function() {
    const registerPropertyLink = document.getElementById('register-property');
    const managePropertyLink = document.getElementById('manage-property');
    const accountSettingsLink = document.getElementById('account-settings');
    const dashboardContent = document.getElementById('dashboard-content');

    let userData = null;

    // Cargar los datos del usuario actual
    async function cargarDatosUsuario() {
        try {
            const response = await fetch('/api/usuario');
            const data = await response.json();

            if (response.ok) {
                userData = data.usuario;
                // Actualizar elementos visuales con datos del usuario
                actualizarInterfazUsuario();
                return true;
            } else {
                // Si no hay sesión activa, redirigir a login
                if (response.status === 401) {
                    window.location.href = '/login';
                    return false;
                }
                console.error('Error al cargar datos del usuario:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error de conexión:', error);
            return false;
        }
    }

    function actualizarInterfazUsuario() {
        if (userData) {
            // Aquí puedes actualizar elementos de la interfaz con datos del usuario
            // Por ejemplo, mostrar el nombre en alguna parte
            console.log("Usuario cargado:", userData.nombre);
        }
    }

    // Función para establecer la pestaña activa
    function setActiveTab(activeTab) {
        [registerPropertyLink, managePropertyLink, accountSettingsLink].forEach(link => {
            link.classList.remove('active');
        });
        activeTab.classList.add('active');
    }

    // Inicialización - verificar sesión y cargar datos
    async function inicializar() {
        const sesionValida = await cargarDatosUsuario();
        if (sesionValida) {
            // Por defecto, mostrar el formulario de registro de propiedad
            registerPropertyLink.classList.add('active');
            cargarFormularioRegistroPropiedad();
        }
    }

    // Iniciar la aplicación
    inicializar();

    // Manejadores de eventos para las pestañas
    registerPropertyLink.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab(registerPropertyLink);
        cargarFormularioRegistroPropiedad();
    });

    managePropertyLink.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab(managePropertyLink);
        cargarAdministracionPropiedades();
    });

    accountSettingsLink.addEventListener('click', function(e) {
        e.preventDefault();
        setActiveTab(accountSettingsLink);
        cargarAjustesCuenta();
    });

    // Funciones para cargar contenido de cada sección
    function cargarFormularioRegistroPropiedad() {
        dashboardContent.innerHTML = `
            <h2 class="mb-4">Registrar nueva propiedad</h2>
            <form id="property-form">
                <div class="mb-3">
                    <label for="nombre" class="form-label">Nombre de la propiedad</label>
                    <input type="text" class="form-control" id="nombre" required>
                </div>
                <div class="mb-3">
                    <label for="direccion" class="form-label">Dirección</label>
                    <input type="text" class="form-control" id="direccion" required>
                </div>
                <div class="mb-3">
                    <label for="descripcion" class="form-label">Descripción</label>
                    <textarea class="form-control" id="descripcion" rows="3" required></textarea>
                </div>
                <div class="mb-3">
                    <label for="precio" class="form-label">Precio</label>
                    <div class="input-group">
                        <span class="input-group-text">$</span>
                        <input type="number" class="form-control" id="precio" required>
                    </div>
                </div>
                <div class="mb-3">
                    <label for="imagen" class="form-label">URL de la imagen</label>
                    <input type="text" class="form-control" id="imagen">
                </div>
                <div class="mb-3 form-check">
                    <input type="checkbox" class="form-check-input" id="disponible" checked>
                    <label class="form-check-label" for="disponible">Disponible para renta</label>
                </div>
                <button type="submit" class="btn btn-primary">Registrar propiedad</button>
            </form>
        `;

        document.getElementById('property-form').addEventListener('submit', registrarPropiedad);
    }

    function cargarAdministracionPropiedades() {
        dashboardContent.innerHTML = `
            <h2 class="mb-4">Administrar propiedades</h2>
            <div id="properties-list" class="row">
                <div class="col-12 text-center">
                    <p>Cargando propiedades...</p>
                </div>
            </div>
        `;

        cargarPropiedadesUsuario();
    }

    function cargarAjustesCuenta() {
        dashboardContent.innerHTML = `
            <h2 class="mb-4">Ajustes de cuenta</h2>
            <div id="user-data-loading" class="text-center">
                <p>Cargando datos de usuario...</p>
            </div>
            <form id="account-form" style="display: none;">
                <div class="mb-3">
                    <label for="email" class="form-label">Correo electrónico</label>
                    <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                    <label for="current-password" class="form-label">Contraseña actual</label>
                    <input type="password" class="form-control" id="current-password">
                </div>
                <div class="mb-3">
                    <label for="new-password" class="form-label">Nueva contraseña</label>
                    <input type="password" class="form-control" id="new-password">
                </div>
                <div class="mb-3">
                    <label for="confirm-password" class="form-label">Confirmar nueva contraseña</label>
                    <input type="password" class="form-control" id="confirm-password">
                </div>
                <div class="mb-3">
                    <label for="paypal" class="form-label">Correo PayPal</label>
                    <input type="email" class="form-control" id="paypal">
                </div>
                <button type="submit" class="btn btn-primary">Guardar cambios</button>
            </form>
        `;

        // Cargar datos actuales del usuario en el formulario
        cargarDatosFormularioUsuario();
    }

    async function cargarDatosFormularioUsuario() {
        if (!userData) {
            const sesionValida = await cargarDatosUsuario();
            if (!sesionValida) return;
        }

        const userDataLoading = document.getElementById('user-data-loading');
        const accountForm = document.getElementById('account-form');

        if (userData) {
            document.getElementById('email').value = userData.correo || '';
            // El campo paypal se agregará cuando tengas ese dato en la BD

            userDataLoading.style.display = 'none';
            accountForm.style.display = 'block';
        } else {
            userDataLoading.innerHTML = '<p class="text-danger">Error al cargar datos de usuario</p>';
        }

        document.getElementById('account-form').addEventListener('submit', guardarCambiosCuenta);
    }

    // Funciones para manejar formularios
    async function registrarPropiedad(event) {
        event.preventDefault();

        // Obtener los valores del formulario
        const nombre = document.getElementById('nombre').value;
        const direccion = document.getElementById('direccion').value;
        const descripcion = document.getElementById('descripcion').value;
        const precio = parseFloat(document.getElementById('precio').value);
        const imagen = document.getElementById('imagen').value;
        const disponible = document.getElementById('disponible').checked ? 1 : 0;

        // Crear el objeto de propiedad
        const propiedad = {
            nombre,
            direccion,
            descripcion,
            precio,
            imagen,
            disponible
            // Ya no necesitamos enviar el ID del propietario, lo toma del token JWT
        };

        try {
            const response = await fetch('/api/propiedades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propiedad)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Propiedad registrada correctamente');
                document.getElementById('property-form').reset();
            } else {
                if (response.status === 401) {
                    alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
                    window.location.href = '/login';
                } else {
                    alert('Error al registrar propiedad: ' + data.message);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    }

    async function cargarPropiedadesUsuario() {
        try {
            // Usar la API específica para propiedades del usuario actual
            const response = await fetch('/api/mis-propiedades');
            const data = await response.json();

            if (response.ok) {
                mostrarPropiedadesUsuario(data.propiedades);
            } else {
                if (response.status === 401) {
                    window.location.href = '/login';
                } else {
                    console.error('Error al cargar propiedades:', data.message);
                    document.getElementById('properties-list').innerHTML = '<div class="col-12 text-center">Error al cargar las propiedades</div>';
                }
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('properties-list').innerHTML = '<div class="col-12 text-center">Error de conexión</div>';
        }
    }

    function mostrarPropiedadesUsuario(propiedades) {
        const propertiesList = document.getElementById('properties-list');

        if (propiedades.length === 0) {
            propertiesList.innerHTML = '<div class="col-12 text-center">No tienes propiedades registradas</div>';
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
                        <p class="card-text"><strong>Precio:</strong> $${propiedad.precio}/mes</p>
                        <p class="card-text"><strong>Estado:</strong> ${propiedad.disponible ? 'Disponible' : 'No disponible'}</p>
                        <div class="d-flex justify-content-between">
                            <button class="btn btn-primary editar-propiedad" data-id="${propiedad.id}">Editar</button>
                            <button class="btn btn-danger eliminar-propiedad" data-id="${propiedad.id}">Eliminar</button>
                        </div>
                    </div>
                </div>
            </div>
            `;
        });

        propertiesList.innerHTML = html;

        // Agregar event listeners para los botones
        document.querySelectorAll('.editar-propiedad').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                // Implementar la edición
                alert('Editar propiedad ' + propiedadId);
            });
        });

        document.querySelectorAll('.eliminar-propiedad').forEach(button => {
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar esta propiedad?')) {
                    eliminarPropiedad(propiedadId);
                }
            });
        });
    }

    async function eliminarPropiedad(propiedadId) {
        try {
            const response = await fetch(`/api/propiedades/${propiedadId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (response.ok) {
                alert('Propiedad eliminada correctamente');
                cargarPropiedadesUsuario(); // Recargar la lista
            } else {
                if (response.status === 401) {
                    alert('Sesión expirada. Por favor, inicie sesión nuevamente.');
                    window.location.href = '/login';
                } else {
                    alert('Error al eliminar propiedad: ' + data.message);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    }

    async function guardarCambiosCuenta(event) {
        event.preventDefault();
        alert('Funcionalidad de actualización de cuenta en desarrollo');
        // Esta funcionalidad se implementará en una fase posterior
    }

    // Agregar función para cerrar sesión
    const logoutLink = document.createElement('a');
    logoutLink.href = '/logout';
    logoutLink.textContent = 'Cerrar sesión';
    logoutLink.className = 'btn btn-outline-danger mt-4';
    dashboardContent.appendChild(logoutLink);
});