const { desktopCapturer, ipcMain, Menu, screen } = require('electron');
const { runAITask } = require('./ai-service');

function sendPetState(petWindow, state, durationMs) {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.webContents.send('pet:setState', { state, durationMs });
}

function keepPetOnTop(petWindow) {
  if (!petWindow || petWindow.isDestroyed()) return;
  petWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  petWindow.moveTop();
}

function showPanel(panelWindow, petWindow) {
  if (!panelWindow || panelWindow.isDestroyed()) return;

  panelWindow.setSize(380, 620);

  // Position panel next to BEBO's current position
  if (petWindow && !petWindow.isDestroyed()) {
    const [petX, petY] = petWindow.getPosition();
    const [petW, petH] = petWindow.getSize();
    const display = screen.getDisplayNearestPoint({ x: petX, y: petY });
    const { x: wa_x, y: wa_y, width: wa_w, height: wa_h } = display.workArea;

    const panelW = 380;
    const panelH = 620;
    const gap = 8;

    // Try left of BEBO, bottom-aligned with BEBO
    let panelX = petX - panelW - gap;
    let panelY = petY + petH - panelH;

    // If goes off left edge, place to the right of BEBO
    if (panelX < wa_x) {
      panelX = petX + petW + gap;
    }

    // Clamp within workArea bounds
    panelX = Math.max(wa_x, Math.min(panelX, wa_x + wa_w - panelW));
    panelY = Math.max(wa_y, Math.min(panelY, wa_y + wa_h - panelH));

    panelWindow.setPosition(Math.round(panelX), Math.round(panelY));
  }

  panelWindow.show();
  panelWindow.focus();
  keepPetOnTop(petWindow);
}

function togglePanel(panelWindow, petWindow) {
  if (!panelWindow || panelWindow.isDestroyed()) return;
  if (panelWindow.isVisible()) {
    panelWindow.hide();
    sendPetState(petWindow, 'idle');
  } else {
    showPanel(panelWindow, petWindow);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capturePrimaryScreen({ panelWindow }) {
  const panelWasVisible = panelWindow && !panelWindow.isDestroyed() && panelWindow.isVisible();

  let source;
  try {
    if (panelWasVisible) {
      panelWindow.hide();
      await wait(250);
    }

    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });
    source = sources[0];
  } finally {
    if (panelWasVisible && panelWindow && !panelWindow.isDestroyed()) {
      panelWindow.show();
      panelWindow.focus();
    }
  }

  if (!source || source.thumbnail.isEmpty()) {
    throw new Error('Could not capture the screen.');
  }

  return source.thumbnail.toPNG().toString('base64');
}

function setupIPC({ petWindow, panelWindow }) {
  ipcMain.on('pet:clicked', () => {
    sendPetState(petWindow, 'happy', 1200);
    togglePanel(panelWindow, petWindow);
  });

  ipcMain.on('pet:doubleClicked', () => {
    sendPetState(petWindow, 'excited', 1400);
    showPanel(panelWindow, petWindow);
  });

  ipcMain.on('pet:rightClicked', () => {
    const menu = Menu.buildFromTemplate([
      { label: 'Open Assistant', click: () => showPanel(panelWindow, petWindow) },
      {
        label: 'Wake Pet',
        click: () => sendPetState(petWindow, 'happy', 1500)
      },
      {
        label: 'Hide Pet',
        click: () => petWindow.hide()
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          const { app } = require('electron');
          app.quit();
        }
      }
    ]);
    menu.popup();
  });

  ipcMain.on('pet:hovered', (_, { entering }) => {
    sendPetState(petWindow, entering ? 'curious' : 'idle');
  });

  ipcMain.on('pet:drag-started', () => {
    sendPetState(petWindow, 'listening');
  });

  ipcMain.on('pet:dragged', (_, { x, y }) => {
    if (!petWindow || petWindow.isDestroyed()) return;
    petWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on('pet:drag-ended', () => {
    sendPetState(petWindow, 'idle');
  });

  ipcMain.on('panel:close', () => {
    panelWindow.hide();
    sendPetState(petWindow, 'idle');
  });

  ipcMain.on('task:run', async (_, { type, input }) => {
    sendPetState(petWindow, 'thinking');
    petWindow.webContents.send('pet:showBubble', {
      text: type === 'explain_screen' ? 'Looking...' : 'Working...',
      autoHideMs: 1800
    });

    try {
      const screenshotBase64 = type === 'explain_screen'
        ? await capturePrimaryScreen({ panelWindow })
        : null;
      keepPetOnTop(petWindow);

      const result = await runAITask({ type, input, screenshotBase64 });
      sendPetState(petWindow, result.ok ? 'success' : 'confused', 1400);
      petWindow.webContents.send('pet:showBubble', {
        text: result.ok ? 'Done.' : 'Needs setup.',
        autoHideMs: 3000
      });
      panelWindow.webContents.send('task:result', {
        type,
        output: result.output
      });
    } catch (error) {
      sendPetState(petWindow, 'error', 1400);
      panelWindow.webContents.send('task:result', {
        type,
        output: `Something went wrong: ${error.message}`
      });
    }
  });
}

module.exports = { setupIPC };
