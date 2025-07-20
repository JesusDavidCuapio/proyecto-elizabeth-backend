const bcrypt = require('bcryptjs');
const db = require('../config/database');

class Empleado {
  static async crear(empleadoData) {
    const { id_empleado, nombre_completo, usuario, contrasena, telefono, cargo } = empleadoData;
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    
    // Convertir cargo a formato de base de datos
    const cargoCapitalizado = cargo.charAt(0).toUpperCase() + cargo.slice(1);
    
    const query = `
      INSERT INTO empleados (id_empleado, nombre_completo, usuario, contrasena, telefono, cargo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    try {
      const [result] = await db.execute(query, [id_empleado, nombre_completo, usuario, hashedPassword, telefono, cargoCapitalizado]);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async buscarPorUsuario(usuario) {
    const query = 'SELECT * FROM empleados WHERE usuario = ? AND activo = 1';
    try {
      const [rows] = await db.execute(query, [usuario]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  static async validarCredenciales(usuario, contrasena) {
    try {
      const empleado = await this.buscarPorUsuario(usuario);
      if (!empleado) {
        return null;
      }
      
      const contrasenaValida = await bcrypt.compare(contrasena, empleado.contrasena);
      if (!contrasenaValida) {
        return null;
      }
      
      return empleado;
    } catch (error) {
      throw error;
    }
  }

    // Obtener todos los empleados (solo activos)
  static async obtenerTodos() {
    const query = `
      SELECT 
        id_empleado,
        nombre_completo,
        usuario,
        telefono,
        cargo,
        fecha_creacion,
        activo,
        CASE 
          WHEN activo = 1 THEN 'Activo'
          ELSE 'Inactivo'
        END as estado
      FROM empleados 
      WHERE activo = 1
      ORDER BY fecha_creacion DESC
    `;
    
    try {
      const [rows] = await db.execute(query);
      return rows;
    } catch (error) {
      console.error('Error al obtener empleados:', error);
      throw error;
    }
  }

  // Obtener empleado por ID
  static async obtenerPorId(id) {
    const query = `
      SELECT 
        id_empleado,
        nombre_completo,
        usuario,
        telefono,
        cargo,
        fecha_creacion,
        activo
      FROM empleados 
      WHERE id_empleado = ?
    `;
    
    try {
      const [rows] = await db.execute(query, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error al obtener empleado:', error);
      throw error;
    }
  }

  // Actualizar empleado
  static async actualizar(id, empleadoData) {
    const { nombre_completo, usuario, telefono, cargo } = empleadoData;
    
    const query = `
      UPDATE empleados 
      SET nombre_completo = ?, usuario = ?, telefono = ?, cargo = ?
      WHERE id_empleado = ?
    `;
    
    try {
      const [result] = await db.execute(query, [nombre_completo, usuario, telefono, cargo, id]);
      return result;
    } catch (error) {
      console.error('Error al actualizar empleado:', error);
      throw error;
    }
  }

  // Eliminar empleado CON CASCADA MANUAL (eliminar registros asociados)
static async eliminarConCascade(id) {
  console.log(`🔧 Iniciando eliminación en cascada para empleado: ${id}`);
  
  try {
    // Primero verificar que exista el empleado
    const empleadoExistente = await db.execute(
      'SELECT id_empleado FROM empleados WHERE id_empleado = ?',
      [id]
    );
    
    if (empleadoExistente[0].length === 0) {
      console.log(`❌ Empleado ${id} no existe en la base de datos`);
      return { affectedRows: 0 };
    }
    
    console.log(`✅ Empleado ${id} existe, procediendo con eliminación...`);

    // Crear empleado "ELIMINADO" si no existe
    try {
      await db.execute(`
        INSERT INTO empleados (id_empleado, nombre_completo, usuario, contrasena, telefono, cargo, activo)
        VALUES ('ELIMINADO', 'Empleado Eliminado', 'eliminado', '$2a$10$dummy.hash.value', 'N/A', 'Cajero', 0)
        ON DUPLICATE KEY UPDATE nombre_completo = 'Empleado Eliminado'
      `);
      console.log('✅ Empleado ELIMINADO creado/verificado');
    } catch (insertError) {
      console.log('⚠️ Empleado ELIMINADO ya existe o error menor:', insertError.message);
    }

    // 1. Actualizar reportes de productos (en lugar de eliminar)
    await db.execute(
      'UPDATE reportes_productos SET id_empleado = ? WHERE id_empleado = ?', 
      ['ELIMINADO', id]
    );
    console.log('✅ Reportes de productos actualizados');

    // 2. Actualizar recepciones de productos (en lugar de eliminar)
    await db.execute(
      'UPDATE recepcion_productos SET id_empleado = ? WHERE id_empleado = ?', 
      ['ELIMINADO', id]
    );
    console.log('✅ Recepciones de productos actualizadas');

    // 3. Actualizar movimientos de inventario
    await db.execute(
      'UPDATE movimientos_inventario SET id_empleado = ? WHERE id_empleado = ?', 
      ['ELIMINADO', id]
    );
    console.log('✅ Movimientos de inventario actualizados');

    // 4. Actualizar ventas (preservar historial)
    await db.execute(
      'UPDATE ventas SET id_empleado = ? WHERE id_empleado = ?', 
      ['ELIMINADO', id]
    );
    console.log('✅ Ventas actualizadas');

    // 5. Finalmente, eliminar el empleado
    const [result] = await db.execute(
      'DELETE FROM empleados WHERE id_empleado = ?', 
      [id]
    );
    console.log('✅ Empleado eliminado definitivamente');

    console.log(`🎉 Eliminación completada para empleado: ${id}`);
    return result;

  } catch (error) {
    console.error('💥 Error crítico en eliminación en cascada:', error);
    console.error('Stack trace:', error.stack);
    throw new Error(`Error en eliminación: ${error.message}`);
  }
}


  // Buscar empleados por término
  static async buscar(termino) {
    const query = `
      SELECT 
        id_empleado,
        nombre_completo,
        usuario,
        telefono,
        cargo,
        fecha_creacion,
        activo,
        CASE 
          WHEN activo = 1 THEN 'Activo'
          ELSE 'Inactivo'
        END as estado
      FROM empleados 
      WHERE (nombre_completo LIKE ? OR usuario LIKE ?) 
      AND activo = 1
      ORDER BY nombre_completo ASC
    `;
    
    try {
      const terminoBusqueda = `%${termino}%`;
      const [rows] = await db.execute(query, [terminoBusqueda, terminoBusqueda]);
      return rows;
    } catch (error) {
      console.error('Error al buscar empleados:', error);
      throw error;
    }
  }

  // Filtrar empleados por cargo
  static async filtrarPorCargo(cargo) {
    const query = `
      SELECT 
        id_empleado,
        nombre_completo,
        usuario,
        telefono,
        cargo,
        fecha_creacion,
        activo,
        CASE 
          WHEN activo = 1 THEN 'Activo'
          ELSE 'Inactivo'
        END as estado
      FROM empleados 
      WHERE cargo = ? AND activo = 1
      ORDER BY nombre_completo ASC
    `;
    
    try {
      const [rows] = await db.execute(query, [cargo]);
      return rows;
    } catch (error) {
      console.error('Error al filtrar empleados:', error);
      throw error;
    }
  }

  // Verificar si usuario existe (para edición)
  static async verificarUsuarioExistente(usuario, idExcluir = null) {
    let query = 'SELECT id_empleado FROM empleados WHERE usuario = ?';
    let params = [usuario];
    
    if (idExcluir) {
      query += ' AND id_empleado != ?';
      params.push(idExcluir);
    }
    
    try {
      const [rows] = await db.execute(query, params);
      return rows.length > 0;
    } catch (error) {
      console.error('Error al verificar usuario:', error);
      throw error;
    }
  }
}

module.exports = Empleado;