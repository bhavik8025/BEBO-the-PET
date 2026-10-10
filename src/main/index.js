require('dotenv').config();

const { app, ipcMain, shell } = require('electron');
const { createPetWindow, createPanelWindow, createSetupWindow } = require('./windows');
const { setupIPC } = require('./ipc-router');
const { setupShortcuts, updateHotkeys, getHotkeys, DEFAULT_HOTKEYS } = require('./shortcuts');
const { setupTray } = require('./tray');
const { hasGroqKey, saveGroqKey, getGroqKey, readConfig, writeConfig } = require('./config');
const { GROQ_MODELS } = require('./ai-service');
const { checkForUpdates } = require('./update-checker');
const { sendDailyPing, isTelemetryEnabled, setTelemetryEnabled } = require('./telemetry');
const { startAmbient, PACE } = require('./ambient');

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

  // Check GitHub for a newer release once the windows are up.
  // BUG FIX: this used to run only at launch, but BEBO auto-starts with Windows
  // and often runs for weeks without a restart, so update notices never reached
  // long-running installs. Re-check every 6 hours as well.
  setTimeout(() => checkForUpdates(panelWindow), 4000);
  setInterval(() => checkForUpdates(panelWindow), 6 * 60 * 60 * 1000);

  // Anonymous daily install ping (opt-out in settings) — always fail-silent
  setTimeout(sendDailyPing, 7000);
  setInterval(sendDailyPing, 6 * 60 * 60 * 1000);

  // BEBO's own idle life: occasional stretches, dozing off, waking up
  startAmbient({ petWindow, panelWindow });
}

// ── App info / settings IPC (panel) ───────────────────────────────────────────
const WHATS_NEW_ITEMS = [
  'Grab selected text from any app: select it anywhere, press Ctrl+Shift+E, and BEBO opens with it loaded',
  'Answers now stream in as they are written, with a Stop button',
  'Regenerate re-runs the last action for a genuinely different take',
  'BEBO blinks its eyes about every 10 seconds, so it always looks awake',
  'BEBO now has a life of its own: it stretches, looks around, dozes off when you step away and wakes when you return',
  'Set how lively BEBO is from the gear icon: Lively, Normal, Calm or Off',
  'Change your Groq API key from settings, verified before it saves',
  'Clearer errors with a button that fixes the problem instead of a raw code',
  'The panel can auto-fill from your clipboard when it opens',
  'Rewritten AI prompts: measurably better summaries and far more natural Humanize output'
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
    telemetry: isTelemetryEnabled(),
    autoPaste: cfg.autoPaste !== false,
    expressionPace: Object.prototype.hasOwnProperty.call(PACE, cfg.expressionPace)
      ? cfg.expressionPace
      : 'normal',
    // Only ever expose the last 4 characters, never the key itself
    keyHint: cfg.GROQ_API_KEY ? `…${String(cfg.GROQ_API_KEY).slice(-4)}` : '',
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

ipcMain.handle('app:setTelemetry', (_, on) => setTelemetryEnabled(on));

ipcMain.on('app:setAutoPaste', (_, on) => writeConfig({ autoPaste: Boolean(on) }));

ipcMain.on('app:setExpressionPace', (_, pace) => {
  if (Object.prototype.hasOwnProperty.call(PACE, pace)) {
    writeConfig({ expressionPace: pace });
  }
});

// Change the API key without reinstalling. Previously the key could only ever
// be set on the first-run screen, so an expired or revoked key left the user
// stuck with no way out short of deleting config.json by hand.
ipcMain.handle('app:changeApiKey', async (_, key) => {
  const trimmed = String(key || '').trim();
  if (!trimmed) return { ok: false, error: 'Paste a key first.' };
  const check = await validateGroqKey(trimmed);
  if (!check.ok) return check;
  saveGroqKey(trimmed);
  return { ok: true, keyHint: `…${trimmed.slice(-4)}` };
});

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
