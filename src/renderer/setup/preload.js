const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('setupAPI', {
  validateKey: (key) => ipcRenderer.invoke('setup:validate-key', key),
  saveKey:     (key) => ipcRenderer.invoke('setup:save-key', key),
  openGroq:    ()    => ipcRenderer.send('setup:open-groq'),
});
