const { globalShortcut, screen } = require('electron');
const { readConfig, writeConfig } = require('./config');
const { captureSelection } = require('./selection');

const DEFAULT_HOTKEYS = {
  wake:  'CommandOrControl+Shift+W',
  // Moved off Ctrl+Shift+H so nothing feels close to Win+H (Windows voice typing)
  hide:  'CommandOrControl+Shift+B',
  panel: 'CommandOrControl+Shift+P',
  // E for "extract": avoids Ctrl+Shift+S, which many apps use for Save As
  capture: 'CommandOrControl+Shift+E'
};

let windowsRef = null;
let currentHotkeys = { ...DEFAULT_HOTKEYS };

function getHotkeys() {
  const saved = readConfig().hotkeys || {};
  const merged = { ...DEFAULT_HOTKEYS };
  Object.keys(DEFAULT_HOTKEYS).forEach((action) => {
    if (typeof saved[action] === 'string' && saved[action].includes('+')) {
      merged[action] = saved[action];
    }
  });
  return merged;
}

function keepPetOnTop(petWindow) {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  petWindow.moveTop();
}

// 2.0: BEBO snaps to the monitor the cursor is on
function snapPetToActiveMonitor(petWindow) {
  if (!petWindow || petWindow.isDestroyed()) return;
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const { x, y, width, height } = display.workArea;
  const [w, h] = petWindow.getSize();
  petWindow.setPosition(Math.round(x + width - w - 24), Math.round(y + height - h - 36));
}

const HANDLERS = {
  wake() {
    const { petWindow } = windowsRef;
    if (!petWindow || petWindow.isDestroyed()) return;
    snapPetToActiveMonitor(petWindow);
    if (!petWindow.isVisible()) petWindow.show();
    keepPetOnTop(petWindow);
    petWindow.webContents.send('pet:setState', { state: 'happy', durationMs: 1500 });
    petWindow.webContents.send('pet:showBubble', {
      text: 'I am awake.',
      autoHideMs: 2000
    });
  },
  hide() {
    const { petWindow } = windowsRef;
    if (!petWindow || petWindow.isDestroyed()) return;
    if (petWindow.isVisible()) petWindow.hide();
    else petWindow.show();
  },
  panel() {
    const { petWindow, panelWindow } = windowsRef;
    if (!panelWindow || panelWindow.isDestroyed()) return;
    if (panelWindow.isVisible()) {
      panelWindow.hide();
    } else {
      panelWindow.show();
      panelWindow.focus();
      keepPetOnTop(petWindow);
    }
  },

  // Grab the selection from whatever app is in front, then bring it to BEBO.
  // Nothing here may steal focus before the copy happens, or we would capture
  // BEBO's own window instead of the user's text.
  async capture() {
    const { petWindow, panelWindow } = windowsRef;
    if (!panelWindow || panelWindow.isDestroyed()) return;

    if (petWindow && !petWindow.isDestroyed()) {
      petWindow.webContents.send('pet:setState', { state: 'listening', durationMs: 1200 });
    }

    const { text, reason } = await captureSelection();

    if (!text) {
      // Nothing selected, or the focused app blocked synthetic input (anything
      // running as Administrator does when BEBO is not elevated).
      if (petWindow && !petWindow.isDestroyed()) {
        petWindow.webContents.send('pet:setState', { state: 'confused', durationMs: 1600 });
        petWindow.webContents.send('pet:showBubble', {
          text: 'Select some text first.',
          autoHideMs: 2600
        });
      }
      return;
    }

    // Safe to show the panel now that the copy is done.
    panelWindow.show();
    panelWindow.focus();
    keepPetOnTop(petWindow);
    panelWindow.webContents.send('panel:selectionCaptured', { text, reason: reason || null });
  }
};

function registerSet(hotkeys) {
  globalShortcut.unregisterAll();
  const failed = [];
  Object.keys(DEFAULT_HOTKEYS).forEach((action) => {
    let ok = false;
    try {
      ok = globalShortcut.register(hotkeys[action], HANDLERS[action]);
    } catch (_) {
      ok = false;
    }
    if (!ok) failed.push(action);
  });
  return failed;
}

function setupShortcuts(windows) {
  windowsRef = windows;
  currentHotkeys = getHotkeys();
  const failed = registerSet(currentHotkeys);
  if (failed.length) {
    // BUG FIX: this previously reset EVERY hotkey to defaults when any single
    // combo failed, silently wiping the user's other custom bindings. Now only
    // the combos that actually failed fall back to their default.
    failed.forEach((action) => { currentHotkeys[action] = DEFAULT_HOTKEYS[action]; });
    registerSet(currentHotkeys);
  }
}

function updateHotkeys(next) {
  const cleaned = { ...currentHotkeys };
  Object.keys(DEFAULT_HOTKEYS).forEach((action) => {
    if (next && typeof next[action] === 'string' && next[action].includes('+')) {
      cleaned[action] = next[action];
    }
  });

  const values = Object.values(cleaned);
  if (new Set(values).size !== values.length) {
    return { ok: false, failed: [], reason: 'duplicate' };
  }

  const failed = registerSet(cleaned);
  if (failed.length) {
    registerSet(currentHotkeys); // roll back to the working set
    return { ok: false, failed, reason: 'taken' };
  }

  currentHotkeys = cleaned;
  writeConfig({ hotkeys: cleaned });
  return { ok: true, hotkeys: cleaned };
}

module.exports = { setupShortcuts, updateHotkeys, getHotkeys, DEFAULT_HOTKEYS };
