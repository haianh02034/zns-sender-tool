const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function initializeDatabase() {
  const db = await open({
    filename: './zns.db', // This will create a file named zns.db in your zns-tool directory
    driver: sqlite3.Database
  });
  return db;
}

module.exports = initializeDatabase(); // Export the promise of the database connection
