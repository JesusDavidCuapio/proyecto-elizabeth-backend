const Inventario = require('../models/Inventario');

const inventarioController = {
  async obtenerInventario(req, res) {
    try {
      console.log('Solicitando inventario completo...');
      const productos = await Inventario.obtenerTodos();
      
      console.log(`Inventario obtenido: ${productos.length} productos`);
      
      res.json({
        success: true,
        data: productos,
        message: 'Inventario obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el inventario',
        error: error.message
      });
    }
  },

  async buscarProductos(req, res) {
    try {
      const { busqueda } = req.query;
      
      if (!busqueda) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
      }

      console.log('Buscando productos con término:', busqueda);
      const productos = await Inventario.buscarPorNombre(busqueda);
      
      res.json({
        success: true,
        data: productos,
        message: `Se encontraron ${productos.length} productos`
      });
    } catch (error) {
      console.error('Error al buscar productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar productos',
        error: error.message
      });
    }
  },

  async obtenerProductoPorCodigo(req, res) {
    try {
      const { codigo } = req.params;
      
      console.log('Buscando producto con código:', codigo);
      const producto = await Inventario.obtenerPorCodigo(codigo);
      
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
        message: 'Error al obtener producto',
        error: error.message
      });
    }
  }
};

module.exports = inventarioController;