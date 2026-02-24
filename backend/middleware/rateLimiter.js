const rateLimit = require('express-rate-limit');

/**
 * Login-specific rate limiter to prevent brute force attacks
 * Limits: 5 login attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count all requests, even successful ones
});

/**
 * Forgot password rate limiter to prevent abuse
 * Limits: 3 password reset requests per 15 minutes per IP
 */
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 forgot password requests per windowMs
    message: 'Too many password reset attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

/**
 * Push notification token registration rate limiter
 * Limits: 30 requests per minute per IP
 */
const pushTokenLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many token registration attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Push notification send rate limiter
 * Limits: 10 requests per minute per IP
 */
const pushSendLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: 'Too many push notification requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    forgotPasswordLimiter,
    pushTokenLimiter,
    pushSendLimiter
};
