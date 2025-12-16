const { User } = require('../models');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./emailService');
const logger = require('../utils/logger');

/**
 * Request password reset - generates token and sends email
 * @param {string} email - User's email address
 * @param {string} frontendUrl - Frontend base URL for reset link
 */
const requestPasswordReset = async (email, frontendUrl) => {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Return specific error for user not found
        throw new Error('No account found with this email address');
    }

    // Check if user account is active
    if (!user.isActive) {
        throw new Error('This account has been deactivated. Please contact support.');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token before storing (security best practice)
    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set token and expiration (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send email
    try {
        await sendPasswordResetEmail(user.email, resetToken, resetUrl);
        logger.info('Password reset email sent successfully', { email: user.email });
    } catch (error) {
        // Clear token if email fails
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw new Error('Failed to send password reset email. Please try again.');
    }

    return {
        success: true,
        message: 'Password reset email has been sent successfully'
    };
};

/**
 * Reset password using token
 * @param {string} token - Reset token from email
 * @param {string} newPassword - New password
 */
const resetPassword = async (token, newPassword) => {
    // Hash the incoming token to match database
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new Error('Password reset token is invalid or has expired');
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Clear any login attempts/locks when password is reset
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.loginAttemptsHistory = [];

    await user.save();

    logger.info('Password reset successfully', { email: user.email });

    return { success: true, message: 'Password has been reset successfully' };
};

module.exports = {
    requestPasswordReset,
    resetPassword
};
