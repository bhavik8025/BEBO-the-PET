const { Tray, Menu, nativeImage, app } = require('electron');

let tray;

function setupTray({ petWindow, panelWindow }) {
  const image = nativeImage.createEmpty();
  tray = new Tray(image);
  tray.setToolTip('BEBO the PET');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open Assistant',
      click: () => {
        panelWindow.show();
        panelWindow.focus();
        petWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        petWindow.moveTop();
      }
    },
    {
      label: 'Show Pet',
      click: () => petWindow.show()
    },
    {
      label: 'Hide Pet',
      click: () => petWindow.hide()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(menu);
}

module.exports = { setupTray };
