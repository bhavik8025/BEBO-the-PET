require('dotenv').config();

const { app, ipcMain, shell } = require('electron');
const { createPetWindow, createPanelWindow, createSetupWindow } = require('./windows');
const { setupIPC } = require('./ipc-router');
const { setupShortcuts } = require('./shortcuts');
const { setupTray } = require('./tray');
const { hasGroqKey, saveGroqKey, getGroqKey } = require('./config');

app.setAppUserModelId('com.bhavik.bebo-the-pet');

let petWindow, panelWindow, setupWindow;

// ── Validate a Groq key by making a minimal API call ──────────────────────────
async function validateGroqKey(key) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
        stream: false,
      }),
    });
    if (res.status === 401) return { ok: false, error: 'Invalid API key — authentication failed.' };
    if (res.status === 429) return { ok: true }; // rate limit means key IS valid
    if (!res.ok) return { ok: false, error: `Groq returned error ${res.status}. Try again.` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: 'Could not reach Groq. Check your internet connection.' };
  }
}

// ── Launch main BEBO app ───────────────────────────────────────────────────────
function launchBEBO() {
  if (setupWindow && !setupWindow.isDestroyed()) setupWindow.close();

  petWindow   = createPetWindow();
  panelWindow = createPanelWindow();

  setupIPC({ petWindow, panelWindow });
  setupShortcuts({ petWindow, panelWindow });
  setupTray({ petWindow, panelWindow });
}

// ── Setup window IPC ──────────────────────────────────────────────────────────
ipcMain.handle('setup:validate-key', async (_, key) => {
  return await validateGroqKey(key);
});

ipcMain.handle('setup:save-key', async (_, key) => {
  saveGroqKey(key);
  // Small delay so user sees the success message
  setTimeout(() => launchBEBO(), 800);
  return { ok: true };
});

ipcMain.on('setup:open-groq', () => {
  shell.openExternal('https://console.groq.com/keys');
});

// ── App entry point ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  if (hasGroqKey()) {
    // Key already set — go straight to BEBO
    process.env.GROQ_API_KEY = getGroqKey();
    launchBEBO();
  } else {
    // No key — show first-run setup
    setupWindow = createSetupWindow();
  }
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
