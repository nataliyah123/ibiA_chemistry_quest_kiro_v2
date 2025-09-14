#!/usr/bin/env node

/**
 * Email Verification Helper for Development
 * This script helps you manually verify users during development
 */

const { exec } = require('child_process');

const DB_CONTAINER = 'chemquest-postgres-dev';
const DB_USER = 'chemquest_user';
const DB_NAME = 'chemquest_db';

function runQuery(query, callback) {
  const command = `docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "${query}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (stderr) {
      console.error('Stderr:', stderr);
      return;
    }
    if (callback) callback(stdout);
  });
}

const commands = {
  'verify-all': () => {
    console.log('Verifying all unverified users...');
    runQuery('UPDATE users SET is_verified = true WHERE is_verified = false;', (result) => {
      console.log(result);
      console.log('All users have been verified!');
    });
  },
  
  'unverify-all': () => {
    console.log('Unverifying all users (for testing)...');
    runQuery('UPDATE users SET is_verified = false;', (result) => {
      console.log(result);
      console.log('All users have been unverified!');
    });
  },
  
  'list-unverified': () => {
    console.log('Listing unverified users...');
    runQuery('SELECT username, email, created_at FROM users WHERE is_verified = false ORDER BY created_at DESC;', (result) => {
      console.log(result);
    });
  },
  
  'verify-user': () => {
    const email = process.argv[3];
    if (!email) {
      console.log('Usage: node email-verification-helper.js verify-user <email>');
      return;
    }
    runQuery(`UPDATE users SET is_verified = true WHERE email = '${email}';`, (result) => {
      console.log(result);
      console.log(`User ${email} has been verified!`);
    });
  },
  
  'help': () => {
    console.log('Email Verification Helper Commands:');
    console.log('  verify-all           - Verify all unverified users');
    console.log('  unverify-all         - Unverify all users (for testing)');
    console.log('  list-unverified      - List all unverified users');
    console.log('  verify-user <email>  - Verify specific user');
    console.log('  help                 - Show this help');
    console.log('');
    console.log('Note: This is for development only. In production, users should');
    console.log('verify their email through the proper email verification flow.');
  }
};

// Main execution
const command = process.argv[2];

if (!command || !commands[command]) {
  console.log('ChemQuest Email Verification Helper');
  console.log('===================================');
  commands.help();
} else {
  commands[command]();
}