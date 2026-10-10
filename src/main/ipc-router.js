const { clipboard, desktopCapturer, ipcMain, Menu, screen } = require('electron');
const { runAITask } = require('./ai-service');
const { readConfig, writeConfig } = require('./config');
const { setBusy, celebrateIfMilestone } = require('./ambient');

// Auto-paste: when the panel opens with an empty input, offer whatever text is
// already on the clipboard. Capped so a giant copy does not fill the box, and
// skipped when the clipboard holds BEBO's own last output (no feedback loop).
const CLIPBOARD_MAX = 8000;
let lastOutput = '';

// Streaming makes a Stop button possible: the panel can abort mid-answer.
let activeTask = null;

/* ── Click-through ────────────────────────────────────────────────────────
   The pet window is bigger than BEBO so animations are not clipped, but the
   transparent surplus must not swallow clicks meant for the desktop.

   The cursor is hit-tested here in the main process rather than in the
   renderer: that would depend on setIgnoreMouseEvents({ forward: true })
   delivering mousemove to the page, which was verified NOT to happen on this
   setup, leaving the pet permanently unclickable. Reading the global cursor
   position needs no event forwarding and cannot get stuck. */
const PET_BODY = { width: 80, height: 80, bottomInset: 6 };
let petIsDragging = false;

function startClickThroughWatcher(petWindow) {
  let overBody = null;                       // null = unknown, force first write

  const tick = () => {
    if (!petWindow || petWindow.isDestroyed()) return;
    if (petIsDragging) return;               // never go click-through mid-drag
    if (!petWindow.isVisible()) return;

    const cursor = screen.getCursorScreenPoint();
    const b = petWindow.getBounds();
    const left = b.x + Math.round((b.width - PET_BODY.width) / 2);
    const top = b.y + b.height - PET_BODY.bottomInset - PET_BODY.height;
    const over =
      cursor.x >= left && cursor.x <= left + PET_BODY.width &&
      cursor.y >= top && cursor.y <= top + PET_BODY.height;

    if (over !== overBody) {
      overBody = over;
      petWindow.setIgnoreMouseEvents(!over, { forward: true });
    }
  };

  const timer = setInterval(tick, 80);       // cheap: one cursor read per tick
  petWindow.on('closed', () => clearInterval(timer));
}

function sendClipboardSuggestion(panelWindow) {
  if (!panelWindow || panelWindow.isDestroyed()) return;
  if (readConfig().autoPaste === false) return;
  let text = '';
  try { text = clipboard.readText() || ''; } catch (_) { return; }
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > CLIPBOARD_MAX) return;
  if (trimmed === lastOutput.trim()) return;
  panelWindow.webContents.send('panel:clipboardSuggestion', { text: trimmed });
}

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
  // Hook the window's own show event rather than individual call sites: the
  // panel can be opened from the pet click, the tray, or the global shortcut
  // (which lives in shortcuts.js and never touches showPanel below).
  panelWindow.on('show', () => sendClipboardSuggestion(panelWindow));
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

  startClickThroughWatcher(petWindow);

  ipcMain.on('pet:hovered', (_, { entering }) => {
    sendPetState(petWindow, entering ? 'curious' : 'idle');
  });

  ipcMain.on('pet:drag-started', () => {
    petIsDragging = true;
    sendPetState(petWindow, 'listening');
  });

  ipcMain.on('pet:dragged', (_, { x, y }) => {
    if (!petWindow || petWindow.isDestroyed()) return;
    petWindow.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on('pet:drag-ended', () => {
    petIsDragging = false;
    sendPetState(petWindow, 'idle');
  });

  ipcMain.on('task:abort', () => {
    if (activeTask) activeTask.abort();
  });

  ipcMain.on('panel:close', () => {
    panelWindow.hide();
    sendPetState(petWindow, 'idle');
  });

  ipcMain.on('task:run', async (_, { type, input, regenerate }) => {
    setBusy(true);                 // keep ambient expressions out of the way
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

      // One in-flight task at a time; a new run cancels the previous one.
      if (activeTask) activeTask.abort();
      activeTask = new AbortController();

      const result = await runAITask({
        type,
        input,
        screenshotBase64,
        regenerate,
        signal: activeTask.signal,
        onChunk: (text) => {
          if (panelWindow && !panelWindow.isDestroyed()) {
            panelWindow.webContents.send('task:chunk', { text });
          }
        }
      });
      activeTask = null;
      setBusy(false);
      if (result.ok) lastOutput = result.output;

      // Every tenth completed task earns a little celebration.
      let celebrated = false;
      if (result.ok) {
        const count = (readConfig().taskCount || 0) + 1;
        writeConfig({ taskCount: count });
        celebrated = celebrateIfMilestone(petWindow, count);
      }

      if (!celebrated) {
        sendPetState(petWindow, result.ok ? 'success' : 'confused', 1400);
        petWindow.webContents.send('pet:showBubble', {
          text: result.ok ? 'Done.' : 'Hmm.',
          autoHideMs: 3000
        });
      }
      panelWindow.webContents.send('task:result', {
        type,
        output: result.output,
        ok: result.ok,
        action: result.action || null,
        aborted: Boolean(result.aborted)
      });
    } catch (error) {
      activeTask = null;
      setBusy(false);
      sendPetState(petWindow, 'error', 1400);
      panelWindow.webContents.send('task:result', {
        type,
        output: 'Something went wrong inside BEBO. Try again, and if it keeps happening please report it on GitHub.',
        ok: false,
        action: 'retry'
      });
    }
  });
}

module.exports = { setupIPC };
