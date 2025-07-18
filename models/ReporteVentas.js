const db = require('../config/database');

class ReporteVentas {
  static async ventasPorDia(fechaInicio, fechaFin) {
    const [rows] = await db.execute(
      `SELECT DATE(fecha_venta) as fecha, SUM(total) as total_ventas
       FROM ventas
       WHERE fecha_venta BETWEEN ? AND ?
       GROUP BY DATE(fecha_venta)
       ORDER BY fecha DESC`,
      [fechaInicio, fechaFin]
    );
    return rows;
  }

  /**
 * Obtener productos más vendidos (sin filtro de fecha)
 */
static async productosMasVendidosGeneral() {
  try {
    const [rows] = await db.execute(
      `SELECT p.nombre, SUM(dv.cantidad) as cantidad_vendida
       FROM detalle_ventas dv
       JOIN productos p ON dv.id_producto = p.id_producto
       JOIN ventas v ON dv.id_venta = v.id_venta
       WHERE v.estado = 'Completada'
       GROUP BY p.id_producto
       ORDER BY cantidad_vendida DESC
       LIMIT 10`
    );
    return rows;
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    throw error;
  }
}

  static async productosMasVendidos(fechaInicio, fechaFin) {
    const [rows] = await db.execute(
      `SELECT p.nombre, SUM(dv.cantidad) as cantidad_vendida
       FROM detalle_ventas dv
       JOIN productos p ON dv.id_producto = p.id_producto
       JOIN ventas v ON dv.id_venta = v.id_venta
       WHERE v.fecha_venta BETWEEN ? AND ?
       GROUP BY p.id_producto
       ORDER BY cantidad_vendida DESC
       LIMIT 10`,
      [fechaInicio, fechaFin]
    );
    return rows;
  }

  static async rendimientoPorEmpleado(fechaInicio, fechaFin) {
    const [rows] = await db.execute(
      `SELECT e.nombre_completo, COUNT(v.id_venta) as ventas_realizadas, SUM(v.total) as total_vendido
       FROM ventas v
       JOIN empleados e ON v.id_empleado = e.id_empleado
       WHERE v.fecha_venta BETWEEN ? AND ?
       GROUP BY e.id_empleado
       ORDER BY total_vendido DESC`,
      [fechaInicio, fechaFin]
    );
    return rows;
  }

  static async ingresosPorDia(fechaInicio, fechaFin) {
    const [rows] = await db.execute(
      `SELECT DATE(fecha_venta) as fecha, SUM(total) as ingresos
       FROM ventas
       WHERE fecha_venta BETWEEN ? AND ?
       GROUP BY DATE(fecha_venta)
       ORDER BY fecha DESC`,
      [fechaInicio, fechaFin]
    );
    return rows;
  }
}

module.exports = ReporteVentas;