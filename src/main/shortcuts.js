const { globalShortcut } = require('electron');

function setupShortcuts({ petWindow, panelWindow }) {
  function keepPetOnTop() {
    if (!petWindow || petWindow.isDestroyed()) return;
    petWindow.setAlwaysOnTop(true, 'screen-saver', 1);
    petWindow.moveTop();
  }

  globalShortcut.register('CommandOrControl+Shift+P', () => {
    if (panelWindow.isVisible()) {
      panelWindow.hide();
    } else {
      panelWindow.show();
      panelWindow.focus();
      keepPetOnTop();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+W', () => {
    if (!petWindow.isVisible()) petWindow.show();
    keepPetOnTop();
    petWindow.webContents.send('pet:setState', { state: 'happy', durationMs: 1500 });
    petWindow.webContents.send('pet:showBubble', {
      text: 'I am awake.',
      autoHideMs: 2000
    });
  });

  globalShortcut.register('CommandOrControl+Shift+H', () => {
    if (petWindow.isVisible()) petWindow.hide();
    else petWindow.show();
  });
}

module.exports = { setupShortcuts };
