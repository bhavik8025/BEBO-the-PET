require('dotenv').config();

const { app, ipcMain, shell } = require('electron');
const { createPetWindow, createPanelWindow, createSetupWindow } = require('./windows');
const { setupIPC } = require('./ipc-router');
const { setupShortcuts, updateHotkeys, getHotkeys, DEFAULT_HOTKEYS } = require('./shortcuts');
const { setupTray } = require('./tray');
const { hasGroqKey, saveGroqKey, getGroqKey, readConfig, writeConfig } = require('./config');
const { GROQ_MODELS } = require('./ai-service');
const { checkForUpdates } = require('./update-checker');

app.setAppUserModelId('com.bhavik.bebo-the-pet');

// ── Auto-start with Windows (only in packaged/installed mode) ─────────────
if (app.isPackaged) {
  app.setLoginItemSettings({
    openAtLogin: true,
    name: 'BEBO the PET'
  });
}

let petWindow, panelWindow, setupWindow;

// ── Validate a Groq key by making a minimal API call ──────────────────────────
async function validateGroqKey(key) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'authorization': `Bearer ${key}` },
      body: JSON.stringify({
        model: GROQ_MODELS[0], // key check uses BEBO's primary model
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

  // Apply saved theme to the panel window background (avoids flash on open)
  if (readConfig().theme === 'light') {
    panelWindow.setBackgroundColor('#f6f5fb');
  }

  // Check GitHub for a newer release once the windows are up
  setTimeout(() => checkForUpdates(panelWindow), 4000);
}

// ── App info / settings IPC (panel) ───────────────────────────────────────────
const WHATS_NEW_ITEMS = [
  'New AI brain: GPT-OSS 120B via Groq — the old Llama model retires on Aug 16, 2026',
  'Automatic backup model (GPT-OSS 20B) if the primary is busy',
  'Every action button now has its own color',
  'Dark / Light theme toggle — sun icon in the header',
  'Remap all keyboard shortcuts from the gear icon',
  'Hide BEBO moved to Ctrl+Shift+B — so Win+H stays free for voice typing',
  'Voice input: click the Input box, press Win+H, and speak',
  'BEBO now wakes on the monitor you are working on',
  'BEBO alerts you here when a new version is released'
];

function prettyModelName(modelId) {
  const match = /gpt-oss-(\d+)b/i.exec(modelId || '');
  return match ? `GPT-OSS ${match[1]}B` : (modelId || 'Groq model');
}

ipcMain.handle('app:getInfo', () => {
  const cfg = readConfig();
  const version = app.getVersion();
  return {
    version,
    modelLabel: prettyModelName(GROQ_MODELS[0]),
    theme: cfg.theme === 'light' ? 'light' : 'dark',
    hotkeys: getHotkeys(),
    defaults: DEFAULT_HOTKEYS,
    whatsNew: {
      show: cfg.lastSeenVersion !== version,
      title: `What's new in BEBO ${version}`,
      items: WHATS_NEW_ITEMS
    }
  };
});

ipcMain.on('app:setTheme', (_, theme) => {
  const safeTheme = theme === 'light' ? 'light' : 'dark';
  writeConfig({ theme: safeTheme });
  if (panelWindow && !panelWindow.isDestroyed()) {
    panelWindow.setBackgroundColor(safeTheme === 'light' ? '#f6f5fb' : '#12131f');
  }
});

ipcMain.handle('app:saveHotkeys', (_, hotkeys) => updateHotkeys(hotkeys));

ipcMain.on('app:whatsNewSeen', () => {
  writeConfig({ lastSeenVersion: app.getVersion() });
});

ipcMain.on('app:openReleases', () => {
  shell.openExternal('https://github.com/bhavik8025/BEBO-the-PET/releases/latest');
});

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
