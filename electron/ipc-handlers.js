/**
 * IPC Handlers for Electron
 * Bridge between renderer process and local database
 */

const { ipcMain } = require('electron');
const { tables, queries, sync, getDatabase, initDatabase } = require('./database/database');
const syncService = require('./database/sync-service');

/**
 * Register all IPC handlers
 */
function registerIpcHandlers() {
  // ============================================
  // Database Operations
  // ============================================

  // Initialize database
  ipcMain.handle('db:init', async () => {
    try {
      initDatabase();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Generic query
  ipcMain.handle('db:query', async (event, { sql, params }) => {
    try {
      const result = queries.raw(sql, params || []);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Companies
  // ============================================

  ipcMain.handle('db:companies:getAll', async () => {
    try {
      const data = tables.companies.getAll();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:companies:getById', async (event, id) => {
    try {
      const data = tables.companies.getById(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:companies:create', async (event, data) => {
    try {
      const result = tables.companies.create(data);
      return { success: true, data: { ...data, id: result.lastInsertRowid } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:companies:update', async (event, { id, data }) => {
    try {
      tables.companies.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Customers
  // ============================================

  ipcMain.handle('db:customers:getAll', async (event, companyId) => {
    try {
      const data = tables.customers.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:customers:getById', async (event, id) => {
    try {
      const data = tables.customers.getById(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:customers:create', async (event, data) => {
    try {
      tables.customers.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:customers:update', async (event, { id, data }) => {
    try {
      tables.customers.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:customers:delete', async (event, id) => {
    try {
      tables.customers.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Suppliers
  // ============================================

  ipcMain.handle('db:suppliers:getAll', async (event, companyId) => {
    try {
      const data = tables.suppliers.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:suppliers:create', async (event, data) => {
    try {
      tables.suppliers.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:suppliers:update', async (event, { id, data }) => {
    try {
      tables.suppliers.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:suppliers:delete', async (event, id) => {
    try {
      tables.suppliers.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Cars
  // ============================================

  ipcMain.handle('db:cars:getAll', async (event, companyId) => {
    try {
      const data = tables.cars.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:cars:getAvailable', async (event, companyId) => {
    try {
      const data = tables.cars.getAvailable(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:cars:create', async (event, data) => {
    try {
      tables.cars.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:cars:update', async (event, { id, data }) => {
    try {
      tables.cars.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:cars:delete', async (event, id) => {
    try {
      tables.cars.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Sales
  // ============================================

  ipcMain.handle('db:sales:getAll', async (event, companyId) => {
    try {
      const data = tables.sales.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:sales:getNextInvoiceNumber', async (event, companyId) => {
    try {
      const number = tables.sales.getNextInvoiceNumber(companyId);
      return { success: true, data: number };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:sales:create', async (event, data) => {
    try {
      tables.sales.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:sales:update', async (event, { id, data }) => {
    try {
      tables.sales.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:sales:delete', async (event, id) => {
    try {
      tables.sales.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Expenses
  // ============================================

  ipcMain.handle('db:expenses:getAll', async (event, companyId) => {
    try {
      const data = tables.expenses.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:expenses:create', async (event, data) => {
    try {
      tables.expenses.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:expenses:update', async (event, { id, data }) => {
    try {
      tables.expenses.update(id, data);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:expenses:delete', async (event, id) => {
    try {
      tables.expenses.delete(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Journal Entries
  // ============================================

  ipcMain.handle('db:journalEntries:getAll', async (event, companyId) => {
    try {
      const data = tables.journalEntries.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:journalEntries:getWithLines', async (event, id) => {
    try {
      const data = tables.journalEntries.getWithLines(id);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:journalEntries:create', async (event, data) => {
    try {
      tables.journalEntries.create(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Settings
  // ============================================

  ipcMain.handle('db:settings:get', async (event, { companyId, key }) => {
    try {
      const value = tables.appSettings.get(companyId, key);
      return { success: true, data: value };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:settings:set', async (event, { companyId, key, value }) => {
    try {
      tables.appSettings.set(companyId, key, value);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('db:settings:getAll', async (event, companyId) => {
    try {
      const data = tables.appSettings.getAll(companyId);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // ============================================
  // Sync Operations
  // ============================================

  ipcMain.handle('sync:status', async () => {
    try {
      const status = syncService.getSyncStatus();
      return { success: true, data: status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:checkOnline', async () => {
    try {
      const isOnline = await syncService.checkOnlineStatus();
      return { success: true, data: isOnline };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:setAuthToken', async (event, token) => {
    try {
      syncService.setAuthToken(token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:push', async () => {
    try {
      const result = await syncService.pushChangesToCloud();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:pull', async (event, companyId) => {
    try {
      const result = await syncService.pullChangesFromCloud(companyId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:full', async (event, companyId) => {
    try {
      const result = await syncService.fullSync(companyId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync:initialLoad', async (event, companyId) => {
    try {
      const result = await syncService.initialDataLoad(companyId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  console.log('IPC handlers registered');
}

module.exports = { registerIpcHandlers };
