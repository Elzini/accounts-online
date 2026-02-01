/**
 * Electron API Bridge for React
 * Provides type-safe access to Electron IPC from the renderer process
 */

// Check if running in Electron
export const isElectron = (): boolean => {
  return !!(window as any).electronAPI?.isElectron;
};

// Get Electron API
const getElectronAPI = () => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  return (window as any).electronAPI;
};

// IPC invoke wrapper
const ipcInvoke = async <T>(channel: string, ...args: any[]): Promise<T> => {
  if (!isElectron()) {
    throw new Error('Not running in Electron environment');
  }
  
  const { ipcRenderer } = window.require('electron');
  const result = await ipcRenderer.invoke(channel, ...args);
  
  if (!result.success) {
    throw new Error(result.error || 'Unknown error');
  }
  
  return result.data;
};

// ============================================
// Database Operations
// ============================================

export const electronDB = {
  // Initialize database
  init: () => ipcInvoke<void>('db:init'),
  
  // Generic query
  query: <T>(sql: string, params?: any[]) => 
    ipcInvoke<T>('db:query', { sql, params }),

  // Companies
  companies: {
    getAll: () => ipcInvoke<any[]>('db:companies:getAll'),
    getById: (id: string) => ipcInvoke<any>('db:companies:getById', id),
    create: (data: any) => ipcInvoke<any>('db:companies:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:companies:update', { id, data }),
  },

  // Customers
  customers: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:customers:getAll', companyId),
    getById: (id: string) => ipcInvoke<any>('db:customers:getById', id),
    create: (data: any) => ipcInvoke<any>('db:customers:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:customers:update', { id, data }),
    delete: (id: string) => ipcInvoke<void>('db:customers:delete', id),
  },

  // Suppliers
  suppliers: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:suppliers:getAll', companyId),
    create: (data: any) => ipcInvoke<any>('db:suppliers:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:suppliers:update', { id, data }),
    delete: (id: string) => ipcInvoke<void>('db:suppliers:delete', id),
  },

  // Cars
  cars: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:cars:getAll', companyId),
    getAvailable: (companyId: string) => ipcInvoke<any[]>('db:cars:getAvailable', companyId),
    create: (data: any) => ipcInvoke<any>('db:cars:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:cars:update', { id, data }),
    delete: (id: string) => ipcInvoke<void>('db:cars:delete', id),
  },

  // Sales
  sales: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:sales:getAll', companyId),
    getNextInvoiceNumber: (companyId: string) => ipcInvoke<number>('db:sales:getNextInvoiceNumber', companyId),
    create: (data: any) => ipcInvoke<any>('db:sales:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:sales:update', { id, data }),
    delete: (id: string) => ipcInvoke<void>('db:sales:delete', id),
  },

  // Expenses
  expenses: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:expenses:getAll', companyId),
    create: (data: any) => ipcInvoke<any>('db:expenses:create', data),
    update: (id: string, data: any) => ipcInvoke<void>('db:expenses:update', { id, data }),
    delete: (id: string) => ipcInvoke<void>('db:expenses:delete', id),
  },

  // Journal Entries
  journalEntries: {
    getAll: (companyId: string) => ipcInvoke<any[]>('db:journalEntries:getAll', companyId),
    getWithLines: (id: string) => ipcInvoke<any>('db:journalEntries:getWithLines', id),
    create: (data: any) => ipcInvoke<any>('db:journalEntries:create', data),
  },

  // Settings
  settings: {
    get: (companyId: string, key: string) => ipcInvoke<string>('db:settings:get', { companyId, key }),
    set: (companyId: string, key: string, value: string) => 
      ipcInvoke<void>('db:settings:set', { companyId, key, value }),
    getAll: (companyId: string) => ipcInvoke<Array<{key: string, value: string}>>('db:settings:getAll', companyId),
  },
};

// ============================================
// Sync Operations
// ============================================

export const electronSync = {
  // Get sync status
  getStatus: () => ipcInvoke<{
    unsynced: number;
    total: number;
    lastSync: string | null;
    isOnline: boolean;
    syncInProgress: boolean;
  }>('sync:status'),

  // Check online status
  checkOnline: () => ipcInvoke<boolean>('sync:checkOnline'),

  // Set auth token for cloud sync
  setAuthToken: (token: string) => ipcInvoke<void>('sync:setAuthToken', token),

  // Push local changes to cloud
  push: () => ipcInvoke<{ pushed: number; failed: number }>('sync:push'),

  // Pull changes from cloud
  pull: (companyId: string) => ipcInvoke<{ pulled: number }>('sync:pull', companyId),

  // Full sync (push + pull)
  fullSync: (companyId: string) => ipcInvoke<{ pushed: number; pulled: number }>('sync:full', companyId),

  // Initial data load from cloud
  initialLoad: (companyId: string) => ipcInvoke<{ loaded: number }>('sync:initialLoad', companyId),
};

// ============================================
// Platform Detection
// ============================================

export const platform = {
  isElectron,
  isWindows: () => isElectron() && getElectronAPI()?.getPlatform() === 'win32',
  isMac: () => isElectron() && getElectronAPI()?.getPlatform() === 'darwin',
  isLinux: () => isElectron() && getElectronAPI()?.getPlatform() === 'linux',
  getVersion: () => isElectron() ? getElectronAPI()?.getVersion() : null,
};
