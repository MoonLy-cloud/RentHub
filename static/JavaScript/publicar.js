document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación antes de mostrar la página
    verificarAutenticacion().then(() => {
        if (!localStorage.getItem('token')) {
            window.location.replace('/');
            return;
        }

        document.getElementById('property-form').addEventListener('submit', async function (event) {
            event.preventDefault();

            // Validar el formulario
            if (!this.checkValidity()) {
                event.stopPropagation();
                this.classList.add('was-validated');
                return;
            }

            // Obtener token del localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('Debe iniciar sesión para publicar');
                window.location.replace('/login');
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

            reader.onloadend = async function () {
                const base64Image = reader.result;

                // Crear el objeto de datos para enviar
                const payload = {
                    token: token,
                    propiedad: {
                        nombre: nombre,
                        direccion: direccion,
                        descripcion: descripcion,
                        precio: parseFloat(precio),
                        imagen: base64Image,
                        disponible: parseInt(disponible)
                    }
                };

                try {
                    const response = await fetch('/api/propiedades', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await response.json();

                    if (response.ok) {
                        alert('Propiedad publicada correctamente');
                        window.location.replace('/propiedades');
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
    });
});