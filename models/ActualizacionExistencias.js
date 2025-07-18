const db = require('../config/database');

class ActualizacionExistencias {
  
  /**
   * Obtener todos los productos para selección
   */
  static async obtenerProductosParaActualizar() {
    try {
      const query = `
        SELECT 
          id_producto,
          codigo,
          nombre,
          precio,
          stock_actual,
          stock_minimo,
          CASE 
            WHEN stock_actual <= stock_minimo THEN 'Bajo stock'
            ELSE 'Stock normal'
          END as estado_stock
        FROM productos 
        WHERE activo = 1
        ORDER BY nombre ASC
      `;
      
      const [rows] = await db.execute(query);
      return rows;
      
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }
  
  /**
   * Actualizar existencias de un producto
   */
  static async actualizarExistencias(actualizacionData) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { 
        id_producto, 
        tipo_ajuste, 
        cantidad, 
        motivo, 
        observaciones, 
        id_empleado 
      } = actualizacionData;
      
      // Obtener información actual del producto
      const queryProducto = `
        SELECT 
          codigo,
          nombre,
          stock_actual,
          stock_minimo
        FROM productos 
        WHERE id_producto = ? AND activo = 1
      `;
      
      const [productoResult] = await connection.execute(queryProducto, [id_producto]);
      
      if (productoResult.length === 0) {
        throw new Error('Producto no encontrado');
      }
      
      const producto = productoResult[0];
      const stockAnterior = producto.stock_actual;
      let stockNuevo;
      let tipoMovimiento;
      
      // Calcular nuevo stock según tipo de ajuste
      switch (tipo_ajuste) {
        case 'aumentar':
          stockNuevo = stockAnterior + cantidad;
          tipoMovimiento = 'Entrada';
          break;
        case 'reducir':
          stockNuevo = Math.max(0, stockAnterior - cantidad);
          tipoMovimiento = 'Salida';
          break;
        case 'establecer':
          stockNuevo = cantidad;
          tipoMovimiento = cantidad > stockAnterior ? 'Entrada' : 'Salida';
          break;
        default:
          throw new Error('Tipo de ajuste no válido');
      }
      
      // Actualizar stock en la tabla productos
      const queryActualizar = `
        UPDATE productos 
        SET stock_actual = ?
        WHERE id_producto = ?
      `;
      
      await connection.execute(queryActualizar, [stockNuevo, id_producto]);
      
      // Registrar el movimiento en movimientos_inventario
      const cantidadMovimiento = Math.abs(stockNuevo - stockAnterior);
      const motivoCompleto = `${motivo}${observaciones ? ` - ${observaciones}` : ''}`;
      
      const queryMovimiento = `
        INSERT INTO movimientos_inventario 
        (id_producto, id_empleado, tipo_movimiento, cantidad, motivo)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await connection.execute(queryMovimiento, [
        id_producto,
        id_empleado,
        tipoMovimiento,
        cantidadMovimiento,
        motivoCompleto
      ]);
      
      await connection.commit();
      
      return {
        producto: {
          codigo: producto.codigo,
          nombre: producto.nombre
        },
        ajuste: {
          tipo: tipo_ajuste,
          stock_anterior: stockAnterior,
          stock_nuevo: stockNuevo,
          diferencia: stockNuevo - stockAnterior,
          motivo: motivo,
          observaciones: observaciones
        },
        mensaje: 'Existencias actualizadas exitosamente'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener historial de ajustes de inventario
   */
  static async obtenerHistorialAjustes(limite = 50) {
    try {
      const query = `
        SELECT 
          m.id_movimiento,
          p.codigo,
          p.nombre as producto_nombre,
          p.tipo_producto,
          p.unidad_medida,
          m.tipo_movimiento,
          m.cantidad,
          m.motivo,
          e.nombre_completo as empleado_nombre,
          DATE_FORMAT(m.fecha_movimiento, '%Y-%m-%d') as fecha_movimiento
        FROM movimientos_inventario m
        JOIN productos p ON m.id_producto = p.id_producto
        JOIN empleados e ON m.id_empleado = e.id_empleado
        WHERE m.motivo NOT LIKE '%Venta%' 
        AND m.motivo NOT LIKE '%Recepción%'
        ORDER BY m.fecha_movimiento DESC
        LIMIT ?
      `;
      
      const [rows] = await db.execute(query, [limite]);
      return rows;
      
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }
  
  /**
   * Buscar productos por código o nombre
   */
  static async buscarProductos(termino) {
    try {
      const query = `
        SELECT 
  id_producto,
  codigo,
  nombre,
  precio,
  stock_actual,
  stock_minimo,
  unidad_medida,
  tipo_producto,
  CASE 
    WHEN stock_actual <= stock_minimo THEN 'Bajo stock'
    ELSE 'Stock normal'
  END as estado_stock
FROM productos 
        WHERE (nombre LIKE ? OR codigo LIKE ?) 
        AND activo = 1
        ORDER BY 
          CASE 
            WHEN codigo LIKE ? THEN 1
            WHEN nombre LIKE ? THEN 2
            ELSE 3
          END,
          nombre ASC
        LIMIT 10
      `;
      
      const terminoBusqueda = `%${termino}%`;
      const terminoExacto = `${termino}%`;
      
      const [rows] = await db.execute(query, [
        terminoBusqueda, 
        terminoBusqueda,
        terminoExacto,
        terminoExacto
      ]);
      
      return rows;
      
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }
  
  /**
   * Obtener producto por ID
   */
  static async obtenerProductoPorId(id_producto) {
    try {
      const query = `
        SELECT 
          id_producto,
          codigo,
          nombre,
          precio,
          stock_actual,
          stock_minimo,
          CASE 
            WHEN stock_actual <= stock_minimo THEN 'Bajo stock'
            ELSE 'Stock normal'
          END as estado_stock
        FROM productos 
        WHERE id_producto = ? AND activo = 1
      `;
      
      const [rows] = await db.execute(query, [id_producto]);
      return rows[0] || null;
      
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }
}

module.exports = ActualizacionExistencias;