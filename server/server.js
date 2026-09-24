const express = require('express');
const cors = require('cors');
const config = require('./src/config/env');
const { testConnection } = require('./src/db/connection');

// Middleware imports
const requestLogger = require('./src/middleware/requestLogger');
const securityHeaders = require('./src/middleware/securityMiddleware');
const { sanitizeRequestBody } = require('./src/middleware/validationMiddleware');
const securityConfig = require('./src/config/security');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

// Route imports
const healthRoutes = require('./src/routes/healthRoutes');
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const lecturerRoutes = require('./src/routes/lecturerRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();

// 1. Security HTTP Headers
app.use(securityHeaders);

// 2. CORS Hardened Configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, automated test suites)
        if (!origin) return callback(null, true);
        const allowed = securityConfig.cors.allowedOrigins.concat(config.CLIENT_URLS);
        if (allowed.includes(origin) || config.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error('CORS Policy: Origin not permitted'), false);
    },
    credentials: true,
    methods: securityConfig.cors.allowedMethods,
    allowedHeaders: securityConfig.cors.allowedHeaders,
    maxAge: securityConfig.cors.maxAge
}));

// 3. Body Parsing Middleware with 1MB Request Limits
app.use(express.json({ limit: securityConfig.requestLimits.jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: securityConfig.requestLimits.urlencodedLimit }));

// 4. Request Body Sanitization
app.use(sanitizeRequestBody);

// 5. Request Logging Middleware
app.use(requestLogger);

// 4. API Routes
app.get('/', (req, res) => {
    res.json({
        success: true,
        name: 'EduAssistAI Backend API',
        version: '2.0.0',
        status: 'online',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            students: '/api/students',
            lecturers: '/api/lecturers',
            admin: '/api/admin'
        }
    });
});

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/lecturers', lecturerRoutes);
app.use('/api/admin', adminRoutes);

// 5. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 6. Server Initialization
if (process.env.NODE_ENV !== 'test') {
    app.listen(config.PORT, async () => {
        console.log(`=============================================`);
        console.log(`🚀 EduAssistAI Server running on port ${config.PORT}`);
        console.log(`🌐 Base URL: http://localhost:${config.PORT}`);
        console.log(`🏥 Health:   http://localhost:${config.PORT}/api/health`);
        console.log(`🔧 Mode:     ${config.NODE_ENV}`);
        
        const isDbConnected = await testConnection();
        if (isDbConnected) {
            console.log(`✅ MySQL Database '${config.DB_NAME}' connected successfully`);
        } else {
            console.log(`⚠️  MySQL Database connection failed or waiting for startup`);
        }
        console.log(`=============================================`);
    });
}

module.exports = app;
