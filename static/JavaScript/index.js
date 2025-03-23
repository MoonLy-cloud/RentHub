document.addEventListener('DOMContentLoaded', function() {
    // Obtener el botón de lugares
    const buttonPlaces = document.getElementById('button_places');
    const buttonIndex = document.getElementById('button_index');

    // Agregar evento de clic
    if (buttonPlaces) {
        buttonPlaces.addEventListener('click', function() {
            // Cambiar por replace para una carga completa
            window.location.replace('/propiedades');
        });
    } else {
        console.error('El elemento con ID button_places no fue encontrado');
    }
});