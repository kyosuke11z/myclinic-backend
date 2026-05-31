const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myclinic',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on boot
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL Database successfully.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to the database:', err.message);
  });

module.exports = pool;
