const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panelAPI', {
  close: () => ipcRenderer.send('panel:close'),
  runTask: (payload) => ipcRenderer.send('task:run', payload),
  onTaskResult: (callback) => ipcRenderer.on('task:result', (_, payload) => callback(payload))
});
