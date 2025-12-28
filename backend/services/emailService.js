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

/**
 * Send notification email to a user
 * @param {string} email - Recipient email
 * @param {string} type - Notification type (MENTION, RECOGNITION, GROUP_POST, etc.)
 * @param {string} content - Notification content
 * @param {object} metadata - Additional metadata (postId, postType, etc.)
 * @param {string} appUrl - Base URL of the application
 */
const sendNotificationEmail = async (email, type, content, metadata = {}, appUrl = '') => {
    try {
        const transporter = createTransporter();

        // Determine subject and email template based on notification type
        let subject = 'New Notification - Nirmitee Internal Communications Hub';
        let actionText = 'View Details';
        let actionUrl = appUrl || process.env.FRONTEND_URL || 'https://nirmitee.io';

        switch (type) {
            case 'MENTION':
                subject = 'You were mentioned - Nirmitee Internal Communications Hub';
                if (metadata.postId && metadata.postType) {
                    actionUrl = `${appUrl}/${metadata.postType === 'blog' ? 'blogs' : 'discussions'}/${metadata.postId}`;
                }
                break;
            case 'RECOGNITION':
                subject = 'You received recognition! - Nirmitee Internal Communications Hub';
                actionUrl = `${appUrl}/recognitions`;
                break;
            case 'GROUP_POST':
                subject = 'New post in your group - Nirmitee Internal Communications Hub';
                if (metadata.postId) {
                    actionUrl = `${appUrl}/groups/${metadata.groupId || ''}/posts/${metadata.postId}`;
                } else {
                    actionUrl = `${appUrl}/groups`;
                }
                break;
            case 'SURVEY_PUBLISHED':
                subject = 'New survey available - Nirmitee Internal Communications Hub';
                if (metadata.surveyId) {
                    actionUrl = `${appUrl}/surveys/${metadata.surveyId}`;
                } else {
                    actionUrl = `${appUrl}/surveys`;
                }
                break;
            case 'ANNOUNCEMENT':
                subject = 'New announcement - Nirmitee Internal Communications Hub';
                if (metadata.announcementId) {
                    actionUrl = `${appUrl}/announcements/${metadata.announcementId}`;
                } else {
                    actionUrl = `${appUrl}/announcements`;
                }
                break;
            case 'COMMENT':
                subject = 'New comment on your content - Nirmitee Internal Communications Hub';
                if (metadata.blogId) {
                    actionUrl = `${appUrl}/blogs/${metadata.blogId}`;
                } else if (metadata.discussionId) {
                    actionUrl = `${appUrl}/discussions/${metadata.discussionId}`;
                }
                break;
            case 'LIKE':
                subject = 'Someone liked your content - Nirmitee Internal Communications Hub';
                if (metadata.contentId) {
                    const contentType = metadata.contentType || 'blog';
                    actionUrl = `${appUrl}/${contentType === 'blog' ? 'blogs' : 'discussions'}/${metadata.contentId}`;
                }
                break;
            case 'SYSTEM':
                subject = 'System Notification - Nirmitee Internal Communications Hub';
                if (metadata.blogId) {
                    actionUrl = `${appUrl}/blogs/${metadata.blogId}`;
                } else if (metadata.discussionId) {
                    actionUrl = `${appUrl}/discussions/${metadata.discussionId}`;
                }
                break;
        }

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@nirmitee.io',
            to: email,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">${subject.replace(' - Nirmitee Internal Communications Hub', '')}</h2>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${content}</p>
          <div style="margin: 30px 0;">
            <a href="${actionUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              ${actionText}
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Nirmitee Internal Communications Hub<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
            text: `
${subject.replace(' - Nirmitee Internal Communications Hub', '')}

${content}

${actionText}: ${actionUrl}

Nirmitee Internal Communications Hub
      `
        };

        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            logger.info('Notification email sent', { email, type, messageId: info.messageId });
            return { success: true, messageId: info.messageId };
        } else {
            // Development mode: log email to console
            logger.info('Notification email (DEV MODE - not actually sent)', {
                to: email,
                type,
                content,
                actionUrl
            });
            console.log('\n=== NOTIFICATION EMAIL (DEV MODE) ===');
            console.log('To:', email);
            console.log('Type:', type);
            console.log('Content:', content);
            console.log('Action URL:', actionUrl);
            console.log('=======================================\n');
            return { success: true, dev: true };
        }
    } catch (error) {
        logger.error('Error sending notification email', { error: error.message, email, type });
        // Don't throw error - email failures shouldn't break notification creation
        return { success: false, error: error.message };
    }
};

/**
 * Send bulk notification emails
 * @param {Array} userIds - Array of user IDs
 * @param {string} type - Notification type
 * @param {string} content - Notification content
 * @param {object} metadata - Additional metadata
 * @param {string} appUrl - Base URL of the application
 */
const sendBulkNotificationEmails = async (userIds, type, content, metadata = {}, appUrl = '') => {
    if (!userIds || userIds.length === 0) {
        return { success: true, sent: 0, failed: 0 };
    }

    const { User } = require('../models');
    const results = { success: true, sent: 0, failed: 0 };

    try {
        // Fetch user emails
        const users = await User.find({ _id: { $in: userIds } }).select('email firstName lastName');

        // Send emails in parallel (but limit concurrency to avoid overwhelming email service)
        const emailPromises = users.map(user =>
            sendNotificationEmail(user.email, type, content, metadata, appUrl)
                .then(result => ({ userId: user._id, success: result.success }))
                .catch(error => {
                    logger.error('Error sending bulk notification email', {
                        userId: user._id,
                        error: error.message
                    });
                    return { userId: user._id, success: false };
                })
        );

        const emailResults = await Promise.all(emailPromises);

        emailResults.forEach(result => {
            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
            }
        });

        logger.info('Bulk notification emails sent', {
            total: userIds.length,
            sent: results.sent,
            failed: results.failed
        });

        return results;
    } catch (error) {
        logger.error('Error sending bulk notification emails', { error: error.message });
        return { success: false, sent: 0, failed: userIds.length, error: error.message };
    }
};

/**
 * Send moderation notification email
 * @param {string} email - Recipient email
 * @param {string} contentType - Type of content (blog, announcement)
 * @param {string} contentTitle - Title of the content
 * @param {string} status - Moderation status (APPROVED, REJECTED)
 * @param {string} reason - Rejection reason (if rejected)
 * @param {string} appUrl - Base URL of the application
 */
const sendModerationEmail = async (email, contentType, contentTitle, status, reason = '', appUrl = '') => {
    try {
        const transporter = createTransporter();

        const isApproved = status === 'APPROVED';
        const subject = isApproved
            ? `Your ${contentType} has been approved - Nirmitee Internal Communications Hub`
            : `Your ${contentType} needs revision - Nirmitee Internal Communications Hub`;

        const actionUrl = appUrl || process.env.FRONTEND_URL || 'https://nirmitee.io';
        const contentPath = contentType === 'blog' ? 'blogs' : 'announcements';

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@nirmitee.io',
            to: email,
            subject,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'};">
            ${isApproved ? '✓ Approved' : '⚠ Needs Revision'}
          </h2>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Your ${contentType} <strong>"${contentTitle}"</strong> has been ${isApproved ? 'approved and published' : 'rejected'}.
          </p>
          ${!isApproved && reason ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;"><strong>Reason:</strong> ${reason}</p>
          </div>
          ` : ''}
          <div style="margin: 30px 0;">
            <a href="${actionUrl}/${contentPath}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View ${contentType === 'blog' ? 'Blogs' : 'Announcements'}
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Nirmitee Internal Communications Hub<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
            text: `
${subject.replace(' - Nirmitee Internal Communications Hub', '')}

Your ${contentType} "${contentTitle}" has been ${isApproved ? 'approved and published' : 'rejected'}.

${!isApproved && reason ? `Reason: ${reason}` : ''}

View ${contentType === 'blog' ? 'Blogs' : 'Announcements'}: ${actionUrl}/${contentPath}

Nirmitee Internal Communications Hub
      `
        };

        if (transporter) {
            const info = await transporter.sendMail(mailOptions);
            logger.info('Moderation email sent', { email, contentType, status, messageId: info.messageId });
            return { success: true, messageId: info.messageId };
        } else {
            // Development mode: log email to console
            logger.info('Moderation email (DEV MODE - not actually sent)', {
                to: email,
                contentType,
                contentTitle,
                status,
                reason
            });
            console.log('\n=== MODERATION EMAIL (DEV MODE) ===');
            console.log('To:', email);
            console.log('Content Type:', contentType);
            console.log('Title:', contentTitle);
            console.log('Status:', status);
            if (reason) console.log('Reason:', reason);
            console.log('=======================================\n');
            return { success: true, dev: true };
        }
    } catch (error) {
        logger.error('Error sending moderation email', { error: error.message, email, contentType });
        // Don't throw error - email failures shouldn't break moderation flow
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendNotificationEmail,
    sendBulkNotificationEmails,
    sendModerationEmail
};
