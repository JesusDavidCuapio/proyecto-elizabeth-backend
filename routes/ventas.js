const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Rutas de ventas
router.post('/', ventaController.registrarVenta);
router.get('/', ventaController.obtenerVentas);
router.get('/:id', ventaController.obtenerVentaPorId);
router.get('/detalle/todo', ventaController.obtenerVentasDetalle);
router.get('/', ventaController.obtenerVentas);

module.exports = router;