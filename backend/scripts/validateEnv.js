#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks if all required environment variables are properly configured
 */

require('dotenv').config();

const REQUIRED_VARS = [
  { name: 'JWT_SECRET', sensitive: true },
  { name: 'NEWSDATA_API_KEY', sensitive: true },
];

const OPTIONAL_VARS = [
  { name: 'PORT', default: '5002' },
  { name: 'NODE_ENV', default: 'development' },
  { name: 'FRONTEND_URL', default: 'http://localhost:5173' },
  { name: 'MONGODB_URI', default: 'mongodb://localhost:27017/nirmitee_hub' },
  { name: 'DB_NAME', default: 'nirmitee_hub' },
  { name: 'DB_USER', default: 'postgres' },
  { name: 'DB_PASSWORD', sensitive: true },
  { name: 'DB_HOST', default: 'localhost' },
  { name: 'DB_PORT', default: '5432' },
  { name: 'LOG_LEVEL', default: 'DEBUG' },
];

const PLACEHOLDER_VALUES = [
  'your-secret-key-change-in-production',
  'your_newsdata_api_key_here',
  'REPLACE_WITH_YOUR_SECURE_JWT_SECRET',
  'REPLACE_WITH_YOUR_NEWSDATA_API_KEY',
  'REPLACE_WITH_YOUR_DB_PASSWORD',
];

console.log('🔍 Validating Environment Configuration\n');
console.log('='.repeat(70));

let hasErrors = false;
let hasWarnings = false;

// Function to mask sensitive values
const maskValue = (value) => {
  if (!value) return 'NOT SET';
  if (value.length <= 8) return '*'.repeat(value.length);
  return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
};

// Function to check if value is a placeholder
const isPlaceholder = (value) => {
  return PLACEHOLDER_VALUES.some(placeholder => value === placeholder);
};

// Check required variables
console.log('\n📋 Required Variables:');
console.log('─'.repeat(70));

REQUIRED_VARS.forEach(({ name, sensitive }) => {
  const value = process.env[name];
  const displayValue = sensitive ? maskValue(value) : value;
  
  if (!value || value.trim() === '') {
    console.log(`❌ ${name}: NOT SET`);
    console.log(`   → Please set this in your .env file`);
    hasErrors = true;
  } else if (isPlaceholder(value)) {
    console.log(`⚠️  ${name}: ${displayValue}`);
    console.log(`   → Still using placeholder value - replace with actual key`);
    hasErrors = true;
  } else if (sensitive && value.length < 32) {
    console.log(`⚠️  ${name}: ${displayValue}`);
    console.log(`   → Value seems too short for security (${value.length} chars)`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${name}: ${displayValue}`);
  }
});

// Check optional variables
console.log('\n📋 Optional Variables:');
console.log('─'.repeat(70));

OPTIONAL_VARS.forEach(({ name, default: defaultValue, sensitive }) => {
  const value = process.env[name] || defaultValue;
  const isUsingDefault = !process.env[name];
  const displayValue = sensitive ? maskValue(value) : value;
  
  if (sensitive && value && isPlaceholder(value)) {
    console.log(`⚠️  ${name}: ${displayValue} (placeholder)`);
    hasWarnings = true;
  } else if (isUsingDefault) {
    console.log(`ℹ️  ${name}: ${displayValue} (using default)`);
  } else {
    console.log(`✅ ${name}: ${displayValue}`);
  }
});

// Check for common issues
console.log('\n🔍 Security Checks:');
console.log('─'.repeat(70));

// Check JWT_SECRET strength
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret && jwtSecret !== 'your-secret-key-change-in-production' && jwtSecret.length < 32) {
  console.log(`⚠️  JWT_SECRET is too short (${jwtSecret.length} chars)`);
  console.log('   → Recommended: at least 64 characters');
  console.log('   → Run: node scripts/generateSecrets.js to generate a secure key');
  hasWarnings = true;
} else if (jwtSecret && !isPlaceholder(jwtSecret)) {
  console.log('✅ JWT_SECRET has adequate length');
}

// Check if in production with weak config
if (process.env.NODE_ENV === 'production') {
  if (jwtSecret === 'your-secret-key-change-in-production') {
    console.log('❌ CRITICAL: Using default JWT_SECRET in production!');
    hasErrors = true;
  }
  if (process.env.DB_PASSWORD === 'postgres') {
    console.log('❌ CRITICAL: Using default database password in production!');
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(70));
if (hasErrors) {
  console.log('\n❌ Configuration has ERRORS - please fix the issues above');
  console.log('\n📖 Read ENV_SETUP_GUIDE.md for detailed setup instructions');
  console.log('🔑 Run: node scripts/generateSecrets.js to generate secure keys');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Configuration has WARNINGS - consider addressing them');
  console.log('\n📖 Read ENV_SETUP_GUIDE.md for detailed setup instructions');
  process.exit(0);
} else {
  console.log('\n✅ Environment configuration looks good!');
  console.log('\n🚀 You can now start your application');
  process.exit(0);
}

