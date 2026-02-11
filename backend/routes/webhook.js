const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Clerk webhooks need the raw body for signature verification
// This route is mounted in server.js before the global express.json() if possible,
// or we use express.raw specific to this route.
router.post('/clerk', express.raw({ type: 'application/json' }), webhookController.handleClerkWebhook);

module.exports = router;
