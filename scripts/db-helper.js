#!/usr/bin/env node

/**
 * Database Helper Script for ChemQuest
 * This script helps you interact with the PostgreSQL database easily
 */

const { exec } = require('child_process');

const DB_CONTAINER = 'chemquest-postgres-dev';
const DB_USER = 'chemquest_user';
const DB_NAME = 'chemquest_db';

function runQuery(query, callback) {
  const command = `docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -c "${query}"`;
  
  console.log(`Running: ${query}`);
  console.log('---');
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error.message);
      return;
    }
    if (stderr) {
      console.error('Stderr:', stderr);
      return;
    }
    console.log(stdout);
    if (callback) callback();
  });
}

// Available commands
const commands = {
  'list-users': () => {
    runQuery('SELECT id, username, email, first_name, last_name, is_verified, created_at FROM users ORDER BY created_at DESC;');
  },
  
  'count-users': () => {
    runQuery('SELECT COUNT(*) as total_users FROM users;');
  },
  
  'verify-user': () => {
    const email = process.argv[3];
    if (!email) {
      console.log('Usage: node db-helper.js verify-user <email>');
      return;
    }
    runQuery(`UPDATE users SET is_verified = true WHERE email = '${email}';`, () => {
      console.log(`User ${email} has been verified!`);
    });
  },
  
  'user-details': () => {
    const email = process.argv[3];
    if (!email) {
      console.log('Usage: node db-helper.js user-details <email>');
      return;
    }
    runQuery(`SELECT * FROM users WHERE email = '${email}';`);
  },
  
  'list-tables': () => {
    runQuery('\\dt');
  },
  
  'help': () => {
    console.log('Available commands:');
    console.log('  list-users     - List all users');
    console.log('  count-users    - Count total users');
    console.log('  verify-user <email> - Manually verify a user');
    console.log('  user-details <email> - Get user details');
    console.log('  list-tables    - List all database tables');
    console.log('  help           - Show this help');
  }
};

// Main execution
const command = process.argv[2];

if (!command || !commands[command]) {
  console.log('ChemQuest Database Helper');
  console.log('========================');
  commands.help();
} else {
  commands[command]();
}