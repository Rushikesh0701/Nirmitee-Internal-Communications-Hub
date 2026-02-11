const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

async function listOrgs() {
    try {
        console.log('Fetching organizations...');
        const orgs = await clerk.organizations.getOrganizationList();
        console.log('Organizations found:', orgs.length);
        orgs.forEach(org => {
            console.log(`- Name: ${org.name}, ID: ${org.id}`);
        });

        if (orgs.length === 0) {
            console.log('No organizations found. Please create one in the Clerk Dashboard.');
        }
    } catch (error) {
        console.error('Error fetching organizations:', error.message);
    }
}

listOrgs();
