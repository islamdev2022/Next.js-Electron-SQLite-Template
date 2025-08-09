// database/db.js
const Database = require("better-sqlite3");
const path = require("path");

// Store the DB file in the user data folder (safe for Electron apps)
const dbPath = path.join(process.cwd(), "doorstore.sqlite");

console.log("Database path:", dbPath);

try {
  // Connect (it will create file if it doesn't exist)
  const db = new Database(dbPath);

  // Example: Create a table if it doesn't exist
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0
    )
  `
  ).run();

  console.log("Database initialized successfully");
  module.exports = db;
} catch (error) {
  console.error("Database initialization error:", error);
  throw error;
}
