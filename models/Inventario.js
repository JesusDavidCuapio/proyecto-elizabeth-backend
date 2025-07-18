const db = require('../config/database');

class Inventario {
  static async obtenerTodos() {
    try {
      const query = `
        SELECT 
          id_producto as id,
          codigo,
          nombre,
          tipo_producto,
          precio,
          stock_actual as cantidad,
          stock_minimo,
          unidad_medida,
          fecha_creacion,
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
      console.error('Error al obtener inventario:', error);
      throw error;
    }
  }

  static async obtenerPorCodigo(codigo) {
    try {
      const query = `
        SELECT 
          id_producto as id,
          codigo,
          nombre,
          precio,
          stock_actual as cantidad,
          stock_minimo,
          fecha_creacion,
          CASE 
            WHEN stock_actual <= stock_minimo THEN 'Bajo stock'
            ELSE 'Stock normal'
          END as estado_stock
        FROM productos 
        WHERE codigo = ? AND activo = 1
      `;
      
      const [rows] = await db.execute(query, [codigo]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }

  static async buscarPorNombre(nombre) {
    try {
      const query = `
        SELECT 
          id_producto as id,
          codigo,
          nombre,
          precio,
          stock_actual as cantidad,
          stock_minimo,
          fecha_creacion,
          CASE 
            WHEN stock_actual <= stock_minimo THEN 'Bajo stock'
            ELSE 'Stock normal'
          END as estado_stock
        FROM productos 
        WHERE (nombre LIKE ? OR codigo LIKE ?) AND activo = 1
        ORDER BY nombre ASC
      `;
      
      const termino = `%${nombre}%`;
      const [rows] = await db.execute(query, [termino, termino]);
      return rows;
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }
}

module.exports = Inventario;