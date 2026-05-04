const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'noteapp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Simple query wrapper to check DB connection
const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database');
    connection.release();
  } catch (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    // In production you might want to exit here, but for dev we let it keep trying
    // process.exit(1); 
  }
};

checkConnection();

module.exports = pool;
