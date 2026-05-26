const path = require('path');
const { BrowserWindow, screen } = require('electron');

function createPetWindow() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  const win = new BrowserWindow({
    width: 92,
    height: 116,
    x: x + Math.max(24, width - 122),
    y: y + Math.max(24, height - 152),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    focusable: false,
    title: 'BEBO the PET',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../renderer/pet/preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '../renderer/pet/index.html'));
  win.setAlwaysOnTop(true, 'screen-saver', 1);
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  return win;
}

function createPanelWindow() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  const win = new BrowserWindow({
    width: 380,
    height: 620,
    x: x + Math.max(24, width - 430),
    y: y + Math.max(40, height - 700),
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    resizable: true,
    title: 'BEBO Assistant',
    backgroundColor: '#12131f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../renderer/panel/preload.js')
    }
  });

  win.loadFile(path.join(__dirname, '../renderer/panel/index.html'));
  win.setAlwaysOnTop(true, 'floating');

  return win;
}

function createSetupWindow() {
  const win = new BrowserWindow({
    width: 440,
    height: 580,
    frame: false,
    resizable: false,
    center: true,
    alwaysOnTop: true,
    title: 'BEBO Setup',
    backgroundColor: '#12131f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../renderer/setup/preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/setup/index.html'));
  return win;
}

module.exports = { createPetWindow, createPanelWindow, createSetupWindow };
