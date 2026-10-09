const path = require('path');
const { BrowserWindow, screen } = require('electron');

// The pet image stays 80x80. The window is deliberately larger so animations
// (rotation, jumps, dance) are not clipped by the window edge — an 80px square
// rotated 10deg already needs ~93px of width. The extra area is transparent AND
// click-through (see setupClickThrough), so it costs the user nothing.
const PET_WINDOW = { width: 132, height: 148 };
// Offsets chosen so BEBO's visible body lands in the same screen position it
// occupied at the old 92x116 size.
const PET_OFFSET = { right: 142, bottom: 184 };

function createPetWindow() {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;

  const win = new BrowserWindow({
    width: PET_WINDOW.width,
    height: PET_WINDOW.height,
    x: x + Math.max(24, width - PET_OFFSET.right),
    y: y + Math.max(24, height - PET_OFFSET.bottom),
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

  // Start fully click-through. The renderer hit-tests the cursor against
  // BEBO's body and re-enables clicks only over the pet itself, so the
  // transparent area never swallows clicks meant for the desktop below.
  // This also removes the dead strip the old 92x116 window had above the pet.
  win.setIgnoreMouseEvents(true, { forward: true });

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

module.exports = { createPetWindow, createPanelWindow, createSetupWindow, PET_WINDOW };
