const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
user:process.env.DB_USER, 
password:process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306, 
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : null, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur de requête:', error);
    throw error;
  }
}

module.exports = { query };