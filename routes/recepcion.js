const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcionController');

// Verificar si un producto existe
router.get('/verificar/:codigo', recepcionController.verificarProducto);

// Recibir producto existente (aumentar stock)
router.post('/producto-existente', recepcionController.recibirProductoExistente);

// Crear producto nuevo
router.post('/producto-nuevo', recepcionController.crearProductoNuevo);

// Buscar productos para autocompletado
router.get('/buscar-productos', recepcionController.buscarProductosAutocompletado);

// Obtener historial de recepciones
router.get('/historial', recepcionController.obtenerHistorial);

// Verificar código y generar sugerencia
router.get('/verificar-codigo', recepcionController.verificarCodigo);

module.exports = router;