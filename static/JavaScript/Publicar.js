// Variables para almacenar la ubicación y el marcador
let map;
let marker;
let geocoder;
let autocomplete;

// Inicializar el mapa
function initMap() {
    // Ubicación predeterminada (centro de la ciudad)
    const defaultLocation = { lat: 19.432608, lng: -99.133209 }; // CDMX como ejemplo

    // Crear el mapa
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 13,
        mapTypeControl: false
    });

    // Crear el geocodificador
    geocoder = new google.maps.Geocoder();

    // Crear el marcador arrastrable
    marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    // Configurar el autocompletado de direcciones
    autocomplete = new google.maps.places.Autocomplete(
        document.getElementById("direccion"),
        { types: ["geocode"] }
    );

    // Actualizar el mapa cuando se selecciona una ubicación
    autocomplete.addListener("place_changed", function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }

        // Centrar el mapa en la ubicación seleccionada
        map.setCenter(place.geometry.location);
        map.setZoom(17);

        // Mover el marcador
        marker.setPosition(place.geometry.location);
    });

    // Actualizar la dirección cuando se arrastra el marcador
    marker.addListener("dragend", function() {
        geocoder.geocode({
            location: marker.getPosition()
        }, function(results, status) {
            if (status === "OK" && results[0]) {
                document.getElementById("direccion").value = results[0].formatted_address;
            }
        });
    });
}

// Vista previa de la imagen
document.getElementById('imagen').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const imagePreview = document.getElementById('image-preview');

        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        };

        reader.readAsDataURL(file);
    }
});

// Validación y envío del formulario
document.getElementById('property-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Validar el formulario
    if (!this.checkValidity()) {
        event.stopPropagation();
        this.classList.add('was-validated');
        return;
    }

    // Obtener valores
    const nombre = document.getElementById('nombre').value;
    const direccion = document.getElementById('direccion').value;
    const descripcion = document.getElementById('descripcion').value;
    const precio = document.getElementById('precio').value;
    const disponible = document.querySelector('input[name="disponible"]:checked').value;

    // Obtener la imagen como base64
    const file = document.getElementById('imagen').files[0];
    const reader = new FileReader();

    reader.onloadend = async function() {
        const base64Image = reader.result;

        // Crear el objeto de datos para enviar
        const propertyData = {
            nombre: nombre,
            direccion: direccion,
            descripcion: descripcion,
            precio: parseFloat(precio),
            imagen: base64Image,
            disponible: parseInt(disponible)
        };

        try {
            // Enviar los datos al servidor
            const response = await fetch('/api/propiedades', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(propertyData),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                alert('Propiedad publicada correctamente');
                window.location.href = '/propiedades';
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        }
    };

    if (file) {
        reader.readAsDataURL(file);
    }
});