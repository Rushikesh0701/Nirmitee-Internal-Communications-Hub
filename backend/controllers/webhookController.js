const { Webhook } = require('svix');
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const logger = require('../utils/logger');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const DEFAULT_ORG_ID = 'org_39Ta00yBEDXWf5FIvx5j6xIA8uu';

/**
 * Handle Clerk Webhooks
 */
const handleClerkWebhook = async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        logger.error('CLERK_WEBHOOK_SECRET is not defined');
        return res.status(500).json({ success: false, message: 'Webhook secret missing' });
    }

    // Get the headers
    const headers = req.headers;
    const svix_id = headers['svix-id'];
    const svix_timestamp = headers['svix-timestamp'];
    const svix_signature = headers['svix-signature'];

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ success: false, message: 'Missing svix headers' });
    }

    // Get the body
    const payload = req.body;
    const body = payload.toString();

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            'svix-id': svix_id,
            'svix-timestamp': svix_timestamp,
            'svix-signature': svix_signature,
        });
    } catch (err) {
        logger.error('Webhook verification failed:', err.message);
        return res.status(400).json({ success: false, message: 'Verification failed' });
    }

    const { id, type } = evt;
    const data = evt.data;

    logger.info(`Webhook received: ${type} (${id})`);

    try {
        if (type === 'user.created') {
            const userId = data.id;
            logger.info(`New user created: ${userId}. Attaching to default organization ${DEFAULT_ORG_ID}`);

            // Auto-assign to organization
            try {
                await clerkClient.organizations.createOrganizationMembership({
                    organizationId: DEFAULT_ORG_ID,
                    userId: userId,
                    role: 'basic_member',
                });
                logger.info(`Successfully added user ${userId} to organization ${DEFAULT_ORG_ID}`);
            } catch (orgError) {
                logger.error(`Failed to add user to organization: ${orgError.message}`);
                // We don't return 500 here to avoid Clerk retrying indefinitely 
                // if it's a configuration issue with the Org ID.
            }
        }

        if (type === 'session.created') {
            // Implementation for force single session if needed via API
            // For now, Clerk Dashboard "Single session mode" is preferred.
            logger.info(`Session created for user: ${data.user_id}`);
        }

        return res.status(200).json({ success: true, message: 'Webhook processed' });
    } catch (err) {
        logger.error('Error processing webhook:', err.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    handleClerkWebhook
};
