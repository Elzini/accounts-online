/**
 * SQLite Database Manager for Electron
 * Handles local database operations with offline support
 */

const path = require('path');
const { app } = require('electron');
const { SCHEMA } = require('./schema.cjs');

let db = null;

/**
 * Get the database file path
 */
function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'accounts-data.sqlite');
}

/**
 * Initialize the database
 */
function initDatabase() {
  if (db) return db;

  try {
    const Database = require('better-sqlite3');
    const dbPath = getDatabasePath();
    
    console.log('Initializing database at:', dbPath);
    
    db = new Database(dbPath);
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // Execute schema
    db.exec(SCHEMA);
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance
 */
function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

/**
 * Generic query methods
 */
const queries = {
  // Get all records from a table
  getAll(tableName, companyId = null) {
    const database = getDatabase();
    if (companyId) {
      return database.prepare(`SELECT * FROM ${tableName} WHERE company_id = ?`).all(companyId);
    }
    return database.prepare(`SELECT * FROM ${tableName}`).all();
  },

  // Get a single record by ID
  getById(tableName, id) {
    const database = getDatabase();
    return database.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(id);
  },

  // Insert a record
  insert(tableName, data) {
    const database = getDatabase();
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
    const stmt = database.prepare(
      `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
    );
    
    return stmt.run(...values);
  },

  // Update a record
  update(tableName, id, data) {
    const database = getDatabase();
    const columns = Object.keys(data);
    const setClause = columns.map(col => `${col} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const stmt = database.prepare(
      `UPDATE ${tableName} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`
    );
    
    return stmt.run(...values);
  },

  // Delete a record
  delete(tableName, id) {
    const database = getDatabase();
    return database.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
  },

  // Execute raw SQL
  raw(sql, params = []) {
    const database = getDatabase();
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return database.prepare(sql).all(...params);
    }
    return database.prepare(sql).run(...params);
  }
};

/**
 * Sync-related methods
 */
const sync = {
  // Get unsynced changes
  getUnsyncedChanges() {
    const database = getDatabase();
    return database.prepare(
      'SELECT * FROM _sync_log WHERE synced = 0 ORDER BY created_at ASC'
    ).all();
  },

  // Mark changes as synced
  markAsSynced(ids) {
    const database = getDatabase();
    const placeholders = ids.map(() => '?').join(', ');
    return database.prepare(
      `UPDATE _sync_log SET synced = 1, synced_at = datetime('now') WHERE id IN (${placeholders})`
    ).run(...ids);
  },

  // Clear old synced records (older than 30 days)
  cleanupSyncLog() {
    const database = getDatabase();
    return database.prepare(
      "DELETE FROM _sync_log WHERE synced = 1 AND synced_at < datetime('now', '-30 days')"
    ).run();
  },

  // Get sync status
  getSyncStatus() {
    const database = getDatabase();
    const unsynced = database.prepare(
      'SELECT COUNT(*) as count FROM _sync_log WHERE synced = 0'
    ).get();
    const total = database.prepare(
      'SELECT COUNT(*) as count FROM _sync_log'
    ).get();
    
    return {
      unsynced: unsynced.count,
      total: total.count,
      lastSync: database.prepare(
        'SELECT MAX(synced_at) as last_sync FROM _sync_log WHERE synced = 1'
      ).get()?.last_sync
    };
  }
};

/**
 * Specific table operations
 */
const tables = {
  // Companies
  companies: {
    getAll: () => queries.getAll('companies'),
    getById: (id) => queries.getById('companies', id),
    create: (data) => queries.insert('companies', data),
    update: (id, data) => queries.update('companies', id, data),
    delete: (id) => queries.delete('companies', id)
  },

  // Customers
  customers: {
    getAll: (companyId) => queries.getAll('customers', companyId),
    getById: (id) => queries.getById('customers', id),
    create: (data) => queries.insert('customers', data),
    update: (id, data) => queries.update('customers', id, data),
    delete: (id) => queries.delete('customers', id)
  },

  // Suppliers
  suppliers: {
    getAll: (companyId) => queries.getAll('suppliers', companyId),
    getById: (id) => queries.getById('suppliers', id),
    create: (data) => queries.insert('suppliers', data),
    update: (id, data) => queries.update('suppliers', id, data),
    delete: (id) => queries.delete('suppliers', id)
  },

  // Cars
  cars: {
    getAll: (companyId) => queries.getAll('cars', companyId),
    getById: (id) => queries.getById('cars', id),
    getAvailable: (companyId) => {
      const database = getDatabase();
      return database.prepare(
        "SELECT * FROM cars WHERE company_id = ? AND status = 'available'"
      ).all(companyId);
    },
    create: (data) => queries.insert('cars', data),
    update: (id, data) => queries.update('cars', id, data),
    delete: (id) => queries.delete('cars', id)
  },

  // Sales
  sales: {
    getAll: (companyId) => queries.getAll('sales', companyId),
    getById: (id) => queries.getById('sales', id),
    getNextInvoiceNumber: (companyId) => {
      const database = getDatabase();
      const result = database.prepare(
        'SELECT MAX(invoice_number) as max_num FROM sales WHERE company_id = ?'
      ).get(companyId);
      return (result?.max_num || 0) + 1;
    },
    create: (data) => queries.insert('sales', data),
    update: (id, data) => queries.update('sales', id, data),
    delete: (id) => queries.delete('sales', id)
  },

  // Expenses
  expenses: {
    getAll: (companyId) => queries.getAll('expenses', companyId),
    getById: (id) => queries.getById('expenses', id),
    create: (data) => queries.insert('expenses', data),
    update: (id, data) => queries.update('expenses', id, data),
    delete: (id) => queries.delete('expenses', id)
  },

  // Journal Entries
  journalEntries: {
    getAll: (companyId) => queries.getAll('journal_entries', companyId),
    getById: (id) => queries.getById('journal_entries', id),
    getWithLines: (id) => {
      const database = getDatabase();
      const entry = database.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
      if (entry) {
        entry.lines = database.prepare(
          'SELECT * FROM journal_entry_lines WHERE journal_entry_id = ?'
        ).all(id);
      }
      return entry;
    },
    create: (data) => queries.insert('journal_entries', data),
    update: (id, data) => queries.update('journal_entries', id, data),
    delete: (id) => queries.delete('journal_entries', id)
  },

  // Settings
  appSettings: {
    get: (companyId, key) => {
      const database = getDatabase();
      return database.prepare(
        'SELECT value FROM app_settings WHERE company_id = ? AND key = ?'
      ).get(companyId, key)?.value;
    },
    set: (companyId, key, value) => {
      const database = getDatabase();
      return database.prepare(`
        INSERT INTO app_settings (company_id, key, value) VALUES (?, ?, ?)
        ON CONFLICT(company_id, key) DO UPDATE SET value = ?, updated_at = datetime('now')
      `).run(companyId, key, value, value);
    },
    getAll: (companyId) => {
      const database = getDatabase();
      return database.prepare(
        'SELECT key, value FROM app_settings WHERE company_id = ?'
      ).all(companyId);
    }
  }
};

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  getDatabasePath,
  queries,
  sync,
  tables
};
