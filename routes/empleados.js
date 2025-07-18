const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');

// POST /api/empleados - Crear empleado
router.post('/', empleadoController.crearEmpleado);

// POST /api/empleados/login - Login
router.post('/login', empleadoController.login);

// GET /api/empleados - Obtener todos los empleados
router.get('/', empleadoController.obtenerEmpleados);

// GET /api/empleados/buscar - Buscar empleados
router.get('/buscar', empleadoController.buscarEmpleados);

// GET /api/empleados/cargo/:cargo - Filtrar por cargo
router.get('/cargo/:cargo', empleadoController.filtrarEmpleadosPorCargo);

// GET /api/empleados/:id - Obtener empleado por ID
router.get('/:id', empleadoController.obtenerEmpleadoPorId);

// PUT /api/empleados/:id - Actualizar empleado
router.put('/:id', empleadoController.actualizarEmpleado);

// DELETE /api/empleados/:id - Eliminar empleado
router.delete('/:id', empleadoController.eliminarEmpleado);

module.exports = router;