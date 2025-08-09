// database/db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

/**
 * Open (or create) a SQLite DB at `dbPath`.
 * If `schemaPath` exists, runs the SQL statements from it to ensure schema.
 *
 * @param {string} dbPath - absolute path to sqlite file
 * @param {Object} [options]
 * @param {string} [options.schemaPath] - optional path to schema.sql to run on new DB
 * @returns {Database} better-sqlite3 Database instance
 */
function openDatabase(dbPath, options = {}) {
  if (!dbPath) {
    throw new Error('dbPath is required for openDatabase');
  }

  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open DB (will create file if missing)
  const db = new Database(dbPath);
  try {
    // Enable foreign keys if needed
    db.pragma('foreign_keys = ON');
  } catch (e) {
    // ignore if not supported
  }

  // Optionally run schema SQL if provided and the DB is empty (no user tables)
  const schemaPath = options.schemaPath;
  try {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1").get();
    const hasTables = !!row;

    if (schemaPath && fs.existsSync(schemaPath) && !hasTables) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      // split statements naively on semicolons (works for simple schemas)
      const statements = sql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(Boolean);

      // Run all statements inside a transaction
      db.transaction(() => {
        statements.forEach(stmt => {
          db.prepare(stmt).run();
        });
      })();

      console.log('[db] Initialized schema from', schemaPath);
    }
  } catch (err) {
    console.error('[db] Error while checking/initializing schema:', err);
  }

  console.log('[db] Opened database at', dbPath);
  return db;
}

module.exports = openDatabase;
