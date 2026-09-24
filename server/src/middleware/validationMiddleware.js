/**
 * Centralized Input Validation and Request Sanitization Middleware
 * Validates request parameters, query strings, and payloads before hitting controllers.
 */

const { sanitizeObject, stripHtml } = require('../utils/sanitize');
const securityConfig = require('../config/security');

/**
 * Automatically cleans and sanitizes request body
 */
function sanitizeRequestBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body);
    }
    next();
}

/**
 * 1. Validate Login Request
 */
function validateLogin(req, res, next) {
    const username = req.body?.username || req.body?.reg_number;
    const password = req.body?.password;

    if (!username || typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Username or registration number is required',
            error: 'Username is required'
        });
    }

    if (!password || typeof password !== 'string' || !password.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Password is required',
            error: 'Password is required'
        });
    }

    if (username.length > 100 || password.length > securityConfig.validation.maxPasswordLength) {
        return res.status(400).json({
            success: false,
            message: 'Input exceeds maximum allowable length',
            error: 'Payload bounds exceeded'
        });
    }

    next();
}

/**
 * 2. Validate User Creation Request (Admin)
 */
function validateUserCreation(req, res, next) {
    const reg_number = req.body?.reg_number || req.body?.username;
    const { password, role, full_name, email } = req.body || {};

    if (!reg_number || typeof reg_number !== 'string' || !reg_number.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Registration number / username is required',
            error: 'Registration number is required'
        });
    }

    if (!password || typeof password !== 'string' || password.length < securityConfig.validation.minPasswordLength) {
        return res.status(400).json({
            success: false,
            message: `Password must be at least ${securityConfig.validation.minPasswordLength} characters long`,
            error: 'Password too short'
        });
    }

    if (!role || typeof role !== 'string' || !securityConfig.validation.allowedRoles.includes(role.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Allowed roles: ${securityConfig.validation.allowedRoles.join(', ')}`,
            error: 'Invalid role'
        });
    }

    if (email && (typeof email !== 'string' || !email.includes('@') || email.length > 120)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address format',
            error: 'Invalid email'
        });
    }

    if (full_name && (typeof full_name !== 'string' || full_name.length > 120)) {
        return res.status(400).json({
            success: false,
            message: 'Full name exceeds maximum length',
            error: 'Invalid name'
        });
    }

    next();
}

/**
 * 3. Validate Course Creation Request (Admin)
 */
function validateCourseCreation(req, res, next) {
    const code = req.body?.code || req.body?.course_code;
    const title = req.body?.title || req.body?.course_name;
    const credits = req.body?.credits;

    if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Course code is required',
            error: 'Course code is required'
        });
    }

    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Course title is required',
            error: 'Course title is required'
        });
    }

    if (code.trim().length > 20 || title.trim().length > securityConfig.validation.maxTitleLength) {
        return res.status(400).json({
            success: false,
            message: 'Course code or title exceeds maximum length',
            error: 'Input too long'
        });
    }

    if (credits !== undefined) {
        const numCredits = Number(credits);
        if (isNaN(numCredits) || numCredits < 1 || numCredits > 12) {
            return res.status(400).json({
                success: false,
                message: 'Credits must be a valid number between 1 and 12',
                error: 'Invalid credits'
            });
        }
    }

    next();
}

/**
 * 4. Validate Course Update Request (Admin)
 */
function validateCourseUpdate(req, res, next) {
    const { title, course_name, credits } = req.body || {};

    const newTitle = title || course_name;
    if (newTitle !== undefined && (typeof newTitle !== 'string' || newTitle.trim().length > securityConfig.validation.maxTitleLength)) {
        return res.status(400).json({
            success: false,
            message: 'Course title exceeds maximum length',
            error: 'Invalid title'
        });
    }

    if (credits !== undefined) {
        const numCredits = Number(credits);
        if (isNaN(numCredits) || numCredits < 1 || numCredits > 12) {
            return res.status(400).json({
                success: false,
                message: 'Credits must be a valid number between 1 and 12',
                error: 'Invalid credits'
            });
        }
    }

    next();
}

/**
 * 5. Validate Lecturer Grading Request
 */
function validateGrading(req, res, next) {
    const { marks, feedback } = req.body || {};

    if (marks === undefined || marks === null) {
        return res.status(400).json({
            success: false,
            message: 'Marks are required for grading',
            error: 'Marks required'
        });
    }

    const numMarks = Number(marks);
    if (isNaN(numMarks) || !isFinite(numMarks)) {
        return res.status(400).json({
            success: false,
            message: 'Marks must be a valid finite number',
            error: 'Invalid marks'
        });
    }

    if (numMarks < 0) {
        return res.status(400).json({
            success: false,
            message: 'Marks cannot be negative',
            error: 'Negative marks'
        });
    }

    if (feedback !== undefined && typeof feedback === 'string' && feedback.length > securityConfig.validation.maxFeedbackLength) {
        return res.status(400).json({
            success: false,
            message: `Feedback exceeds maximum allowed length (${securityConfig.validation.maxFeedbackLength} characters)`,
            error: 'Feedback too long'
        });
    }

    next();
}

/**
 * 6. Validate AI Chat Message
 */
function validateChatMessage(req, res, next) {
    const message = req.body?.message || req.body?.prompt;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({
            success: false,
            message: 'Message cannot be empty',
            error: 'Empty message'
        });
    }

    if (message.length > securityConfig.validation.maxChatMessageLength) {
        return res.status(400).json({
            success: false,
            message: `Message exceeds maximum allowed length (${securityConfig.validation.maxChatMessageLength} characters)`,
            error: 'Message too long'
        });
    }

    next();
}

/**
 * 7. Validate Study Plan Task Update
 */
function validateStudyPlanTask(req, res, next) {
    const { status, priority } = req.body || {};

    if (status !== undefined && !securityConfig.validation.allowedTaskStatuses.includes(String(status).toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: `Invalid task status. Allowed: ${securityConfig.validation.allowedTaskStatuses.join(', ')}`,
            error: 'Invalid status'
        });
    }

    if (priority !== undefined && !securityConfig.validation.allowedPriorities.includes(String(priority).toUpperCase())) {
        return res.status(400).json({
            success: false,
            message: `Invalid task priority. Allowed: ${securityConfig.validation.allowedPriorities.join(', ')}`,
            error: 'Invalid priority'
        });
    }

    next();
}

/**
 * 8. Validate Career Goal Update
 */
function validateCareerGoal(req, res, next) {
    const { target_role, career_goal, career_path_id } = req.body || {};
    const role = target_role || career_goal;

    if (role !== undefined && (typeof role !== 'string' || role.length > 100)) {
        return res.status(400).json({
            success: false,
            message: 'Target role exceeds maximum allowable length',
            error: 'Invalid role'
        });
    }

    if (career_path_id !== undefined && (isNaN(Number(career_path_id)) || Number(career_path_id) < 1)) {
        return res.status(400).json({
            success: false,
            message: 'Career path ID must be a positive integer',
            error: 'Invalid career path ID'
        });
    }

    next();
}

module.exports = {
    sanitizeRequestBody,
    validateLogin,
    validateUserCreation,
    validateCourseCreation,
    validateCourseUpdate,
    validateGrading,
    validateChatMessage,
    validateStudyPlanTask,
    validateCareerGoal
};
