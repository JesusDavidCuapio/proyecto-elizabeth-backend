const ReporteProducto = require('../models/ReporteProducto');

const reporteProductoController = {
  
  async crearReporte(req, res) {
    try {
      const { id_producto, id_empleado, tipo_reporte, descripcion } = req.body;
      if (!id_producto || !id_empleado || !tipo_reporte || !descripcion) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
      }
      await ReporteProducto.crearReporte({ id_producto, id_empleado, tipo_reporte, descripcion });
      res.json({ success: true, message: 'Reporte creado correctamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al crear reporte', error });
    }
  },

  async obtenerReportes(req, res) {
    try {
      const reportes = await ReporteProducto.obtenerReportes();
      res.json({ success: true, data: reportes });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener reportes', error });
    }
  }
};

module.exports = reporteProductoController;