#!/usr/bin/env node

/**
 * Generate Secure Secrets for Environment Configuration
 * Run this script to generate secure random values for JWT_SECRET and other secrets
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure Secrets for Your Application\n');
console.log('=' .repeat(60));

// Generate JWT Secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('\n📝 JWT_SECRET (for authentication):');
console.log('─'.repeat(60));
console.log(jwtSecret);

// Generate additional secrets if needed
const sessionSecret = crypto.randomBytes(32).toString('hex');
console.log('\n📝 SESSION_SECRET (optional, for sessions):');
console.log('─'.repeat(60));
console.log(sessionSecret);

// Generate encryption key
const encryptionKey = crypto.randomBytes(32).toString('base64');
console.log('\n📝 ENCRYPTION_KEY (optional, for data encryption):');
console.log('─'.repeat(60));
console.log(encryptionKey);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Copy the JWT_SECRET above and paste it into your .env file');
console.log('   Replace: JWT_SECRET=REPLACE_WITH_YOUR_SECURE_JWT_SECRET');
console.log('   With: JWT_SECRET=' + jwtSecret);
console.log('\n⚠️  IMPORTANT: Never commit these secrets to version control!');
console.log('   They should only exist in your .env file (which is gitignored)\n');

