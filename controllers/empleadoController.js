const Empleado = require('../models/Empleado');

const empleadoController = {
  async crearEmpleado(req, res) {
    try {
      console.log('Datos recibidos:', req.body);
      const resultado = await Empleado.crear(req.body);
      res.status(201).json({
        success: true,
        message: 'Empleado creado exitosamente',
        data: { id: resultado.insertId }
      });
    } catch (error) {
      console.error('Error creando empleado:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({
          success: false,
          message: 'El ID de empleado o usuario ya existe'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: error.message
        });
      }
    }
  },

  async login(req, res) {
    try {
      const { usuario, contrasena } = req.body;
      
      if (!usuario || !contrasena) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }
      
      const empleado = await Empleado.validarCredenciales(usuario, contrasena);
      
      if (!empleado) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
      
      // Generar token simple (en producción usar JWT)
      const token = Buffer.from(`${empleado.id_empleado}:${Date.now()}`).toString('base64');
      
      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          empleado: {
            id: empleado.id_empleado,
            nombre: empleado.nombre_completo,
            usuario: empleado.usuario,
            cargo: empleado.cargo
          },
          token,
          cargo: empleado.cargo
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener todos los empleados
  async obtenerEmpleados(req, res) {
    try {
      const empleados = await Empleado.obtenerTodos();
      res.json({
        success: true,
        message: 'Empleados obtenidos exitosamente',
        data: empleados
      });
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Obtener empleado por ID
  async obtenerEmpleadoPorId(req, res) {
    try {
      const { id } = req.params;
      const empleado = await Empleado.obtenerPorId(id);
      
      if (!empleado) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }
      
      res.json({
        success: true,
        message: 'Empleado obtenido exitosamente',
        data: empleado
      });
    } catch (error) {
      console.error('Error al obtener empleado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Actualizar empleado
  async actualizarEmpleado(req, res) {
    try {
      const { id } = req.params;
      const { nombre_completo, usuario, telefono, cargo } = req.body;
      
      // Validar campos requeridos
      if (!nombre_completo || !usuario || !telefono || !cargo) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }
      
      // Verificar si el empleado existe
      const empleadoExistente = await Empleado.obtenerPorId(id);
      if (!empleadoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }
      
      // Verificar si el usuario ya existe (excluyendo el actual)
      const usuarioExiste = await Empleado.verificarUsuarioExistente(usuario, id);
      if (usuarioExiste) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
      
      // Actualizar empleado
      await Empleado.actualizar(id, { nombre_completo, usuario, telefono, cargo });
      
      res.json({
        success: true,
        message: 'Empleado actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

   // Eliminar empleado (eliminación completa)
  async eliminarEmpleado(req, res) {
    try {
      const { id } = req.params;
      
      // Verificar si el empleado existe
      const empleadoExistente = await Empleado.obtenerPorId(id);
      if (!empleadoExistente) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado'
        });
      }
      
      // Eliminar empleado permanentemente
      const result = await Empleado.eliminar(id);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Empleado no encontrado o ya eliminado'
        });
      }
      
      res.json({
        success: true,
        message: 'Empleado eliminado permanentemente'
      });
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      
      // Manejo específico para errores de clave foránea
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          success: false,
          message: 'No se puede eliminar el empleado porque tiene registros asociados'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Buscar empleados
  async buscarEmpleados(req, res) {
    try {
      const { termino } = req.query;
      
      if (!termino) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
      }
      
      const empleados = await Empleado.buscar(termino);
      
      res.json({
        success: true,
        message: 'Búsqueda completada',
        data: empleados
      });
    } catch (error) {
      console.error('Error al buscar empleados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  // Filtrar empleados por cargo
  async filtrarEmpleadosPorCargo(req, res) {
    try {
      const { cargo } = req.params;
      
      const cargosValidos = ['Cajero', 'Auxiliar', 'Almacenista', 'Administrador'];
      if (!cargosValidos.includes(cargo)) {
        return res.status(400).json({
          success: false,
          message: 'Cargo no válido'
        });
      }
      
      const empleados = await Empleado.filtrarPorCargo(cargo);
      
      res.json({
        success: true,
        message: 'Empleados filtrados exitosamente',
        data: empleados
      });
    } catch (error) {
      console.error('Error al filtrar empleados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = empleadoController;