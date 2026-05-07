const mysql = require('mysql2/promise');
require('dotenv').config();

// Création du pool de connexions MySQL
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'sunu_yoon',
  waitForConnections: true,
  connectionLimit:    10,
  charset: 'utf8mb4',
});

// Tester la connexion au démarrage
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL connecté avec succès');
    conn.release();
  } catch (err) {
    console.error('❌ Erreur connexion MySQL :', err.message);
    console.error('👉 Vérifie ton fichier .env (DB_USER, DB_PASSWORD, DB_NAME)');
    process.exit(1);
  }
}

testConnection();

module.exports = pool;
