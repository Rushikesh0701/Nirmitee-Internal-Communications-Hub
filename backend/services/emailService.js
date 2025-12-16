const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email service for sending password reset emails
 * Uses nodemailer with Gmail or other SMTP service
 */

// Create reusable transporter
const createTransporter = () => {
    // For development, use ethereal.email (fake SMTP service)
    // For production, use real SMTP settings from environment variables

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Production configuration
        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    } else {
        // Development: log email to console instead of sending
        logger.warn('No email configuration found. Emails will be logged to console only.');
        return null;
    }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full URL for password reset
 */
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@nirmitee.io',
            to: email,
            subject: 'Password Reset Request - Nirmitee Internal Communications Hub',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Password Reset Request</h2>
          <p>You requested to reset your password for your Nirmitee account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Nirmitee Internal Communications Hub<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
            text: `
Password Reset Request

You requested to reset your password for your Nirmitee account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

Nirmitee Internal Communications Hub
      `
        };

        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            logger.info('Password reset email sent', { email, messageId: info.messageId });
            return { success: true, messageId: info.messageId };
        } else {
            // Development mode: log email to console
            logger.info('Password reset email (DEV MODE - not actually sent)', {
                to: email,
                resetUrl,
                token: resetToken
            });
            console.log('\n=== PASSWORD RESET EMAIL (DEV MODE) ===');
            console.log('To:', email);
            console.log('Reset URL:', resetUrl);
            console.log('Token:', resetToken);
            console.log('=======================================\n');
            return { success: true, dev: true };
        }
    } catch (error) {
        logger.error('Error sending password reset email', { error: error.message });
        throw new Error('Failed to send password reset email');
    }
};

module.exports = {
    sendPasswordResetEmail
};
