const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  clicked: () => ipcRenderer.send('pet:clicked'),
  doubleClicked: () => ipcRenderer.send('pet:doubleClicked'),
  rightClicked: () => ipcRenderer.send('pet:rightClicked'),
  hovered: (entering) => ipcRenderer.send('pet:hovered', { entering }),
  dragStarted: () => ipcRenderer.send('pet:drag-started'),
  dragged: (position) => ipcRenderer.send('pet:dragged', position),
  dragEnded: () => ipcRenderer.send('pet:drag-ended'),
  onSetState: (callback) => ipcRenderer.on('pet:setState', (_, payload) => callback(payload)),
  onShowBubble: (callback) => ipcRenderer.on('pet:showBubble', (_, payload) => callback(payload)),
  onHideBubble: (callback) => ipcRenderer.on('pet:hideBubble', () => callback())
});
