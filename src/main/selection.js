/**
 * selection.js — grab whatever text is selected in whatever app has focus.
 *
 * Windows gives no portable way to read another app's selection directly, so
 * the standard trick is to synthesise Ctrl+C and read the clipboard. Doing that
 * safely needs care:
 *
 *   - BEBO must not take focus first, or it copies from itself. The pet window
 *     is focusable:false and the panel is only shown AFTER the copy.
 *   - A plain before/after comparison cannot tell "copy produced nothing" from
 *     "the selection happened to equal the clipboard", so the clipboard is
 *     cleared first and the result treated as the selection only if something
 *     actually landed.
 *   - The user's clipboard is always put back. Losing someone's clipboard to a
 *     background utility would be unforgivable.
 *
 * Keystrokes avoid native modules (robotjs / nut-js) on purpose: they need
 * per-Electron-version native builds, which is real fragility for a
 * solo-maintained app that also builds in CI.
 *
 * Two script hosts, measured on this machine:
 *   wscript + VBS   ~45ms  (after the host warms up)
 *   powershell     ~317ms
 * wscript is used first because 45ms feels instant and 300ms+ feels laggy, but
 * VBScript is deprecated in Windows 11 and can be removed from the OS, so
 * PowerShell stays as a fallback that always works.
 */

const { app, clipboard } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_CHARS = 8000;
const COPY_SETTLE_MS = 180;

let vbsPath = null;
let vbsBroken = false;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Written to disk rather than generated inline each time: a stable, auditable
// one-line file is far less likely to trip antivirus heuristics.
function ensureVbs() {
  if (vbsPath && fs.existsSync(vbsPath)) return vbsPath;
  try {
    const p = path.join(app.getPath('userData'), 'send-copy.vbs');
    fs.writeFileSync(p, 'CreateObject("WScript.Shell").SendKeys "^c"', 'utf8');
    vbsPath = p;
    return p;
  } catch (_) {
    return null;
  }
}

function run(cmd, args, timeoutMs) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => { if (!settled) { settled = true; resolve(ok); } };
    try {
      const child = spawn(cmd, args, { windowsHide: true });
      child.on('close', (code) => finish(code === 0));
      child.on('error', () => finish(false));
    } catch (_) {
      finish(false);
    }
    setTimeout(() => finish(false), timeoutMs); // never hang the hotkey
  });
}

// Synthesise Ctrl+C into whichever window currently has focus.
async function sendCopyKeystroke() {
  if (!vbsBroken) {
    const p = ensureVbs();
    if (p && await run('wscript', ['//nologo', p], 2500)) return;
    // VBScript missing or disabled on this machine: stop trying it.
    vbsBroken = true;
  }
  await run('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^c')"
  ], 3000);
}

/**
 * @returns {Promise<{ text: string, reason?: string }>}
 *          text is '' when nothing could be captured.
 */
async function captureSelection() {
  let original = '';
  try { original = clipboard.readText() || ''; } catch (_) {}

  let captured = '';
  try {
    clipboard.clear();
    await sendCopyKeystroke();
    await wait(COPY_SETTLE_MS);
    captured = (clipboard.readText() || '').trim();
  } catch (_) {
    captured = '';
  } finally {
    // Always hand the clipboard back exactly as we found it.
    try {
      if (original) clipboard.writeText(original);
      else if (!captured) clipboard.clear();
    } catch (_) {}
  }

  if (!captured) {
    // Either nothing was selected, or the focused app refused synthetic input
    // (anything running as Administrator blocks it when BEBO is not elevated).
    return { text: '', reason: 'empty' };
  }
  if (captured.length > MAX_CHARS) {
    return { text: captured.slice(0, MAX_CHARS), reason: 'truncated' };
  }
  return { text: captured };
}

module.exports = { captureSelection, MAX_CHARS };
