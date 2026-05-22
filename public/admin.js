// API Base URL
const API_URL = 'http://localhost:3000/api';

let productoEnEdicion = null;

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
  cargarProductosAdmin();
  cargarEstadisticasAdmin();
  configurarFormularios();
  configurarModal();
});

// ==================== CONFIGURAR FORMULARIOS ====================
function configurarFormularios() {
  // Formulario de agregar
  const formProducto = document.getElementById('formProducto');
  if (formProducto) {
    formProducto.addEventListener('submit', async (e) => {
      e.preventDefault();
      await guardarProducto();
    });
  }

  // Formulario de editar
  const formEditar = document.getElementById('formEditar');
  if (formEditar) {
    formEditar.addEventListener('submit', async (e) => {
      e.preventDefault();
      await actualizarProducto();
    });
  }
}

// ==================== CONFIGURAR MODAL ====================
function configurarModal() {
  const modal = document.getElementById('modalEditar');
  const closeBtn = document.querySelector('.close');

  if (closeBtn) {
    closeBtn.addEventListener('click', cerrarModal);
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      cerrarModal();
    }
  });
}

// ==================== CARGAR PRODUCTOS ADMIN ====================
async function cargarProductosAdmin() {
  try {
    const response = await fetch(`${API_URL}/productos`);
    const data = await response.json();

    if (data.success) {
      mostrarTablaProductos(data.datos);
    } else {
      mostrarError('Error al cargar productos');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión con el servidor');
  }
}

// ==================== MOSTRAR TABLA DE PRODUCTOS ====================
function mostrarTablaProductos(productos) {
  const tabla = document.getElementById('tablaProductos');

  if (productos.length === 0) {
    tabla.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px;">No hay productos</td></tr>`;
    return;
  }

  tabla.innerHTML = productos.map(producto => `
    <tr>
      <td>${producto.id}</td>
      <td>${producto.nombre}</td>
      <td>${producto.descripcion ? producto.descripcion.substring(0, 50) + '...' : '-'}</td>
      <td>$${parseFloat(producto.precio).toFixed(2)}</td>
      <td>${producto.cantidad}</td>
      <td>${producto.categoria || '-'}</td>
      <td>
        <div class="tabla-acciones">
          <button class="btn-edit" onclick="abrirEditar(${producto.id})">✏️ Editar</button>
          <button class="btn-danger" onclick="eliminarProducto(${producto.id})">🗑️ Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ==================== GUARDAR PRODUCTO ====================
async function guardarProducto() {
  const nombre = document.getElementById('nombre').value.trim();
  const precio = parseFloat(document.getElementById('precio').value);
  const cantidad = parseInt(document.getElementById('cantidad').value) || 0;
  const categoria = document.getElementById('categoria').value;
  const imagen = document.getElementById('imagen').value.trim();
  const descripcion = document.getElementById('descripcion').value.trim();

  // Validaciones
  if (!nombre || !precio) {
    mostrarError('El nombre y precio son obligatorios');
    return;
  }

  if (isNaN(precio) || precio <= 0) {
    mostrarError('El precio debe ser un número válido mayor a 0');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/productos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        precio,
        cantidad,
        categoria,
        imagen,
        descripcion
      })
    });

    const data = await response.json();

    if (data.success) {
      mostrarExito('Producto creado correctamente');
      limpiarFormulario();
      cargarProductosAdmin();
      cargarEstadisticasAdmin();
    } else {
      mostrarError(data.error || 'Error al crear el producto');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión');
  }
}

// ==================== LIMPIAR FORMULARIO ====================
function limpiarFormulario() {
  document.getElementById('formProducto').reset();
  document.getElementById('formTitulo').textContent = 'Agregar Nuevo Producto';
  productoEnEdicion = null;
}

// ==================== ABRIR MODAL EDITAR ====================
async function abrirEditar(id) {
  try {
    const response = await fetch(`${API_URL}/productos/${id}`);
    const data = await response.json();

    if (data.success) {
      const producto = data.datos;
      productoEnEdicion = producto;

      document.getElementById('editarId').value = producto.id;
      document.getElementById('editarNombre').value = producto.nombre;
      document.getElementById('editarPrecio').value = producto.precio;
      document.getElementById('editarCantidad').value = producto.cantidad;
      document.getElementById('editarCategoria').value = producto.categoria || '';
      document.getElementById('editarImagen').value = producto.imagen || '';
      document.getElementById('editarDescripcion').value = producto.descripcion || '';

      document.getElementById('modalEditar').classList.add('show');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar el producto');
  }
}

// ==================== CERRAR MODAL ====================
function cerrarModal() {
  document.getElementById('modalEditar').classList.remove('show');
  productoEnEdicion = null;
}

// ==================== ACTUALIZAR PRODUCTO ====================
async function actualizarProducto() {
  const id = document.getElementById('editarId').value;
  const nombre = document.getElementById('editarNombre').value.trim();
  const precio = parseFloat(document.getElementById('editarPrecio').value);
  const cantidad = parseInt(document.getElementById('editarCantidad').value) || 0;
  const categoria = document.getElementById('editarCategoria').value;
  const imagen = document.getElementById('editarImagen').value.trim();
  const descripcion = document.getElementById('editarDescripcion').value.trim();

  if (!nombre || !precio) {
    mostrarError('El nombre y precio son obligatorios');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        precio,
        cantidad,
        categoria,
        imagen,
        descripcion
      })
    });

    const data = await response.json();

    if (data.success) {
      mostrarExito('Producto actualizado correctamente');
      cerrarModal();
      cargarProductosAdmin();
      cargarEstadisticasAdmin();
    } else {
      mostrarError(data.error || 'Error al actualizar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión');
  }
}

// ==================== ELIMINAR PRODUCTO ====================
async function eliminarProducto(id) {
  if (!confirm('¿Está seguro de que desea eliminar este producto?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/productos/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      mostrarExito('Producto eliminado correctamente');
      cargarProductosAdmin();
      cargarEstadisticasAdmin();
    } else {
      mostrarError(data.error || 'Error al eliminar');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión');
  }
}

// ==================== CARGAR ESTADÍSTICAS ADMIN ====================
async function cargarEstadisticasAdmin() {
  try {
    const response = await fetch(`${API_URL}/estadisticas`);
    const data = await response.json();

    if (data.success && data.datos) {
      const stats = data.datos;
      document.getElementById('statTotal').textContent = stats.total_productos || 0;
      document.getElementById('statStock').textContent = stats.cantidad_total || 0;
      document.getElementById('statPromedio').textContent = `$${parseFloat(stats.precio_promedio || 0).toFixed(2)}`;
      document.getElementById('statMinimo').textContent = `$${parseFloat(stats.precio_minimo || 0).toFixed(2)}`;
      document.getElementById('statMaximo').textContent = `$${parseFloat(stats.precio_maximo || 0).toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// ==================== CAMBIAR SECCIÓN ====================
function mostrarSeccion(seccion) {
  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));

  // Mostrar sección seleccionada
  document.getElementById(seccion).classList.add('activa');
  event.target.classList.add('active');

  // Cargar datos según la sección
  if (seccion === 'productos') {
    cargarProductosAdmin();
  } else if (seccion === 'estadisticas') {
    cargarEstadisticasAdmin();
  }
}

// ==================== BUSCAR PRODUCTOS ADMIN ====================
async function buscarProductosAdmin() {
  const termino = document.getElementById('adminSearchInput').value.trim();

  if (termino === '') {
    cargarProductosAdmin();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/productos/buscar/${termino}`);
    const data = await response.json();

    if (data.success) {
      mostrarTablaProductos(data.datos);
    } else {
      mostrarError('No se encontraron productos');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error en la búsqueda');
  }
}

// ==================== NOTIFICACIONES ====================
function mostrarError(mensaje) {
  alert(`❌ ${mensaje}`);
}

function mostrarExito(mensaje) {
  alert(`✅ ${mensaje}`);
}

// ==================== ENTER PARA BUSCAR ====================
document.addEventListener('DOMContentLoaded', () => {
  const adminSearchInput = document.getElementById('adminSearchInput');
  if (adminSearchInput) {
    adminSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        buscarProductosAdmin();
      }
    });
  }
});
