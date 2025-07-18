const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporteProductoController');

// Crear un reporte
router.post('/', controller.crearReporte);

// Obtener todos los reportes
router.get('/', controller.obtenerReportes);

module.exports = router;