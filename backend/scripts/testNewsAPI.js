#!/usr/bin/env node

/**
 * Test NewsData.io API Key
 * This script tests if your API key is working with the live NewsData.io API
 */

require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.NEWSDATA_API_KEY;
const BASE_URL = 'https://newsdata.io/api/1/news';

console.log('🧪 Testing NewsData.io API Configuration\n');
console.log('='.repeat(70));

// Check if API key is set
console.log('\n1️⃣ Checking API Key Configuration...');
if (!API_KEY) {
  console.log('❌ ERROR: NEWSDATA_API_KEY not found in environment');
  console.log('   Make sure .env file exists in the backend directory');
  process.exit(1);
}

if (API_KEY === 'your_newsdata_api_key_here' || 
    API_KEY === 'REPLACE_WITH_YOUR_NEWSDATA_API_KEY') {
  console.log('❌ ERROR: API key is still a placeholder');
  console.log('   Please replace it with your actual key from newsdata.io');
  process.exit(1);
}

console.log(`✅ API Key found: ${API_KEY.substring(0, 15)}...`);

// Test API call
console.log('\n2️⃣ Testing Live API Call to NewsData.io...');
console.log('   Making request to:', BASE_URL);

const testUrl = `${BASE_URL}?apikey=${API_KEY}&language=en&size=5`;

axios.get(testUrl, {
  timeout: 10000,
  headers: {
    'User-Agent': 'Nirmitee-Hub/1.0'
  }
})
  .then(response => {
    console.log('✅ API Call Successful!');
    console.log('\n📊 Response Summary:');
    console.log('─'.repeat(70));
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = response.data;
    console.log(`   Status Code: ${data.status}`);
    console.log(`   Total Results: ${data.totalResults || 'N/A'}`);
    console.log(`   Articles Returned: ${data.results ? data.results.length : 0}`);
    
    if (data.results && data.results.length > 0) {
      console.log('\n📰 Sample Article Titles:');
      console.log('─'.repeat(70));
      data.results.slice(0, 3).forEach((article, idx) => {
        console.log(`   ${idx + 1}. ${article.title}`);
      });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ SUCCESS! Your NewsData.io API key is working correctly!');
    console.log('\n🚀 Your backend server should now fetch live news data.');
    console.log('   If you\'re still seeing sample data, try:');
    console.log('   1. Clear your browser cache');
    console.log('   2. Refresh the news page');
    console.log('   3. Check browser console for errors');
    process.exit(0);
  })
  .catch(error => {
    console.log('❌ API Call Failed!');
    console.log('\n🔍 Error Details:');
    console.log('─'.repeat(70));
    
    if (error.response) {
      // Server responded with error
      console.log(`   Status: ${error.response.status} ${error.response.statusText}`);
      console.log(`   Error Data:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.log('\n💡 This looks like an authentication error:');
        console.log('   - Your API key might be invalid or expired');
        console.log('   - Check your key at https://newsdata.io/');
        console.log('   - Make sure you copied the entire key correctly');
      } else if (error.response.status === 429) {
        console.log('\n💡 Rate limit exceeded:');
        console.log('   - You\'ve made too many requests');
        console.log('   - Wait a few minutes and try again');
        console.log('   - Consider upgrading your plan at newsdata.io');
      }
    } else if (error.request) {
      // Request made but no response
      console.log('   No response received from server');
      console.log('   Error:', error.message);
      console.log('\n💡 This might be a network issue:');
      console.log('   - Check your internet connection');
      console.log('   - Verify newsdata.io is accessible');
      console.log('   - Check if you\'re behind a firewall/proxy');
    } else {
      // Error in request setup
      console.log('   Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('❌ FAILED: Unable to connect to NewsData.io API');
    console.log('\n📖 For help, check ENV_SETUP_GUIDE.md');
    process.exit(1);
  });

