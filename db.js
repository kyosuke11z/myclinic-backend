// c:\Users\Matsumoto\myclinic-backend\db.js
const mysql = require('mysql2/promise'); // ใช้ promise wrapper
require('dotenv').config();

// สร้าง Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost', // Default to localhost if not set in .env
  user: process.env.DB_USER || 'root',     // Default to root if not set in .env
  password: process.env.DB_PASSWORD || '', // Default to empty password if not set in .env
  database: process.env.DB_NAME || 'myclinic_db', // Default database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ทดสอบการเชื่อมต่อ (optional แต่แนะนำ)
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database.');
    connection.release(); // คืน connection กลับ pool
  })
  .catch(err => console.error('Error connecting to the database:', err.stack));

module.exports = pool;