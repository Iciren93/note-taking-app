const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const noteRoutes = require('./noteRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/notes', noteRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

