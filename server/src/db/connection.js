const mysql = require('mysql2/promise');
const config = require('../config/env');

const pool = mysql.createPool({
    host: config.DB_HOST,
    port: config.DB_PORT,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Ping test to verify MySQL database connectivity
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1 AS ping');
        return rows && rows.length > 0;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        return false;
    }
}

// Attach helper method to pool and export
pool.testConnection = testConnection;

module.exports = pool;
