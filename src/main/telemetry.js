/**
 * telemetry.js — Anonymous daily install ping (opt-out in panel settings).
 *
 * What it sends, at most once per day:
 *   - the app version (in the path, e.g. /app/v2.0.1)
 *   - a random install id prefix (8 chars) so installs behind one network
 *     still count separately — generated locally, linked to nothing
 * What it NEVER sends: user text, prompts, results, names, emails, keys.
 *
 * Endpoint is the same free GoatCounter account that counts website visits,
 * so downloads + site visits + active installs live on one dashboard.
 * Every failure is swallowed — telemetry must never disturb the app.
 */

const { app } = require('electron');
const crypto = require('crypto');
const { readConfig, writeConfig } = require('./config');

const PING_BASE = 'https://bebothepet.goatcounter.com/count';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isTelemetryEnabled() {
  // Default ON; explicit false means the user opted out
  return readConfig().telemetryEnabled !== false;
}

function setTelemetryEnabled(on) {
  writeConfig({ telemetryEnabled: Boolean(on) });
  return isTelemetryEnabled();
}

function ensureInstallId() {
  const cfg = readConfig();
  if (cfg.installId) return cfg.installId;
  const id = crypto.randomUUID();
  writeConfig({ installId: id });
  return id;
}

async function sendDailyPing() {
  try {
    if (!isTelemetryEnabled()) return;
    if (readConfig().lastPingDate === todayStr()) return; // max one ping per day

    const version = app.getVersion();
    const idTag = ensureInstallId().slice(0, 8);
    const url = `${PING_BASE}?p=${encodeURIComponent('/app/v' + version)}` +
                `&t=${encodeURIComponent('BEBO app ping')}` +
                `&r=${encodeURIComponent('install://' + idTag)}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        // Browser-like UA so the analytics endpoint doesn't drop the hit as a bot
        'user-agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) BEBO-the-PET/${version}`
      }
    });
    if (res.ok) writeConfig({ lastPingDate: todayStr() });
  } catch (_) {
    /* offline or endpoint missing — silently try again another day */
  }
}

module.exports = { sendDailyPing, isTelemetryEnabled, setTelemetryEnabled };
