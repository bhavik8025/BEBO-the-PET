const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panelAPI', {
  close: () => ipcRenderer.send('panel:close'),
  runTask: (payload) => ipcRenderer.send('task:run', payload),
  onTaskResult: (callback) => ipcRenderer.on('task:result', (_, payload) => callback(payload)),

  getAppInfo: () => ipcRenderer.invoke('app:getInfo'),
  setTheme: (theme) => ipcRenderer.send('app:setTheme', theme),
  saveHotkeys: (hotkeys) => ipcRenderer.invoke('app:saveHotkeys', hotkeys),
  setTelemetry: (on) => ipcRenderer.invoke('app:setTelemetry', on),
  setAutoPaste: (on) => ipcRenderer.send('app:setAutoPaste', on),
  changeApiKey: (key) => ipcRenderer.invoke('app:changeApiKey', key),
  onClipboardSuggestion: (cb) => ipcRenderer.on('panel:clipboardSuggestion', (_, p) => cb(p)),
  whatsNewSeen: () => ipcRenderer.send('app:whatsNewSeen'),
  openReleases: () => ipcRenderer.send('app:openReleases'),
  onUpdateAvailable: (callback) => ipcRenderer.on('app:updateAvailable', (_, payload) => callback(payload))
});
