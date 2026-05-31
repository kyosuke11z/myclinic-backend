const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const emrRoutes = require('./routes/emrRoutes');
const queueRoutes = require('./routes/queueRoutes');
const pharmacyRoutes = require('./routes/pharmacyRoutes');
const billingRoutes = require('./routes/billingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes Mount
app.use('/auth', authRoutes);
app.use('/patients', patientRoutes);
app.use('/emr', emrRoutes);
app.use('/queues', queueRoutes);
app.use('/pharmacy', pharmacyRoutes);
app.use('/billing', billingRoutes);
app.use('/analytics', analyticsRoutes);

// Base route for server health check
app.get('/', (req, res) => {
  res.send('🚀 MyClinic Pro Enterprise API Server is fully operational! (SQLite Backend)');
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 MyClinic Pro API is running on http://localhost:${port}`);
});
