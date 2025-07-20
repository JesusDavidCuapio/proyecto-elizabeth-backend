const Venta = require('../models/Venta');
const db = require('../config/database');

const ventaController = {
  async registrarVenta(req, res) {
    try {
      const { empleado_id, productos, pago_cliente } = req.body;
      
      console.log('Datos de venta recibidos:', { empleado_id, productos: productos?.length, pago_cliente });
      
      // Validar datos
      if (!empleado_id || !productos || productos.length === 0 || !pago_cliente) {
        return res.status(400).json({
          success: false,
          message: 'Datos incompletos: empleado_id, productos y pago_cliente son requeridos'
        });
      }
      
      // Calcular total
      const total = productos.reduce((sum, producto) => {
        return sum + (producto.precio * producto.cantidad);
      }, 0);

      // Calcular cambio
      const cambio = pago_cliente - total;
      
      // Validar que el pago sea suficiente
      if (cambio < 0) {
        return res.status(400).json({
          success: false,
          message: 'El pago del cliente es insuficiente'
        });
      }
      
      const ventaData = {
        empleado_id,
        productos,
        total,
        pago_cliente,
        cambio
      };
      
      const resultado = await Venta.crear(ventaData);
      
      console.log('Venta registrada exitosamente:', resultado);
      
      res.status(201).json({
        success: true,
        message: resultado.mensaje,
        data: {
          id_venta: resultado.id,
          total: total.toFixed(2),
          productos_vendidos: resultado.productos_vendidos
        }
      });
      
    } catch (error) {
      console.error('Error al registrar venta:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error interno del servidor'
      });
    }
  },

  /**
 * Obtener ventas registradas con detalles completos
 */
async obtenerVentasRegistradas(req, res) {
  try {
    const ventas = await Venta.obtenerVentasCompletas();
    
    console.log('Ventas obtenidas:', ventas.length);
    console.log('Primera venta fecha:', ventas[0]?.fecha_venta);
    
    res.json({
      success: true,
      data: ventas
    });
    
  } catch (error) {
    console.error('Error al obtener ventas registradas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ventas registradas'
    });
  }
},

  
  async obtenerVentas(req, res) {
  try {
    // Cambiar para usar el nuevo método que obtiene datos completos
    const ventas = await Venta.obtenerVentasCompletas();
    
    res.json({
      success: true,
      data: ventas
    });
    
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las ventas'
    });
  }
},
  
  async obtenerVentaPorId(req, res) {
    try {
      const { id } = req.params;
      const venta = await Venta.obtenerPorId(id);
      
      if (!venta) {
        return res.status(404).json({
          success: false,
          message: 'Venta no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: venta,
        message: 'Venta obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener venta:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener venta'
      });
    }
  },

  async obtenerVentasDetalle(req, res) {
    try {
      const [rows] = await db.execute('SELECT * FROM vista_ventas_detalle');
      res.json({ success: true, data: rows });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener ventas detalladas', error });
    }
  }
};

module.exports = ventaController;