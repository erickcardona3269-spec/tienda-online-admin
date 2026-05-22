// API Base URL
const API_URL = 'http://localhost:3000/api';

// Cargar productos al iniciar página
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  cargarEstadisticas();
});

// ==================== CARGAR PRODUCTOS ====================
async function cargarProductos() {
  try {
    const response = await fetch(`${API_URL}/productos`);
    const data = await response.json();

    if (data.success) {
      mostrarProductos(data.datos);
    } else {
      mostrarError('Error al cargar productos');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error de conexión con el servidor');
  }
}

// ==================== MOSTRAR PRODUCTOS ====================
function mostrarProductos(productos) {
  const productosList = document.getElementById('productosList');

  if (productos.length === 0) {
    productosList.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No hay productos disponibles</p>';
    return;
  }

  productosList.innerHTML = productos.map(producto => `
    <div class="producto-card">
      <div class="producto-imagen">
        ${producto.imagen ? `<img src="${producto.imagen}" alt="${producto.nombre}">` : '📦'}
      </div>
      <div class="producto-info">
        ${producto.categoria ? `<span class="producto-categoria">${producto.categoria}</span>` : ''}
        <div class="producto-nombre">${producto.nombre}</div>
        <p class="producto-descripcion">${producto.descripcion || 'Sin descripción'}</p>
        <div class="producto-footer">
          <div class="producto-precio">$${parseFloat(producto.precio).toFixed(2)}</div>
          <div class="producto-cantidad">${producto.cantidad} en stock</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== CARGAR ESTADÍSTICAS ====================
async function cargarEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/estadisticas`);
    const data = await response.json();

    if (data.success && data.datos) {
      const stats = data.datos;
      document.getElementById('totalProductos').textContent = stats.total_productos || 0;
      document.getElementById('cantidadTotal').textContent = stats.cantidad_total || 0;
      document.getElementById('precioPromedio').textContent = `$${parseFloat(stats.precio_promedio || 0).toFixed(2)}`;
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// ==================== BUSCAR PRODUCTOS ====================
async function buscarProductos() {
  const termino = document.getElementById('searchInput').value.trim();

  if (termino === '') {
    cargarProductos();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/productos/buscar/${termino}`);
    const data = await response.json();

    if (data.success) {
      mostrarProductos(data.datos);
    } else {
      mostrarError('No se encontraron productos');
    }
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error en la búsqueda');
  }
}

// ==================== MOSTRAR NOTIFICACIONES ====================
function mostrarError(mensaje) {
  alert(`❌ ${mensaje}`);
}

function mostrarExito(mensaje) {
  alert(`✅ ${mensaje}`);
}

// ==================== ENTER PARA BUSCAR ====================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        buscarProductos();
      }
    });
  }
});
