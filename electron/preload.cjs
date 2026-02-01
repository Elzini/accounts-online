// Preload script for Electron
// This runs in a sandboxed environment with limited Node.js access

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => process.env.npm_package_version || '1.0.0',
  getPlatform: () => process.platform,
  
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // Check if running in Electron
  isElectron: true,
});

// Log that preload script is loaded
console.log('Electron preload script loaded');
