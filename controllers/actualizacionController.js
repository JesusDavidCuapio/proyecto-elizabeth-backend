const ActualizacionExistencias = require('../models/ActualizacionExistencias');

const actualizacionController = {
  
  /**
   * Obtener todos los productos para selección
   */
  async obtenerProductos(req, res) {
    try {
      const productos = await ActualizacionExistencias.obtenerProductosParaActualizar();
      
      res.json({
        success: true,
        data: productos,
        message: `${productos.length} productos obtenidos`
      });
      
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Buscar productos por término
   */
  async buscarProductos(req, res) {
    try {
      const termino = req.query.busqueda || req.query.termino || '';
      
      if (!termino || termino.length < 2) {
        return res.json({
          success: true,
          data: [],
          message: 'Término muy corto'
        });
      }
      
      const productos = await ActualizacionExistencias.buscarProductos(termino);
      
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
  },
  
  /**
   * Obtener producto por ID
   */
  async obtenerProductoPorId(req, res) {
    try {
      const { id } = req.params;
      
      const producto = await ActualizacionExistencias.obtenerProductoPorId(id);
      
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: producto,
        message: 'Producto encontrado'
      });
      
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Actualizar existencias de un producto
   */
  async actualizarExistencias(req, res) {
    try {
      const { 
        id_producto, 
        tipo_ajuste, 
        cantidad, 
        motivo, 
        observaciones, 
        id_empleado 
      } = req.body;
      
      // Validar datos requeridos
      if (!id_producto || !tipo_ajuste || !cantidad || !motivo || !id_empleado) {
        return res.status(400).json({
          success: false,
          message: 'Producto, tipo de ajuste, cantidad, motivo y empleado son requeridos'
        });
      }
      
      // Validar tipo de ajuste
      const tiposValidos = ['aumentar', 'reducir', 'establecer'];
      if (!tiposValidos.includes(tipo_ajuste)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de ajuste no válido'
        });
      }
      
      // Validar cantidad
      if (cantidad < 0) {
        return res.status(400).json({
          success: false,
          message: 'La cantidad no puede ser negativa'
        });
      }
      
      const resultado = await ActualizacionExistencias.actualizarExistencias({
        id_producto: parseInt(id_producto),
        tipo_ajuste,
        cantidad: parseInt(cantidad),
        motivo,
        observaciones,
        id_empleado
      });
      
      res.status(200).json({
        success: true,
        message: 'Existencias actualizadas exitosamente',
        data: resultado
      });
      
    } catch (error) {
      console.error('Error al actualizar existencias:', error);
      
      if (error.message === 'Producto no encontrado') {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
      
      if (error.message === 'Tipo de ajuste no válido') {
        return res.status(400).json({
          success: false,
          message: 'Tipo de ajuste no válido'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Obtener historial de ajustes
   */
  async obtenerHistorial(req, res) {
    try {
      const { limite = 50 } = req.query;
      
      const historial = await ActualizacionExistencias.obtenerHistorialAjustes(parseInt(limite));
      
      res.json({
        success: true,
        data: historial,
        message: `Historial de ajustes obtenido (${historial.length} registros)`
      });
      
    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = actualizacionController;