const express = require('express');
const { login, getMe } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const { loginLimiter } = require('../middleware/rateLimitMiddleware');
const { validateLogin } = require('../middleware/validationMiddleware');

const router = express.Router();

router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', authenticateToken, getMe);

module.exports = router;
