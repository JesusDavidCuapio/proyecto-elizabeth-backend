const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Importar la conexión a la base de datos
require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas
app.use('/api/empleados', require('./routes/empleados'));
app.use('/api/inventario', require('./routes/inventario'));
app.use('/api/ventas', require('./routes/ventas'));
app.use('/api/recepcion', require('./routes/recepcion'));
app.use('/api/actualizacion', require('./routes/actualizacion'));
app.use('/api/reporte-ventas', require('./routes/reporte-ventas'));
app.use('/api/reportes-productos', require('./routes/reportes-productos'));

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente - Tienda Elizabeth',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});