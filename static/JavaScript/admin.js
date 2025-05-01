// Credenciales del administrador (esto debería manejarse de forma segura en producción)
const adminCredentials = {
    username: "admin",
    password: "admin123"
};

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const loginPage = document.getElementById('login-page');
    const adminPanel = document.getElementById('admin-panel');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    // Verificar si ya hay una sesión
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
        fetchUsers();
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Reemplaza esta parte en el evento submit del formulario
        if (username === adminCredentials.username && password === adminCredentials.password) {
            // Realizar solicitud real para obtener token
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: 'admin@example.com',
                    password: 'admin123'
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Credenciales incorrectas');
                    }
                    return response.json();
                })
                .then(data => {
                    // Guardar el token real del servidor
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    sessionStorage.setItem('adminToken', data.token);
                    showAdminPanel();
                    fetchUsers();
                })
                .catch(error => {
                    console.error('Error al iniciar sesión:', error);
                    loginError.classList.remove('d-none');
                });
        } else {
            loginError.classList.remove('d-none');
        }
    });

    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminToken');
        adminPanel.classList.add('d-none');
        loginPage.classList.remove('d-none');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginError.classList.add('d-none');
    });

    function showAdminPanel() {
        loginPage.classList.add('d-none');
        adminPanel.classList.remove('d-none');
    }

    // Filtro de búsqueda
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const rows = document.querySelectorAll('#users-table-body tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    // Configurar exportación
    setupExportButtons();
});

// Modifica esta parte en fetchUsers() en admin.js
function fetchUsers() {
    // No usaremos token por ahora
    fetch('/admin/usuarios', {
        method: 'GET'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            if (data.usuarios) {
                renderUsersTable(data.usuarios);
            } else {
                console.error('Formato de respuesta inesperado:', data);
                document.getElementById('users-table-body').innerHTML =
                    '<tr><td colspan="8" class="text-center text-danger">Error al cargar usuarios</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error al obtener usuarios:', error);
            document.getElementById('users-table-body').innerHTML =
                '<tr><td colspan="8" class="text-center text-danger">Error al cargar usuarios: ' + error.message + '</td></tr>';
        });
}


function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';

    // Variable global para acceder a los usuarios en otras funciones
    window.usersData = users;

    users.forEach(user => {
        const row = document.createElement('tr');

        // Crear la imagen con fallback
        const imgSrc = user.imagen_perfil || "/static/imgs/user.gif";

        row.innerHTML = `
            <td>${user.id}</td>
            <td>
                <img src="${imgSrc}" alt="Perfil" class="profile-image" 
                     onerror="this.src='/static/imgs/user.gif'">
            </td>
            <td>${user.nombre} ${user.apellido_p} ${user.apellido_m}</td>
            <td>${user.correo}</td>
            <td>${user.curp}</td>
            <td>${user.paypal_email || 'No configurado'}</td>
            <td>${formatDate(user.fecha_registro)}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-info view-user" data-id="${user.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-danger delete-user" data-id="${user.id}" title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Agregar manejadores de eventos para los botones
    document.querySelectorAll('.view-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            showUserDetails(userId, window.usersData);
        });
    });

    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            confirmDeleteUser(userId);
        });
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showUserDetails(userId, users) {
    const user = users.find(u => u.id == userId);
    if (!user) return;

    const modalContent = document.getElementById('user-details-content');
    const imgSrc = user.imagen_perfil || "/static/imgs/user.gif";

    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-4 text-center mb-3">
                <img src="${imgSrc}" alt="Imagen de perfil" class="img-fluid rounded-circle mb-2" 
                     style="width: 150px; height: 150px; object-fit: cover;" 
                     onerror="this.src='/static/imgs/user.gif'">
                <h5 class="mb-0">${user.nombre} ${user.apellido_p} ${user.apellido_m}</h5>
                <p class="text-muted">ID: ${user.id}</p>
            </div>
            <div class="col-md-8">
                <h5 class="border-bottom pb-2">Información Personal</h5>
                <div class="row mb-2">
                    <div class="col-sm-4 fw-bold">Nombre completo:</div>
                    <div class="col-sm-8">${user.nombre} ${user.apellido_p} ${user.apellido_m}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-sm-4 fw-bold">Correo electrónico:</div>
                    <div class="col-sm-8">${user.correo}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-sm-4 fw-bold">CURP:</div>
                    <div class="col-sm-8">${user.curp}</div>
                </div>
                <div class="row mb-2">
                    <div class="col-sm-4 fw-bold">Fecha de registro:</div>
                    <div class="col-sm-8">${formatDate(user.fecha_registro)}</div>
                </div>
                <h5 class="border-bottom pb-2 mt-4">Información de Pago</h5>
                <div class="row mb-2">
                    <div class="col-sm-4 fw-bold">Email de PayPal:</div>
                    <div class="col-sm-8">${user.paypal_email || 'No configurado'}</div>
                </div>
            </div>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('userDetailsModal'));
    modal.show();
}

function confirmDeleteUser(userId) {
    if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        deleteUser(userId);
    }
}

// Modifica esta parte en deleteUser() también
function deleteUser(userId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }

    fetch(`/api/admin/eliminar-usuario/${userId}`, {
        method: 'DELETE'
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || 'Error al eliminar usuario');
                });
            }
            return response.json();
        })
        .then(data => {
            alert('Usuario eliminado correctamente');
            const userRow = document.querySelector(`button.delete-user[data-id="${userId}"]`).closest('tr');
            userRow.remove();
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`Error al eliminar usuario: ${error.message}`);
        });
}

function setupExportButtons() {
    // Verificar que los elementos existen antes de añadir eventos
    const excelBtn = document.querySelector('.dropdown-item:nth-child(1)');
    const pdfBtn = document.querySelector('.dropdown-item:nth-child(2)');
    const csvBtn = document.querySelector('.dropdown-item:nth-child(3)');

    if (excelBtn) {
        excelBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportTableData('excel');
        });
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportTableData('pdf');
        });
    }

    if (csvBtn) {
        csvBtn.addEventListener('click', function(e) {
            e.preventDefault();
            exportTableData('csv');
        });
    }
}

function exportTableData(format) {
    if (!window.usersData || window.usersData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    switch (format) {
        case 'csv':
            exportToCSV();
            break;
        case 'excel':
            alert('Exportación a Excel: Funcionalidad pendiente de implementar');
            break;
        case 'pdf':
            alert('Exportación a PDF: Funcionalidad pendiente de implementar');
            break;
    }
}

function exportToCSV() {
    const users = window.usersData;
    let csvContent = "ID,Nombre,Apellido Paterno,Apellido Materno,Correo,CURP,Fecha Registro,PayPal\n";

    users.forEach(user => {
        const row = [
            user.id,
            user.nombre,
            user.apellido_p,
            user.apellido_m,
            user.correo,
            user.curp,
            user.fecha_registro || '',
            user.paypal_email || 'No configurado'
        ].join(',');

        csvContent += row + '\n';
    });

    // Crear un enlace de descarga
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'usuarios_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}