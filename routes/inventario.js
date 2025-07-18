const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Rutas del inventario
router.get('/', inventarioController.obtenerInventario);
router.get('/buscar', inventarioController.buscarProductos);
router.get('/:codigo', inventarioController.obtenerProductoPorCodigo);

module.exports = router;