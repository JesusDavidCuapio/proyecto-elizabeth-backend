const db = require('../config/database');

class Venta {
  static async crear(ventaData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { empleado_id, productos, total } = ventaData;
      
      // Insertar venta principal (usando tu estructura)
      const queryVenta = `
        INSERT INTO ventas (id_empleado, total, pago_cliente, cambio, estado)
        VALUES (?, ?, ?, ?, 'Completada')
      `;
      
      const [resultVenta] = await connection.execute(queryVenta, [empleado_id, total, ventaData.pago_cliente, ventaData.cambio]);
      const ventaId = resultVenta.insertId;
      
      // Insertar detalles de venta
      for (const producto of productos) {
        // Verificar stock disponible
        const queryStock = `
          SELECT stock_actual, nombre FROM productos 
          WHERE id_producto = ? AND activo = 1
        `;
        
        const [stockResult] = await connection.execute(queryStock, [producto.id]);
        
        if (stockResult.length === 0) {
          throw new Error(`Producto ${producto.nombre} no encontrado`);
        }
        
        if (stockResult[0].stock_actual < producto.cantidad) {
          throw new Error(`Stock insuficiente para ${stockResult[0].nombre}. Disponible: ${stockResult[0].stock_actual}, Solicitado: ${producto.cantidad}`);
        }
        
        // Insertar detalle de venta
        const queryDetalle = `
          INSERT INTO detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        const subtotal = producto.cantidad * producto.precio;
        
        await connection.execute(queryDetalle, [
          ventaId,
          producto.id,
          producto.cantidad,
          producto.precio,
          subtotal
        ]);
      }
      
      await connection.commit();
      return { 
        id: ventaId, 
        mensaje: 'Venta registrada exitosamente',
        productos_vendidos: productos.length
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  static async obtenerTodas() {
    try {
      const query = `
        SELECT 
          v.id_venta,
          v.id_empleado,
          e.nombre_completo as empleado_nombre,
          v.fecha_venta,
          v.total,
          v.estado,
          COUNT(dv.id_detalle) as total_productos
        FROM ventas v
        JOIN empleados e ON v.id_empleado = e.id_empleado
        LEFT JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
        GROUP BY v.id_venta
        ORDER BY v.fecha_venta DESC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener ventas:', error);
      throw error;
    }
  }
  
  static async obtenerPorId(id) {
    try {
      const queryVenta = `
        SELECT 
          v.*,
          e.nombre_completo as empleado_nombre
        FROM ventas v
        JOIN empleados e ON v.id_empleado = e.id_empleado
        WHERE v.id_venta = ?
      `;
      
      const [ventaRows] = await db.execute(queryVenta, [id]);
      
      if (ventaRows.length === 0) {
        return null;
      }
      
      const queryDetalles = `
        SELECT 
          dv.*,
          p.nombre as producto_nombre,
          p.codigo as producto_codigo
        FROM detalle_ventas dv
        JOIN productos p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = ?
        ORDER BY dv.id_detalle
      `;
      
      const [detalleRows] = await db.execute(queryDetalles, [id]);
      
      return {
        ...ventaRows[0],
        detalles: detalleRows
      };
    } catch (error) {
      console.error('Error al obtener venta:', error);
      throw error;
    }
  }


/**
 * Obtener todas las ventas con detalles completos
 */
static async obtenerVentasCompletas() {
  try {
    const query = `
      SELECT 
        v.id_venta,
        DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i:%s') as fecha_venta,
        v.total,
        v.pago_cliente,
        v.cambio,
        e.nombre_completo as empleado_nombre,
        GROUP_CONCAT(
          CONCAT(p.nombre, ' (', dv.cantidad, ' ', p.unidad_medida, ')')
          SEPARATOR ', '
        ) as productos,
        GROUP_CONCAT(DISTINCT p.tipo_producto SEPARATOR ', ') as tipos_producto
      FROM ventas v
      JOIN empleados e ON v.id_empleado = e.id_empleado
      JOIN detalle_ventas dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      WHERE v.estado = 'Completada'
      GROUP BY v.id_venta
      ORDER BY v.fecha_venta DESC
    `;
    
    const [rows] = await db.execute(query);
    return rows;
    
  } catch (error) {
    console.error('Error al obtener ventas completas:', error);
    throw error;
  }
}

  
  static async verificarStock(productos) {
    try {
      for (const producto of productos) {
        const query = `
          SELECT stock_actual, nombre 
          FROM productos 
          WHERE id_producto = ? AND activo = 1
        `;
        
        const [rows] = await db.execute(query, [producto.id]);
        
        if (rows.length === 0) {
          throw new Error(`Producto ${producto.nombre} no encontrado`);
        }
        
        if (rows[0].stock_actual < producto.cantidad) {
          throw new Error(`Stock insuficiente para ${rows[0].nombre}. Stock actual: ${rows[0].stock_actual}, solicitado: ${producto.cantidad}`);
        }
      }
      
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Venta;