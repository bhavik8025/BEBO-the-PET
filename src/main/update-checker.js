const { app } = require('electron');

const RELEASES_API = 'https://api.github.com/repos/bhavik8025/bebo-the-pet/releases/latest';

function parseVersion(tag) {
  return String(tag || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
}

function isNewer(remote, local) {
  for (let i = 0; i < 3; i++) {
    const r = remote[i] || 0;
    const l = local[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

async function checkForUpdates(panelWindow) {
  try {
    const res = await fetch(RELEASES_API, {
      headers: {
        'user-agent': 'BEBO-the-PET',
        'accept': 'application/vnd.github+json'
      }
    });
    if (!res.ok) return;

    const data = await res.json();
    const remote = parseVersion(data.tag_name);
    const local = parseVersion(app.getVersion());

    if (isNewer(remote, local) && panelWindow && !panelWindow.isDestroyed()) {
      panelWindow.webContents.send('app:updateAvailable', {
        version: String(data.tag_name || '').replace(/^v/i, '')
      });
    }
  } catch (_) {
    // Offline or rate-limited — stay silent, check again next launch
  }
}

module.exports = { checkForUpdates };
