const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'myclinic.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
  } else {
    console.log('✅ Connected to local SQLite Database successfully.');
  }
});

/**
 * Intelligent Query helper designed as a drop-in replacement for mysql2/promise.
 * It parses the SQL statement:
 * - If it's a write action (INSERT/UPDATE/DELETE), it runs db.run() and returns [resultObj]
 * - If it's a read action (SELECT), it runs db.all() and returns [rowsArray]
 */
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const isWrite = /^\s*(insert|update|delete|replace|create|drop|alter)\b/i.test(sql);
    
    if (isWrite) {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          // Format like mysql2 return array: [result]
          resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        }
      });
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Format like mysql2 return array: [rows]
          resolve([rows]);
        }
      });
    }
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ insertId: this.lastID, changes: this.changes });
    });
  });
};

const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

module.exports = {
  db,
  query,
  get,
  run,
  exec
};
