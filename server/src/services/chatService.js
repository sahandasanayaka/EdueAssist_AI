const pool = require('../db/connection');
const aiContextService = require('./aiContextService');
const geminiService = require('./geminiService');

class ChatService {
    constructor() {
        // In-memory rate limiting map: studentId -> [timestamps]
        this.rateLimitMap = new Map();
        this.RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
        this.MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute
        this.MIN_REQUEST_INTERVAL_MS = 300; // 300ms minimum interval
    }

    /**
     * Rate limiting check per student
     */
    _checkRateLimit(studentId) {
        const now = Date.now();
        const timestamps = this.rateLimitMap.get(studentId) || [];

        // Filter out timestamps outside window
        const recentTimestamps = timestamps.filter(t => now - t < this.RATE_LIMIT_WINDOW_MS);

        if (recentTimestamps.length > 0) {
            const lastTime = recentTimestamps[recentTimestamps.length - 1];
            if (now - lastTime < this.MIN_REQUEST_INTERVAL_MS) {
                const err = new Error('You are sending messages too quickly. Please pause a moment.');
                err.statusCode = 429;
                throw err;
            }
        }

        if (recentTimestamps.length >= this.MAX_REQUESTS_PER_WINDOW) {
            const err = new Error('Too many chat requests. Please wait a minute before sending another message.');
            err.statusCode = 429;
            throw err;
        }

        recentTimestamps.push(now);
        this.rateLimitMap.set(studentId, recentTimestamps);
    }

    /**
     * Process a student chat message through the complete Gemini + MySQL pipeline
     * 
     * @param {number} studentId - Authenticated student ID from req.user.id
     * @param {string} rawMessage - User prompt
     * @param {string} sessionId - Chat session identifier
     */
    async processChatMessage(studentId, rawMessage, sessionId = 'default') {
        // 1. Input Validation
        if (!rawMessage || typeof rawMessage !== 'string') {
            const err = new Error('Message is required and must be text.');
            err.statusCode = 400;
            throw err;
        }

        const trimmed = rawMessage.trim();
        if (trimmed.length === 0) {
            const err = new Error('Message cannot be empty.');
            err.statusCode = 400;
            throw err;
        }

        if (trimmed.length > 2000) {
            const err = new Error('Message exceeds the maximum limit of 2000 characters.');
            err.statusCode = 400;
            throw err;
        }

        // 2. Enforce Rate Limiting
        this._checkRateLimit(studentId);

        // 3. Retrieve Scoped Chat History from MySQL
        const recentHistory = await this._getRecentHistory(studentId, sessionId, 10);

        // 4. Build Authoritative Academic Context
        const rawContext = await aiContextService.buildStudentContext(studentId);
        const contextBrief = aiContextService.formatContextForPrompt(rawContext);

        // 5. Generate Grounded AI Response
        const reply = await geminiService.generateResponse({
            userMessage: trimmed,
            contextBrief,
            recentHistory,
            rawContext
        });

        // 6. Persist Conversation to ai_chat_history in MySQL
        await pool.query(
            `INSERT INTO ai_chat_history (student_id, session_id, message, sender)
             VALUES (?, ?, ?, 'user')`,
            [studentId, sessionId, trimmed]
        );

        await pool.query(
            `INSERT INTO ai_chat_history (student_id, session_id, message, sender)
             VALUES (?, ?, ?, 'ai')`,
            [studentId, sessionId, reply]
        );

        return {
            reply,
            message: reply,
            session_id: sessionId
        };
    }

    /**
     * Fetch recent conversation messages for the authenticated student only
     */
    async _getRecentHistory(studentId, sessionId, limit = 10) {
        const [rows] = await pool.query(
            `SELECT message, sender 
             FROM ai_chat_history 
             WHERE student_id = ? AND session_id = ? 
             ORDER BY id DESC 
             LIMIT ?`,
            [studentId, sessionId, limit]
        );

        // Return chronological order
        return rows.reverse();
    }

    /**
     * Public method to retrieve full chat history for a student
     */
    async getChatHistory(studentId, sessionId = null) {
        let query = `SELECT id, session_id, message, sender, timestamp 
                     FROM ai_chat_history 
                     WHERE student_id = ?`;
        const params = [studentId];

        if (sessionId) {
            query += ' AND session_id = ?';
            params.push(sessionId);
        }

        query += ' ORDER BY id ASC LIMIT 50';

        const [history] = await pool.query(query, params);
        return history;
    }
}

module.exports = new ChatService();
