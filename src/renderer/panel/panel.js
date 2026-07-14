const closeButton = document.getElementById('close-button');
const copyButton = document.getElementById('copy-button');
const themeButton = document.getElementById('theme-button');
const settingsButton = document.getElementById('settings-button');
const output = document.getElementById('task-output');
const input = document.getElementById('task-input');
const modelLabel = document.getElementById('model-label');
const versionLabel = document.getElementById('version-label');
const updateBanner = document.getElementById('update-banner');
const updateText = document.getElementById('update-text');
const updateButton = document.getElementById('update-button');
const settingsOverlay = document.getElementById('settings-overlay');
const settingsClose = document.getElementById('settings-close');
const hotkeyError = document.getElementById('hotkey-error');
const hotkeysSave = document.getElementById('hotkeys-save');
const hotkeysReset = document.getElementById('hotkeys-reset');
const whatsnewOverlay = document.getElementById('whatsnew-overlay');
const whatsnewTitle = document.getElementById('whatsnew-title');
const whatsnewList = document.getElementById('whatsnew-list');
const whatsnewOk = document.getElementById('whatsnew-ok');
const hotkeyButtons = Array.from(document.querySelectorAll('.hotkey-btn'));

let appHotkeys = {};
let defaultHotkeys = {};
let pendingHotkeys = {};
let recordingButton = null;

/* ── Tasks ─────────────────────────────────────────────────────── */
closeButton.addEventListener('click', () => {
  window.panelAPI.close();
});

document.querySelectorAll('[data-task]').forEach((button) => {
  button.addEventListener('click', () => {
    const task = button.dataset.task;
    output.textContent = `Running ${task.replaceAll('_', ' ')}...`;
    window.panelAPI.runTask({
      type: task,
      input: input.value
    });
  });
});

copyButton.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.textContent);
  copyButton.textContent = 'Copied';
  window.setTimeout(() => {
    copyButton.textContent = 'Copy';
  }, 1200);
});

window.panelAPI.onTaskResult(({ output: result }) => {
  output.textContent = result;
});

/* ── Theme ─────────────────────────────────────────────────────── */
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  themeButton.textContent = theme === 'dark' ? '☀' : '☾';
  themeButton.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
}

themeButton.addEventListener('click', () => {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  window.panelAPI.setTheme(next);
});

/* ── Hotkey remapping ──────────────────────────────────────────── */
function prettyCombo(accelerator) {
  return (accelerator || '').replaceAll('CommandOrControl', 'Ctrl');
}

function renderHotkeys() {
  hotkeyButtons.forEach((btn) => {
    btn.textContent = prettyCombo(pendingHotkeys[btn.dataset.action]);
    btn.classList.remove('recording');
  });
}

function stopRecording() {
  recordingButton = null;
  renderHotkeys();
}

// Turn a keydown event into an Electron accelerator like "CommandOrControl+Shift+B"
function acceleratorFromEvent(e) {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return null;

  const mods = [];
  if (e.ctrlKey) mods.push('CommandOrControl');
  if (e.altKey) mods.push('Alt');
  if (e.shiftKey) mods.push('Shift');
  if (mods.length === 0) return null;

  let main = null;
  if (/^[a-z]$/i.test(e.key)) main = e.key.toUpperCase();
  else if (/^[0-9]$/.test(e.key)) main = e.key;
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(e.key)) main = e.key;
  else if (e.key === ' ') main = 'Space';
  else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) main = e.key.replace('Arrow', '');
  else if (['Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete', 'Backspace', 'Tab'].includes(e.key)) main = e.key;

  if (!main) return null;
  return mods.concat(main).join('+');
}

hotkeyButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    stopRecording();
    recordingButton = btn;
    hotkeyError.hidden = true;
    btn.textContent = 'Press keys…';
    btn.classList.add('recording');
  });
});

window.addEventListener('keydown', (e) => {
  if (!recordingButton) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.key === 'Escape') {
    stopRecording();
    return;
  }
  const accelerator = acceleratorFromEvent(e);
  if (!accelerator) return; // keep listening until a valid combo arrives
  pendingHotkeys[recordingButton.dataset.action] = accelerator;
  stopRecording();
}, true);

settingsButton.addEventListener('click', () => {
  pendingHotkeys = { ...appHotkeys };
  hotkeyError.hidden = true;
  renderHotkeys();
  settingsOverlay.hidden = false;
});

settingsClose.addEventListener('click', () => {
  stopRecording();
  settingsOverlay.hidden = true;
});

hotkeysReset.addEventListener('click', () => {
  pendingHotkeys = { ...defaultHotkeys };
  renderHotkeys();
});

hotkeysSave.addEventListener('click', async () => {
  const result = await window.panelAPI.saveHotkeys(pendingHotkeys);
  if (result && result.ok) {
    appHotkeys = { ...result.hotkeys };
    settingsOverlay.hidden = true;
    return;
  }
  hotkeyError.textContent = result && result.reason === 'duplicate'
    ? 'Two actions have the same shortcut — make them different.'
    : 'That combo is already taken by another app. Try a different one.';
  hotkeyError.hidden = false;
  pendingHotkeys = { ...appHotkeys };
  renderHotkeys();
});

/* ── Update banner ─────────────────────────────────────────────── */
window.panelAPI.onUpdateAvailable(({ version }) => {
  updateText.textContent = `BEBO v${version} is available.`;
  updateBanner.hidden = false;
});

updateButton.addEventListener('click', () => {
  window.panelAPI.openReleases();
});

/* ── What's new ────────────────────────────────────────────────── */
whatsnewOk.addEventListener('click', () => {
  whatsnewOverlay.hidden = true;
  window.panelAPI.whatsNewSeen();
});

/* ── Init ──────────────────────────────────────────────────────── */
(async () => {
  const info = await window.panelAPI.getAppInfo();

  applyTheme(info.theme);
  versionLabel.textContent = `v${info.version}`;
  modelLabel.textContent = `Powered by ${info.modelLabel} · Groq`;
  appHotkeys = { ...info.hotkeys };
  defaultHotkeys = { ...info.defaults };

  if (info.whatsNew && info.whatsNew.show) {
    whatsnewTitle.textContent = info.whatsNew.title;
    whatsnewList.innerHTML = '';
    info.whatsNew.items.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      whatsnewList.appendChild(li);
    });
    whatsnewOverlay.hidden = false;
  }
})();
