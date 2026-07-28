const path    = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'emoticon.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Unable to open database', err);
    process.exit(1);
  }
});

/* ── INIT TABLES ── */
const init = () => {
  db.serialize(() => {

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        email      TEXT    NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS access_keys (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        key_value     TEXT    NOT NULL UNIQUE,
        customer_id   INTEGER NOT NULL,
        status        TEXT    NOT NULL DEFAULT 'active',
        greeting_file TEXT,
        issued_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );
    `);

    /* Add greeting_file column if upgrading an existing DB */
    db.run(`ALTER TABLE access_keys ADD COLUMN greeting_file TEXT`, () => {
      /* Ignore error — column already exists */
    });

  });
};

/* ── CUSTOMERS ── */
const createCustomer = ({ name, email }, callback) => {
  const sql = 'INSERT INTO customers (name, email) VALUES (?, ?)';
  db.run(sql, [name, email], function (err) {
    callback(err, this && this.lastID);
  });
};

const getAllCustomers = (callback) => {
  const sql = 'SELECT id, name, email, created_at FROM customers ORDER BY created_at DESC';
  db.all(sql, [], callback);
};

const getCustomerByEmail = (email, callback) => {
  const sql = 'SELECT id, name, email, created_at FROM customers WHERE email = ?';
  db.get(sql, [email], callback);
};

/* ── KEYS ── */
const issueKeyForCustomer = ({ key, customerId, greetingFile }, callback) => {
  const sql = 'INSERT INTO access_keys (key_value, customer_id, greeting_file) VALUES (?, ?, ?)';
  db.run(sql, [key, customerId, greetingFile || null], function (err) {
    callback(err, this && this.lastID);
  });
};

const getAllKeys = (callback) => {
  const sql = `
    SELECT k.key_value, k.status, k.greeting_file, k.issued_at,
           c.id AS customer_id, c.name, c.email
    FROM access_keys k
    JOIN customers c ON k.customer_id = c.id
    ORDER BY k.issued_at DESC
  `;
  db.all(sql, [], callback);
};

const getCustomerByKey = (key, callback) => {
  const sql = `
    SELECT c.id, c.name, c.email,
           k.key_value, k.status, k.issued_at, k.greeting_file
    FROM access_keys k
    JOIN customers c ON k.customer_id = c.id
    WHERE k.key_value = ?
  `;
  db.get(sql, [key], callback);
};

const revokeKey = (key, callback) => {
  const sql = `UPDATE access_keys SET status = 'revoked' WHERE key_value = ?`;
  db.run(sql, [key], callback);
};

const keyExists = (key, callback) => {
  const sql = 'SELECT 1 FROM access_keys WHERE key_value = ? LIMIT 1';
  db.get(sql, [key], (err, row) => {
    if (err) return callback(err);
    callback(null, !!row);
  });
};

const close = () => db.close();

module.exports = {
  init,
  createCustomer,
  getAllCustomers,
  getCustomerByEmail,
  issueKeyForCustomer,
  getAllKeys,
  getCustomerByKey,
  revokeKey,
  keyExists,
  close,
};