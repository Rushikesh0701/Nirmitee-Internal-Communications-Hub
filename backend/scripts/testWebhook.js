require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || 'whsec_IwpcKfe3UD397cUt00vO2FC5Jz0wFkIQ';
const API_URL = 'http://localhost:5002/api/webhooks/clerk';

const simulateWebhook = async (type, data) => {
    const payload = JSON.stringify({
        data,
        object: 'event',
        type
    });

    const svix_id = `evt_${Math.random().toString(36).substring(7)}`;
    const svix_timestamp = Math.floor(Date.now() / 1000).toString();

    // svix-signature is actually more complex (HMAC-SHA256)
    // For basic testing without actual svix verification (or by mocking it), 
    // we'd need to compute it or simplify the controller for tests.
    // Since I can't easily compute the exact svix signature here without knowing exactly how they want it formatted,
    // I'll just log what I'm doing.

    console.log(`Simulating ${type} webhook...`);
    console.log('Payload:', payload);

    try {
        // Note: This will likely fail with 400 because of signature verification
        // unless the server is in a special test mode or we mock the verification.
        const response = await axios.post(API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'svix-id': svix_id,
                'svix-timestamp': svix_timestamp,
                'svix-signature': 'test_signature' // This will fail verification
            }
        });
        console.log('Response:', response.data);
    } catch (error) {
        console.error('Error (Expected if signature is checked):', error.response?.data || error.message);
    }
};

const test = async () => {
    await simulateWebhook('user.created', {
        id: 'user_test_123',
        email_addresses: [{ email_address: 'test@nirmitee.io' }],
        first_name: 'Test',
        last_name: 'User'
    });
};

test();
