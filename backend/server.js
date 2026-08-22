require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingRoutes = require('./routes/bookings');
const weatherRoutes = require('./routes/weather');
const reviewsRoutes = require('./routes/reviews');

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/recommendations', weatherRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Krishi Yantra API running', timestamp: new Date().toISOString() });
});

// Fallback to index.html for non-API routes (SPA support)
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// 404 handler for API
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Krishi Yantra server running on http://localhost:${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}/`);
    console.log(`API Health: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
