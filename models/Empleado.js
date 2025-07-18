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

  // Eliminar empleado (eliminación completa de la base de datos)
  static async eliminar(id) {
    const query = `
      DELETE FROM empleados 
      WHERE id_empleado = ?
    `;
    
    try {
      const [result] = await db.execute(query, [id]);
      return result;
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      throw error;
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