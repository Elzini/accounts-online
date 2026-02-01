/**
 * Sync Service for Hybrid Mode
 * Synchronizes local SQLite database with Supabase cloud
 */

const { getDatabase, sync, tables } = require('./database.cjs');

// Supabase configuration
const SUPABASE_URL = 'https://qbtkhiotvhcpmuzawkhi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFidGtoaW90dmhjcG11emF3a2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNjg1MjMsImV4cCI6MjA4Mzc0NDUyM30.K7rRHk-Jo2C_98Qx4DV-wpw1dUdtxIS6w2yigrU8ET8';

// Tables to sync
const SYNC_TABLES = [
  'companies',
  'customers',
  'suppliers',
  'cars',
  'sales',
  'expenses',
  'journal_entries',
  'journal_entry_lines',
  'vouchers',
  'account_categories',
  'fiscal_years',
  'employees',
  'payroll_records',
  'quotations',
  'quotation_items'
];

let authToken = null;
let isOnline = false;
let syncInProgress = false;

/**
 * Check if online
 */
async function checkOnlineStatus() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    isOnline = response.ok;
  } catch {
    isOnline = false;
  }
  return isOnline;
}

/**
 * Set auth token for authenticated requests
 */
function setAuthToken(token) {
  authToken = token;
}

/**
 * Make authenticated request to Supabase
 */
async function supabaseRequest(endpoint, options = {}) {
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase request failed: ${error}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

/**
 * Push local changes to cloud
 */
async function pushChangesToCloud() {
  if (!isOnline || !authToken) {
    console.log('Cannot push: offline or not authenticated');
    return { success: false, reason: 'offline' };
  }

  const changes = sync.getUnsyncedChanges();
  if (changes.length === 0) {
    console.log('No changes to push');
    return { success: true, pushed: 0 };
  }

  console.log(`Pushing ${changes.length} changes to cloud...`);
  const syncedIds = [];

  for (const change of changes) {
    try {
      const data = JSON.parse(change.data);
      
      switch (change.operation) {
        case 'INSERT':
          await supabaseRequest(`/${change.table_name}`, {
            method: 'POST',
            body: JSON.stringify(data)
          });
          break;
          
        case 'UPDATE':
          await supabaseRequest(`/${change.table_name}?id=eq.${change.record_id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
          });
          break;
          
        case 'DELETE':
          await supabaseRequest(`/${change.table_name}?id=eq.${change.record_id}`, {
            method: 'DELETE'
          });
          break;
      }
      
      syncedIds.push(change.id);
    } catch (error) {
      console.error(`Failed to sync change ${change.id}:`, error);
    }
  }

  if (syncedIds.length > 0) {
    sync.markAsSynced(syncedIds);
  }

  return { success: true, pushed: syncedIds.length, failed: changes.length - syncedIds.length };
}

/**
 * Pull changes from cloud to local
 */
async function pullChangesFromCloud(companyId) {
  if (!isOnline || !authToken) {
    console.log('Cannot pull: offline or not authenticated');
    return { success: false, reason: 'offline' };
  }

  console.log('Pulling changes from cloud...');
  const database = getDatabase();
  let totalPulled = 0;

  for (const tableName of SYNC_TABLES) {
    try {
      // Get last sync time for this table
      const lastSync = database.prepare(
        'SELECT MAX(updated_at) as last_update FROM ' + tableName + ' WHERE company_id = ?'
      ).get(companyId)?.last_update;

      // Build query
      let query = `/${tableName}?company_id=eq.${companyId}`;
      if (lastSync) {
        query += `&updated_at=gt.${lastSync}`;
      }
      query += '&order=updated_at.asc';

      const records = await supabaseRequest(query);
      
      if (records && records.length > 0) {
        for (const record of records) {
          // Check if record exists locally
          const existing = database.prepare(
            `SELECT id FROM ${tableName} WHERE id = ?`
          ).get(record.id);

          if (existing) {
            // Update existing record
            const columns = Object.keys(record).filter(k => k !== 'id');
            const setClause = columns.map(col => `${col} = ?`).join(', ');
            const values = columns.map(col => record[col]);
            
            database.prepare(
              `UPDATE ${tableName} SET ${setClause} WHERE id = ?`
            ).run(...values, record.id);
          } else {
            // Insert new record
            const columns = Object.keys(record);
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(col => record[col]);
            
            database.prepare(
              `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
            ).run(...values);
          }
        }
        
        totalPulled += records.length;
        console.log(`Pulled ${records.length} records from ${tableName}`);
      }
    } catch (error) {
      console.error(`Failed to pull ${tableName}:`, error);
    }
  }

  return { success: true, pulled: totalPulled };
}

/**
 * Full sync (push then pull)
 */
async function fullSync(companyId) {
  if (syncInProgress) {
    console.log('Sync already in progress');
    return { success: false, reason: 'in_progress' };
  }

  syncInProgress = true;

  try {
    await checkOnlineStatus();
    
    if (!isOnline) {
      return { success: false, reason: 'offline' };
    }

    // Push local changes first
    const pushResult = await pushChangesToCloud();
    
    // Then pull remote changes
    const pullResult = await pullChangesFromCloud(companyId);
    
    // Cleanup old sync logs
    sync.cleanupSyncLog();

    return {
      success: true,
      pushed: pushResult.pushed || 0,
      pulled: pullResult.pulled || 0
    };
  } catch (error) {
    console.error('Sync failed:', error);
    return { success: false, error: error.message };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Initial data load from cloud
 */
async function initialDataLoad(companyId) {
  if (!isOnline || !authToken) {
    console.log('Cannot load: offline or not authenticated');
    return { success: false, reason: 'offline' };
  }

  console.log('Loading initial data from cloud...');
  const database = getDatabase();
  let totalLoaded = 0;

  for (const tableName of SYNC_TABLES) {
    try {
      const records = await supabaseRequest(
        `/${tableName}?company_id=eq.${companyId}&order=created_at.asc`
      );
      
      if (records && records.length > 0) {
        // Clear existing data for this company
        database.prepare(`DELETE FROM ${tableName} WHERE company_id = ?`).run(companyId);
        
        // Insert all records
        for (const record of records) {
          const columns = Object.keys(record);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(col => 
            typeof record[col] === 'object' ? JSON.stringify(record[col]) : record[col]
          );
          
          database.prepare(
            `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
          ).run(...values);
        }
        
        totalLoaded += records.length;
        console.log(`Loaded ${records.length} records from ${tableName}`);
      }
    } catch (error) {
      console.error(`Failed to load ${tableName}:`, error);
    }
  }

  return { success: true, loaded: totalLoaded };
}

/**
 * Get sync status
 */
function getSyncStatus() {
  const status = sync.getSyncStatus();
  return {
    ...status,
    isOnline,
    syncInProgress
  };
}

module.exports = {
  checkOnlineStatus,
  setAuthToken,
  pushChangesToCloud,
  pullChangesFromCloud,
  fullSync,
  initialDataLoad,
  getSyncStatus,
  isOnline: () => isOnline
};
