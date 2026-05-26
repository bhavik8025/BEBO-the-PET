/**
 * config.js — Persistent config manager for BEBO the PET
 * Reads/writes API key from %APPDATA%/bebo-the-pet/config.json
 * Falls back to .env for local development
 */

const { app } = require('electron');
const path = require('path');
const fs   = require('fs');

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
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
    const p = getConfigPath();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const existing = readConfig();
    fs.writeFileSync(p, JSON.stringify({ ...existing, ...data }, null, 2), 'utf-8');
    return true;
  } catch (_) {
    return false;
  }
}

function getGroqKey() {
  // 1. Persisted config (production / after first-run setup)
  const cfg = readConfig();
  if (cfg.GROQ_API_KEY) return cfg.GROQ_API_KEY;
  // 2. .env fallback (development)
  return process.env.GROQ_API_KEY || null;
}

function hasGroqKey() {
  return Boolean(getGroqKey());
}

function saveGroqKey(key) {
  // Also set in process.env so ai-service picks it up immediately
  process.env.GROQ_API_KEY = key;
  return writeConfig({ GROQ_API_KEY: key });
}

module.exports = { readConfig, writeConfig, getGroqKey, hasGroqKey, saveGroqKey };
