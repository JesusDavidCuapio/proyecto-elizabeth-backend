const mysql = require('mysql2');
require('dotenv').config();

// Crear pool de conexiones con promesas
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tienda_elizabeth',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Obtener la versión con promesas
const promisePool = pool.promise();

// Probar la conexión
async function testConnection() {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Conectado a MySQL - Tienda Elizabeth');
    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
  }
}

// Ejecutar la prueba de conexión
testConnection();

module.exports = promisePool;