document.addEventListener('DOMContentLoaded', function() {
    const propertyList = document.getElementById('property-list');

    async function cargarPropiedades() {
        try {
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
                window.location.href = `/propiedad/${propiedadId}`;
            });
        });
    }

    // Cargar propiedades al iniciar
    cargarPropiedades();
});