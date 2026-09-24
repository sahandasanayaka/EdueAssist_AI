const express = require('express');
const { testConnection } = require('../db/connection');
const config = require('../config/env');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API and Database Health Check
 * @access  Public
 */
router.get('/', async (req, res) => {
    const isDbConnected = await testConnection();

    const healthInfo = {
        success: isDbConnected,
        message: isDbConnected
            ? 'EduAssistAI API is fully operational'
            : 'EduAssistAI API is degraded: Database unavailable',
        database: isDbConnected ? 'connected' : 'disconnected',
        environment: config.NODE_ENV,
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    };

    if (isDbConnected) {
        return res.status(200).json(healthInfo);
    } else {
        return res.status(503).json(healthInfo);
    }
});

module.exports = router;
