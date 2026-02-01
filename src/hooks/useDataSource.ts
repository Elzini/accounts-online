/**
 * Data Source Hook
 * Automatically switches between local SQLite and cloud Supabase
 * based on whether running in Electron or browser
 */

import { useState, useEffect, useCallback } from 'react';
import { isElectron, electronDB, electronSync } from '@/lib/electron-bridge';

export type DataSourceType = 'local' | 'cloud';

interface DataSourceState {
  source: DataSourceType;
  isOnline: boolean;
  isElectronApp: boolean;
  syncStatus: {
    unsynced: number;
    lastSync: string | null;
    syncInProgress: boolean;
  } | null;
}

export function useDataSource() {
  const [state, setState] = useState<DataSourceState>({
    source: 'cloud',
    isOnline: true,
    isElectronApp: false,
    syncStatus: null,
  });

  // Check environment on mount
  useEffect(() => {
    const checkEnvironment = async () => {
      const inElectron = isElectron();
      
      if (inElectron) {
        try {
          // Initialize local database
          await electronDB.init();
          
          // Check online status
          const isOnline = await electronSync.checkOnline();
          
          // Get sync status
          const syncStatus = await electronSync.getStatus();
          
          setState({
            source: 'local', // Use local DB in Electron
            isOnline,
            isElectronApp: true,
            syncStatus: {
              unsynced: syncStatus.unsynced,
              lastSync: syncStatus.lastSync,
              syncInProgress: syncStatus.syncInProgress,
            },
          });
        } catch (error) {
          console.error('Failed to initialize Electron data source:', error);
          // Fall back to cloud if local fails
          setState({
            source: 'cloud',
            isOnline: true,
            isElectronApp: true,
            syncStatus: null,
          });
        }
      } else {
        // In browser, always use cloud
        setState({
          source: 'cloud',
          isOnline: true,
          isElectronApp: false,
          syncStatus: null,
        });
      }
    };

    checkEnvironment();
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async (companyId: string) => {
    if (!state.isElectronApp) return { success: false, reason: 'not_electron' };
    
    try {
      setState(prev => ({
        ...prev,
        syncStatus: prev.syncStatus ? { ...prev.syncStatus, syncInProgress: true } : null,
      }));
      
      const result = await electronSync.fullSync(companyId);
      const newStatus = await electronSync.getStatus();
      
      setState(prev => ({
        ...prev,
        isOnline: newStatus.isOnline,
        syncStatus: {
          unsynced: newStatus.unsynced,
          lastSync: newStatus.lastSync,
          syncInProgress: false,
        },
      }));
      
      return { success: true, ...result };
    } catch (error) {
      setState(prev => ({
        ...prev,
        syncStatus: prev.syncStatus ? { ...prev.syncStatus, syncInProgress: false } : null,
      }));
      return { success: false, error };
    }
  }, [state.isElectronApp]);

  // Initial data load from cloud
  const initialLoadFromCloud = useCallback(async (companyId: string, authToken: string) => {
    if (!state.isElectronApp) return { success: false, reason: 'not_electron' };
    
    try {
      // Set auth token for cloud requests
      await electronSync.setAuthToken(authToken);
      
      // Check if online
      const isOnline = await electronSync.checkOnline();
      if (!isOnline) {
        return { success: false, reason: 'offline' };
      }
      
      // Load data from cloud
      const result = await electronSync.initialLoad(companyId);
      return { success: true, ...result };
    } catch (error) {
      return { success: false, error };
    }
  }, [state.isElectronApp]);

  // Refresh online status
  const refreshOnlineStatus = useCallback(async () => {
    if (!state.isElectronApp) return;
    
    try {
      const isOnline = await electronSync.checkOnline();
      setState(prev => ({ ...prev, isOnline }));
    } catch {
      setState(prev => ({ ...prev, isOnline: false }));
    }
  }, [state.isElectronApp]);

  return {
    ...state,
    triggerSync,
    initialLoadFromCloud,
    refreshOnlineStatus,
    isLocalMode: state.source === 'local',
    isCloudMode: state.source === 'cloud',
  };
}
