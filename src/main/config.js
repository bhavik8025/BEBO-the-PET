/**
 * config.js — Persistent config manager for BEBO the PET
 * Always saves to: %APPDATA%\BEBO-the-PET\config.json
 * Fixed folder name so dev mode and installed mode use the same file.
 */

const { app } = require('electron');
const path = require('path');
const fs   = require('fs');

// Always use a fixed folder name — never changes between dev and production
function getConfigDir() {
  return path.join(app.getPath('appData'), 'BEBO-the-PET');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

function readConfig() {
  try {
    const p = getConfigPath();
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  } catch (_) {}
  return {};
}

function writeConfig(data) {
  try {
    const dir = getConfigDir();
    const p   = getConfigPath();

    // Create folder if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const existing = readConfig();
    const merged   = { ...existing, ...data };
    fs.writeFileSync(p, JSON.stringify(merged, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // Surface the error so we can debug if it ever fails again
    console.error('[BEBO config] Failed to write config:', err.message);
    return false;
  }
}

function getGroqKey() {
  // 1. Persisted config (production / after first-run setup)
  const cfg = readConfig();
  if (cfg.GROQ_API_KEY) return cfg.GROQ_API_KEY;
  // 2. .env fallback (development only)
  return process.env.GROQ_API_KEY || null;
}

function hasGroqKey() {
  return Boolean(getGroqKey());
}

function saveGroqKey(key) {
  process.env.GROQ_API_KEY = key;
  return writeConfig({ GROQ_API_KEY: key });
}

module.exports = { readConfig, writeConfig, getGroqKey, hasGroqKey, saveGroqKey };
