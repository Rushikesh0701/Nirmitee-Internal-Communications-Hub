/**
 * PostgreSQL Setup Script
 * Creates database and user if they don't exist
 */

const { execSync } = require('child_process');
const os = require('os');

const DB_NAME = process.env.DB_NAME || 'nirmitee_hub';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const currentUser = os.userInfo().username;

console.log('🔧 PostgreSQL Setup Script');
console.log('='.repeat(60));
console.log(`Database: ${DB_NAME}`);
console.log(`Requested User: ${DB_USER}`);
console.log(`Current System User: ${currentUser}`);
console.log('');

// Find PostgreSQL installation
let psqlPath = '';
const possiblePaths = [
  '/usr/local/bin/psql',
  '/opt/homebrew/bin/psql',
  '/usr/local/opt/postgresql@17/bin/psql',
  '/opt/homebrew/opt/postgresql@17/bin/psql',
  '/usr/local/opt/postgresql@16/bin/psql',
  '/opt/homebrew/opt/postgresql@16/bin/psql',
  '/usr/local/opt/postgresql@15/bin/psql',
  '/opt/homebrew/opt/postgresql@15/bin/psql',
];

for (const path of possiblePaths) {
  try {
    execSync(`test -f ${path}`, { stdio: 'ignore' });
    psqlPath = path;
    break;
  } catch (e) {
    // Continue searching
  }
}

if (!psqlPath) {
  console.log('❌ PostgreSQL client (psql) not found');
  console.log('');
  console.log('💡 Solutions:');
  console.log('1. Add PostgreSQL to PATH:');
  console.log('   export PATH="/usr/local/opt/postgresql@17/bin:$PATH"');
  console.log('   or');
  console.log('   export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"');
  console.log('');
  console.log('2. Or create database manually:');
  console.log(`   createdb ${DB_NAME}`);
  console.log('');
  console.log('3. Or update .env to use your system user:');
  console.log(`   DB_USER=${currentUser}`);
  console.log(`   DB_PASSWORD=`); // No password for local user
  process.exit(1);
}

console.log(`✅ Found PostgreSQL at: ${psqlPath}`);
console.log('');

// Try to connect with current user first
let connectUser = currentUser;
let connectPassword = '';

try {
  console.log(`🔍 Trying to connect as user: ${connectUser}`);
  execSync(`${psqlPath} -U ${connectUser} -d postgres -c "SELECT 1;"`, {
    stdio: 'ignore'
  });
  console.log(`✅ Can connect as: ${connectUser}`);
  connectUser = currentUser;
} catch (e) {
  console.log(`❌ Cannot connect as: ${connectUser}`);
  console.log('');
  console.log('💡 You need to either:');
  console.log(`1. Create the database manually: createdb ${DB_NAME}`);
  console.log(`2. Or update .env file:`);
  console.log(`   DB_USER=${currentUser}`);
  console.log(`   DB_PASSWORD=`);
  process.exit(1);
}

// Create database
try {
  console.log(`\n📦 Creating database: ${DB_NAME}`);
  execSync(`${psqlPath} -U ${connectUser} -d postgres -c "CREATE DATABASE ${DB_NAME};"`, {
    stdio: 'inherit'
  });
  console.log(`✅ Database ${DB_NAME} created successfully`);
} catch (e) {
  if (e.message.includes('already exists')) {
    console.log(`✅ Database ${DB_NAME} already exists`);
  } else {
    console.log(`⚠️  Could not create database: ${e.message}`);
    console.log('   You may need to create it manually');
  }
}

console.log('\n' + '='.repeat(60));
console.log('✅ Setup Complete!');
console.log('='.repeat(60));
console.log('');
console.log('📝 Update your .env file:');
console.log(`   DB_USER=${connectUser}`);
console.log(`   DB_PASSWORD=${connectPassword || '(empty)'}`);
console.log(`   DB_NAME=${DB_NAME}`);
console.log('');

