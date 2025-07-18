const express = require('express');
const router = express.Router();
const controller = require('../controllers/reporteVentasController');

router.get('/ventas-por-dia', controller.ventasPorDia);
router.get('/productos-mas-vendidos', controller.productosMasVendidos);
router.get('/rendimiento-empleado', controller.rendimientoPorEmpleado);
router.get('/ingresos-por-dia', controller.ingresosPorDia);
router.get('/productos-mas-vendidos-general', controller.productosMasVendidosGeneral);

// ...existing code...

module.exports = router;