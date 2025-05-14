const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ส่ง db เข้า route
const patientRoutes = require('./routes/patients');
app.use('/api/patients', patientRoutes(db));

// Test route
app.get('/', (req, res) => {
  res.send('Welcome to MyClinic Backend API!');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
