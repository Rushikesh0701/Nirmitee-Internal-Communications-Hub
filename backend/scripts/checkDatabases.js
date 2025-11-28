/**
 * Database Connection Checker
 * Checks if PostgreSQL and MongoDB are running and accessible
 */

require('dotenv').config();
const sequelize = require('../config/sequelize');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nirmitee_hub';
const DB_NAME = process.env.DB_NAME || 'nirmitee_hub';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5432;
const DB_USER = process.env.DB_USER || 'postgres';

async function checkPostgreSQL() {
  console.log('\n🔍 Checking PostgreSQL Connection...');
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   User: ${DB_USER}`);
  
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL (Sequelize) is CONNECTED');
    
    // Try a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('✅ PostgreSQL query successful');
    return true;
  } catch (error) {
    console.log('❌ PostgreSQL (Sequelize) is NOT CONNECTED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Name: ${error.name}`);
    
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.log('\n💡 To start PostgreSQL:');
      console.log('   macOS (Homebrew): brew services start postgresql');
      console.log('   macOS (Postgres.app): Open Postgres.app');
      console.log('   Linux: sudo systemctl start postgresql');
      console.log('   Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres');
    }
    
    return false;
  }
}

async function checkMongoDB() {
  console.log('\n🔍 Checking MongoDB Connection...');
  console.log(`   URI: ${MONGODB_URI}`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB is CONNECTED');
    
    // Try a simple query
    const adminDb = mongoose.connection.db.admin();
    const result = await adminDb.ping();
    console.log('✅ MongoDB ping successful');
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ MongoDB is NOT CONNECTED');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
      console.log('\n💡 To start MongoDB:');
      console.log('   macOS (Homebrew): brew services start mongodb-community');
      console.log('   macOS (MongoDB.app): Open MongoDB.app');
      console.log('   Linux: sudo systemctl start mongod');
      console.log('   Docker: docker run -d -p 27017:27017 mongo');
    }
    
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE CONNECTION CHECKER');
  console.log('='.repeat(60));
  
  const pgConnected = await checkPostgreSQL();
  const mongoConnected = await checkMongoDB();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));
  console.log(`PostgreSQL: ${pgConnected ? '✅ CONNECTED' : '❌ NOT CONNECTED'}`);
  console.log(`MongoDB:    ${mongoConnected ? '✅ CONNECTED' : '❌ NOT CONNECTED'}`);
  
  console.log('\n📋 Database Usage:');
  console.log('   PostgreSQL (Sequelize):');
  console.log('     - User registration/login');
  console.log('     - Learning courses');
  console.log('     - Surveys');
  console.log('     - Recognitions & Rewards');
  console.log('     - Certificates');
  console.log('     - Notifications');
  console.log('');
  console.log('   MongoDB:');
  console.log('     - Blogs');
  console.log('     - News');
  console.log('     - Discussions');
  console.log('     - Announcements');
  console.log('     - Groups');
  console.log('     - RSS feeds');
  
  if (!pgConnected || !mongoConnected) {
    console.log('\n⚠️  Some databases are not connected. Some features may not work.');
    process.exit(1);
  } else {
    console.log('\n✅ All databases are connected!');
    process.exit(0);
  }
}

main().catch(console.error);

