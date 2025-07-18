const express = require('express');
const router = express.Router();
const actualizacionController = require('../controllers/actualizacionController');

// Obtener todos los productos para selección
router.get('/productos', actualizacionController.obtenerProductos);

// Buscar productos por término
router.get('/productos/buscar', actualizacionController.buscarProductos);

// Obtener producto por ID
router.get('/productos/:id', actualizacionController.obtenerProductoPorId);

// Actualizar existencias de un producto
router.put('/actualizar', actualizacionController.actualizarExistencias);

// Obtener historial de ajustes
router.get('/historial', actualizacionController.obtenerHistorial);

module.exports = router;