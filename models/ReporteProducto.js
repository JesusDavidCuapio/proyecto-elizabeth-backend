const db = require('../config/database');

const ReporteProducto = {
  async crearReporte({ id_producto, id_empleado, tipo_reporte, descripcion }) {
  const [result] = await db.execute(
    `INSERT INTO reportes_productos (id_producto, id_empleado, tipo_reporte, descripcion, estado)
     VALUES (?, ?, ?, ?, 'Pendiente')`,
    [id_producto, id_empleado, tipo_reporte, descripcion]
  );
  return result;
},

  async obtenerReportes() {
    const [rows] = await db.execute(`
      SELECT r.id_reporte, p.codigo, p.nombre AS nombre_producto, 
             p.tipo_producto, r.tipo_reporte, r.descripcion,
             e.nombre_completo AS empleado_reporta, 
             DATE_FORMAT(r.fecha_reporte, '%Y-%m-%d') AS fecha_reporte, r.estado
      FROM reportes_productos r
      JOIN productos p ON r.id_producto = p.id_producto
      JOIN empleados e ON r.id_empleado = e.id_empleado
      ORDER BY r.fecha_reporte DESC
    `);
    return rows;
  }
};

module.exports = ReporteProducto;