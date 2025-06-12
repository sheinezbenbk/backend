const mysql = require('mysql2/promise');

// Configuration de la connexion
const pool = mysql.createPool({
  host: 'localhost', 
//   user: 'uk3lde4vsg7g9',
//   password: 'p!4bK2$4@i',
user: process.env.DB_USER || 'root',
password: process.env.DB_PASSWORD || '',
  database: 'dblvu1qjp0d2jg',
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