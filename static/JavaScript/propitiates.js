document.addEventListener('DOMContentLoaded', function() {
    const propertyList = document.getElementById('property-list');

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
                        <p class="card-text"><strong>Precio:</strong> $${propiedad.precio}/mes</p>
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
            button.addEventListener('click', function() {
                const propiedadId = this.getAttribute('data-id');
                window.location.replace(`/propiedades/${propiedadId}`);
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