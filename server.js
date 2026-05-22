const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Inicializar base de datos SQLite
const db = new sqlite3.Database('./productos.db', (err) => {
  if (err) {
    console.error('Error al conectar con la BD:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
    initDB();
  }
});

// Inicializar tabla de productos
function initDB() {
  db.run(
    `CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      cantidad INTEGER NOT NULL DEFAULT 0,
      categoria TEXT,
      imagen TEXT,
      estado TEXT DEFAULT 'activo',
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('Error al crear tabla:', err.message);
      } else {
        console.log('✅ Tabla de productos lista');
      }
    }
  );
}

// ==================== RUTAS API ====================

// 1. OBTENER TODOS LOS PRODUCTOS
app.get('/api/productos', (req, res) => {
  const query = 'SELECT * FROM productos WHERE estado = "activo" ORDER BY fecha_creacion DESC';
  
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        success: true,
        total: rows.length,
        datos: rows
      });
    }
  });
});

// 2. OBTENER UN PRODUCTO POR ID
app.get('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM productos WHERE id = ? AND estado = "activo"';
  
  db.get(query, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json({ success: true, datos: row });
    } else {
      res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }
  });
});

// 3. CREAR UN NUEVO PRODUCTO
app.post('/api/productos', (req, res) => {
  const { nombre, descripcion, precio, cantidad, categoria, imagen } = req.body;

  // Validaciones
  if (!nombre || !precio) {
    return res.status(400).json({
      success: false,
      error: 'El nombre y precio son obligatorios'
    });
  }

  const query = `INSERT INTO productos (nombre, descripcion, precio, cantidad, categoria, imagen, estado)
                 VALUES (?, ?, ?, ?, ?, ?, 'activo')`;

  db.run(query, [nombre, descripcion, precio, cantidad, categoria, imagen], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.json({
        success: true,
        mensaje: 'Producto creado correctamente',
        id: this.lastID
      });
    }
  });
});

// 4. ACTUALIZAR UN PRODUCTO
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, cantidad, categoria, imagen } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({
      success: false,
      error: 'El nombre y precio son obligatorios'
    });
  }

  const query = `UPDATE productos 
                 SET nombre = ?, descripcion = ?, precio = ?, cantidad = ?, categoria = ?, imagen = ?, fecha_actualizacion = CURRENT_TIMESTAMP
                 WHERE id = ? AND estado = 'activo'`;

  db.run(query, [nombre, descripcion, precio, cantidad, categoria, imagen, id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Producto no encontrado' });
    } else {
      res.json({ success: true, mensaje: 'Producto actualizado correctamente' });
    }
  });
});

// 5. ELIMINAR UN PRODUCTO (soft delete)
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE productos SET estado = "eliminado", fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?';

  db.run(query, [id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Producto no encontrado' });
    } else {
      res.json({ success: true, mensaje: 'Producto eliminado correctamente' });
    }
  });
});

// 6. BUSCAR PRODUCTOS POR NOMBRE O CATEGORÍA
app.get('/api/productos/buscar/:termino', (req, res) => {
  const { termino } = req.params;
  const query = `SELECT * FROM productos 
                 WHERE (nombre LIKE ? OR categoria LIKE ? OR descripcion LIKE ?) 
                 AND estado = 'activo'
                 ORDER BY fecha_creacion DESC`;
  
  const search = `%${termino}%`;
  
  db.all(query, [search, search, search], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        success: true,
        total: rows.length,
        datos: rows
      });
    }
  });
});

// 7. OBTENER ESTADÍSTICAS
app.get('/api/estadisticas', (req, res) => {
  db.all(`SELECT 
          COUNT(*) as total_productos,
          SUM(cantidad) as cantidad_total,
          AVG(precio) as precio_promedio,
          MIN(precio) as precio_minimo,
          MAX(precio) as precio_maximo
          FROM productos WHERE estado = 'activo'`, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true, datos: rows[0] });
    }
  });
});

// ==================== SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Panel de administración: http://localhost:${PORT}/admin.html`);
});

// Cerrar conexión con BD al terminar
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('✅ Conexión a la BD cerrada');
    }
  });
  process.exit(0);
});
