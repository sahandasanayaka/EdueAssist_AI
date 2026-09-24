const dotenv = require('dotenv');
const path = require('path');

// Ensure .env is loaded from server root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'eduassist_db',
    JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_eduassist_companion_fallback',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    CLIENT_URLS: process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map(s => s.trim())
        : [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:3000'
        ]
};

// Validate critical configuration without exposing secrets
function validateConfig() {
    const issues = [];
    if (!config.DB_NAME) issues.push('DB_NAME is not set');
    if (!config.DB_HOST) issues.push('DB_HOST is not set');
    if (!config.JWT_SECRET) issues.push('JWT_SECRET is not set');

    if (issues.length > 0) {
        console.warn('⚠️  Configuration Warnings:', issues.join(', '));
    }
}

validateConfig();

module.exports = Object.freeze(config);
