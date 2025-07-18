const RecepcionProductos = require('../models/RecepcionProductos');

const recepcionController = {
  
  /**
   * Verificar si un producto existe
   */
  async verificarProducto(req, res) {
    try {
      const { codigo } = req.params;

      if (!codigo) {
        return res.status(400).json({
          success: false,
          message: 'Código de producto requerido'
        });
      }

      const producto = await RecepcionProductos.verificarProductoExistente(codigo);

      if (producto) {
        res.json({
          success: true,
          exists: true,
          data: {
            id_producto: producto.id_producto,
            codigo: producto.codigo,
            nombre: producto.nombre,
            precio: producto.precio,
            stock_actual: producto.stock_actual,
            stock_minimo: producto.stock_minimo,
            unidad_medida: producto.unidad_medida,
            tipo_producto: producto.tipo_producto,
            activo: producto.activo
          },
          message: 'Producto encontrado'
        });
      } else {
        res.json({
          success: true,
          exists: false,
          message: 'Producto no encontrado - puede crear uno nuevo'
        });
      }

    } catch (error) {
      console.error('Error al verificar producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Verificar código y generar sugerencia
   */
  async verificarCodigo(req, res) {
    try {
      const { codigo } = req.query;

      if (!codigo) {
        return res.status(400).json({
          success: false,
          message: 'Código requerido'
        });
      }

      const resultado = await RecepcionProductos.verificarYGenerarCodigo(codigo);

      res.json({
        success: true,
        data: resultado
      });

    } catch (error) {
      console.error('Error al verificar código:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Recibir producto existente (aumentar stock)
   */
  async recibirProductoExistente(req, res) {
    try {
      const { codigo, cantidad_recibida, fecha_recepcion, observaciones, id_empleado } = req.body;

      // Validar datos requeridos
      if (!codigo || !cantidad_recibida || !fecha_recepcion || !id_empleado) {
        return res.status(400).json({
          success: false,
          message: 'Código, cantidad, fecha y empleado son requeridos'
        });
      }

      // Validar cantidad
      if (cantidad_recibida <= 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad debe ser mayor a 0'
        });
      }

      // Buscar producto por código
      const producto = await RecepcionProductos.verificarProductoExistente(codigo);
      
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      const resultado = await RecepcionProductos.recibirProductoExistente({
        id_producto: producto.id_producto,
        cantidad_recibida: parseInt(cantidad_recibida),
        fecha_recepcion,
        observaciones,
        id_empleado
      });

      res.status(201).json({
        success: true,
        message: 'Stock actualizado exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('Error al recibir producto:', error);

      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Crear producto nuevo
   */
  async crearProductoNuevo(req, res) {
    try {
      const { 
        codigo, 
        nombre, 
        precio, 
        cantidad_inicial, 
        stock_minimo, 
        unidad_medida,
        tipo_producto,
        fecha_recepcion, 
        observaciones, 
        id_empleado 
      } = req.body;

      // Validar datos requeridos
      if (!codigo || !nombre || !precio || !cantidad_inicial || !fecha_recepcion || !id_empleado || !unidad_medida || !tipo_producto) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Validar valores numéricos
      if (precio <= 0 || cantidad_inicial <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Precio y cantidad inicial deben ser mayores a 0'
        });
      }

      const resultado = await RecepcionProductos.crearProductoNuevo({
        codigo: codigo.toUpperCase(),
        nombre,
        precio: parseFloat(precio),
        cantidad_inicial: parseInt(cantidad_inicial),
        stock_minimo: parseInt(stock_minimo) || 5,
        unidad_medida,
        tipo_producto,
        fecha_recepcion,
        observaciones,
        id_empleado
      });

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: resultado
      });

    } catch (error) {
      console.error('Error al crear producto:', error);

      if (error.message === 'El código de producto ya existe') {
        return res.status(400).json({
          success: false,
          message: 'El código de producto ya existe'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Obtener historial de recepciones
   */
  async obtenerHistorial(req, res) {
    try {
      const { limite = 50 } = req.query;

      const historial = await RecepcionProductos.obtenerHistorialRecepciones(parseInt(limite));

      res.json({
        success: true,
        data: historial,
        message: `Historial de recepciones obtenido (${historial.length} registros)`
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Buscar productos para autocompletado
   */
  async buscarProductosAutocompletado(req, res) {
    try {
      const { termino } = req.query;

      if (!termino || termino.length < 2) {
        return res.json({
          success: true,
          data: [],
          message: 'Término muy corto'
        });
      }

      const productos = await RecepcionProductos.buscarProductosAutocompletado(termino);

      res.json({
        success: true,
        data: productos,
        message: `${productos.length} productos encontrados`
      });

    } catch (error) {
      console.error('Error al buscar productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = recepcionController;