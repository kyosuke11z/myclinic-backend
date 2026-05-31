const express = require('express');
const cors = require('cors');
require('dotenv').config();

const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const settingRoutes = require('./routes/settingRoutes');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/patients', patientRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/settings', settingRoutes);

// Base route for server health check
app.get('/', (req, res) => {
  res.send('MyClinic Backend is running! (Clean Refactored Architecture)');
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Backend server is running on http://localhost:${port}`);
});
