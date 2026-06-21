import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database/usaii.db');
const schemaPath = path.resolve(__dirname, '../database/schema.sql');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database: usaii.db');
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error('Error enabling foreign keys:', pragmaErr.message);
      } else {
        console.log('Foreign key support enabled.');
        initializeDatabase();
      }
    });
  }
});

// Database Initialization
function initializeDatabase() {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users';", (err, row) => {
    if (err) {
      console.error('Error checking database status:', err.message);
      return;
    }
    
    if (!row) {
      console.log('Database tables not found. Initializing from schema.sql...');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schemaSql, (execErr) => {
          if (execErr) {
            console.error('Error executing schema.sql:', execErr.message);
          } else {
            console.log('Database initialized successfully.');
          }
        });
      } else {
        console.error('schema.sql file not found at:', schemaPath);
      }
    } else {
      console.log('Database tables verified.');
    }
  });
}

// Wrapper to export database queries using Promises
export const dbQuery = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec(sql) {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export default db;
