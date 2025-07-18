const db = require('../config/database');

class RecepcionProductos {
  
  /**
   * Recibir producto existente (aumentar stock)
   */
  static async recibirProductoExistente(recepcionData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { id_producto, cantidad_recibida, fecha_recepcion, observaciones, id_empleado } = recepcionData;

      // Verificar si el producto existe
      const queryProducto = `
        SELECT id_producto, nombre, stock_actual 
        FROM productos 
        WHERE id_producto = ? AND activo = 1
      `;
      const [productoResult] = await connection.execute(queryProducto, [id_producto]);

      if (productoResult.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const producto = productoResult[0];

      // Actualizar stock del producto
      const queryUpdateStock = `
        UPDATE productos 
        SET stock_actual = stock_actual + ? 
        WHERE id_producto = ?
      `;
      await connection.execute(queryUpdateStock, [cantidad_recibida, id_producto]);

      // Registrar la recepción
      const queryRecepcion = `
        INSERT INTO recepcion_productos 
        (id_producto, id_empleado, cantidad_recibida, fecha_recepcion, observaciones)
        VALUES (?, ?, ?, ?, ?)
      `;

      const [recepcionResult] = await connection.execute(queryRecepcion, [
        producto.id_producto,
        id_empleado,
        cantidad_recibida,
        fecha_recepcion,
        observaciones || null
      ]);

      await connection.commit();

      return {
        id_recepcion: recepcionResult.insertId,
        producto: producto.nombre,
        cantidad_anterior: producto.stock_actual,
        cantidad_recibida: cantidad_recibida,
        cantidad_nueva: producto.stock_actual + cantidad_recibida,
        mensaje: 'Producto recibido exitosamente'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Crear producto nuevo
   */
  static async crearProductoNuevo(productoData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

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
      } = productoData;

      // Verificar si el código ya existe
      const queryVerificarCodigo = `
        SELECT COUNT(*) as count FROM productos WHERE codigo = ?
      `;
      const [verificarResult] = await connection.execute(queryVerificarCodigo, [codigo]);
      
      if (verificarResult[0].count > 0) {
        throw new Error('El código de producto ya existe');
      }

      // Crear el producto
      const queryProducto = `
        INSERT INTO productos (codigo, nombre, precio, stock_actual, stock_minimo, unidad_medida, tipo_producto, fecha_creacion, activo)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)
      `;
      
      const [productoResult] = await connection.execute(queryProducto, [
        codigo,
        nombre,
        precio,
        cantidad_inicial,
        stock_minimo || 5,
        unidad_medida,
        tipo_producto
      ]);
      
      const id_producto = productoResult.insertId;
      
      // Registrar la recepción inicial
      const queryRecepcion = `
        INSERT INTO recepcion_productos 
        (id_producto, id_empleado, cantidad_recibida, fecha_recepcion, observaciones)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await connection.execute(queryRecepcion, [
        id_producto,
        id_empleado,
        cantidad_inicial,
        fecha_recepcion,
        observaciones || 'Producto nuevo - Stock inicial'
      ]);
      
      await connection.commit();
      
      return {
        id_producto: id_producto,
        codigo: codigo,
        nombre: nombre,
        precio: precio,
        stock_inicial: cantidad_inicial,
        unidad_medida: unidad_medida,
        tipo_producto: tipo_producto,
        mensaje: 'Producto creado y recibido exitosamente'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Verificar si un producto existe por código
   */
  static async verificarProductoExistente(codigo) {
    try {
      const query = `
        SELECT id_producto, codigo, nombre, precio, stock_actual, stock_minimo, unidad_medida, tipo_producto, activo
        FROM productos 
        WHERE codigo = ? AND activo = 1
      `;
      
      const [rows] = await db.execute(query, [codigo]);
      return rows.length > 0 ? rows[0] : null;
      
    } catch (error) {
      console.error('Error al verificar producto:', error);
      throw error;
    }
  }

  /**
   * Verificar si un código existe y generar uno nuevo si es necesario
   */
  static async verificarYGenerarCodigo(codigoBase) {
    try {
      // Verificar si el código existe
      const queryVerificar = `
        SELECT COUNT(*) as count FROM productos WHERE codigo = ?
      `;
      
      const [existeResult] = await db.execute(queryVerificar, [codigoBase]);
      
      if (existeResult[0].count === 0) {
        // El código no existe, se puede usar
        return {
          existe: false,
          codigoSugerido: codigoBase
        };
      }

      // El código existe, generar uno nuevo siguiendo el patrón PRD001, PRD010, PRD100
      const queryUltimo = `
        SELECT codigo FROM productos 
        WHERE codigo REGEXP '^PRD[0-9]{3}$' 
        ORDER BY CAST(SUBSTRING(codigo, 4) AS UNSIGNED) DESC 
        LIMIT 1
      `;
      
      const [ultimoResult] = await db.execute(queryUltimo);
      
      let siguienteNumero = 1;
      if (ultimoResult.length > 0) {
        const ultimoCodigo = ultimoResult[0].codigo;
        const numeroActual = parseInt(ultimoCodigo.substring(3));
        siguienteNumero = numeroActual + 1;
      }

      // Generar código con formato PRD001, PRD010, PRD100
      const codigoSugerido = `PRD${siguienteNumero.toString().padStart(3, '0')}`;
      
      return {
        existe: true,
        codigoSugerido: codigoSugerido
      };
      
    } catch (error) {
      console.error('Error al verificar código:', error);
      throw error;
    }
  }
  
  /**
   * Obtener historial de recepciones
   */
  static async obtenerHistorialRecepciones(limite = 50) {
    try {
      const query = `
        SELECT 
          r.id_recepcion,
          p.codigo,
          p.nombre as producto_nombre,
          p.unidad_medida,
          p.tipo_producto,
          r.cantidad_recibida,
          DATE_FORMAT(r.fecha_recepcion, '%Y-%m-%d') as fecha_recepcion,
          r.observaciones,
          e.nombre_completo as empleado_nombre,
          DATE_FORMAT(r.fecha_registro, '%Y-%m-%d %H:%i') as fecha_registro
        FROM recepcion_productos r
        JOIN productos p ON r.id_producto = p.id_producto
        JOIN empleados e ON r.id_empleado = e.id_empleado
        ORDER BY r.fecha_registro DESC
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
   * Buscar productos para autocompletado
   */
  static async buscarProductosAutocompletado(termino) {
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
          activo
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
}

module.exports = RecepcionProductos;