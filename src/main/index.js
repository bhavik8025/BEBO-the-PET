require('dotenv').config();

const { app } = require('electron');
const { createPetWindow, createPanelWindow } = require('./windows');
const { setupIPC } = require('./ipc-router');
const { setupShortcuts } = require('./shortcuts');
const { setupTray } = require('./tray');

let petWindow;
let panelWindow;

app.setAppUserModelId('com.local.bebo-the-pet');

app.whenReady().then(() => {
  petWindow = createPetWindow();
  panelWindow = createPanelWindow();

  setupIPC({ petWindow, panelWindow });
  setupShortcuts({ petWindow, panelWindow });
  setupTray({ petWindow, panelWindow });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('before-quit', () => {
  app.isQuitting = true;
});

app.on('will-quit', () => {
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
});
