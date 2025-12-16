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

module.exports = {
    loginLimiter,
    forgotPasswordLimiter
};
