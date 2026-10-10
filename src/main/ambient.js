/**
 * ambient.js — gives BEBO a life of its own.
 *
 * BEBO sits on screen all day. Without this it only ever reacts when poked,
 * which makes it an icon rather than a pet. This schedules small unprompted
 * expressions: a blink, a stretch, dozing off when you leave, waking when you
 * come back.
 *
 * The hard requirement is that it must never become annoying, so:
 *   - gaps are long and randomised, never metronomic
 *   - big movements are rare; most ticks are barely-noticeable micro-moves
 *   - nothing plays while a task is running or while the panel is in use
 *   - the user can set the pace, or switch it off entirely
 */

const { powerMonitor } = require('electron');
const { readConfig } = require('./config');

// Gap between ambient expressions, in ms. Randomised within the range so the
// timing never feels like a metronome.
const PACE = {
  off:    null,
  calm:   { min: 420000, max: 900000 },   //  7-15 min
  normal: { min: 150000, max: 390000 },   // 2.5-6.5 min
  lively: { min: 55000,  max: 150000 }    //   1-2.5 min
};

// Weighted so most activity is almost subliminal and the big stuff is a treat.
const REPERTOIRE = [
  { state: 'blink',      weight: 34, quiet: true },
  { state: 'sway',       weight: 22, quiet: true },
  { state: 'lookAround', weight: 16 },
  { state: 'stretch',    weight: 11 },
  { state: 'wave',       weight: 7 },
  { state: 'jump',       weight: 6 },
  { state: 'dance',      weight: 4 }
];

const SLEEP_AFTER_SEC = 10 * 60;   // system idle before BEBO dozes off
const IDLE_POLL_MS = 15000;

let timers = [];
let asleep = false;
let busy = false;                  // an AI task is running

function pickExpression(hour) {
  // Time of day nudges the mood: a stretch in the morning, a yawn late at night.
  const pool = REPERTOIRE.map((item) => {
    let weight = item.weight;
    if (hour >= 5 && hour < 10 && item.state === 'stretch') weight *= 3;
    if ((hour >= 23 || hour < 5) && item.state === 'dance') weight = 0;
    if ((hour >= 23 || hour < 5) && item.state === 'jump') weight = 0;
    return { state: item.state, weight };
  }).filter((i) => i.weight > 0);

  const total = pool.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item.state;
  }
  return 'blink';
}

function currentPace() {
  const key = readConfig().expressionPace || 'normal';
  return Object.prototype.hasOwnProperty.call(PACE, key) ? PACE[key] : PACE.normal;
}

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

function startAmbient({ petWindow, panelWindow }) {
  const alive = () => petWindow && !petWindow.isDestroyed();

  const play = (state, durationMs) => {
    if (!alive()) return;
    petWindow.webContents.send('pet:setState', { state, durationMs });
  };

  // ── Unprompted expressions ──────────────────────────────────────────────
  const scheduleNext = () => {
    const pace = currentPace();
    if (!pace) {                                   // switched off
      timers.push(setTimeout(scheduleNext, 60000));  // re-check if re-enabled
      return;
    }
    const gap = pace.min + Math.random() * (pace.max - pace.min);
    timers.push(setTimeout(() => {
      const panelInUse = panelWindow && !panelWindow.isDestroyed() && panelWindow.isVisible();
      const hidden = !alive() || !petWindow.isVisible();
      // Stay out of the way while the user is actually working with BEBO.
      if (!busy && !asleep && !panelInUse && !hidden) {
        const state = pickExpression(new Date().getHours());
        play(state, 2600);
      }
      scheduleNext();
    }, gap));
  };

  // ── Dozing off and waking up ────────────────────────────────────────────
  const checkIdle = () => {
    if (!alive()) return;
    let idleSec = 0;
    try { idleSec = powerMonitor.getSystemIdleTime(); } catch (_) { return; }

    if (!asleep && idleSec >= SLEEP_AFTER_SEC && currentPace() && !busy) {
      asleep = true;
      play('sleeping');                     // no duration: holds until woken
    } else if (asleep && idleSec < 5) {
      asleep = false;
      play('wakeUp', 1900);
      if (alive()) {
        petWindow.webContents.send('pet:showBubble', {
          text: 'Morning!',
          autoHideMs: 2200
        });
      }
    }
  };

  clearTimers();
  scheduleNext();
  const idleTimer = setInterval(checkIdle, IDLE_POLL_MS);
  if (alive()) petWindow.on('closed', () => { clearInterval(idleTimer); clearTimers(); });
}

// Called by the task router so nothing animates over a running task.
function setBusy(value) {
  busy = Boolean(value);
  if (busy) asleep = false;      // activity means the user is back
}

// Milestone celebration, fired every Nth completed task.
function celebrateIfMilestone(petWindow, count) {
  if (!count || count % 10 !== 0) return false;
  if (!petWindow || petWindow.isDestroyed()) return false;
  petWindow.webContents.send('pet:setState', { state: 'celebrate', durationMs: 1500 });
  petWindow.webContents.send('pet:showBubble', {
    text: `${count} tasks!`,
    autoHideMs: 2800
  });
  return true;
}

module.exports = { startAmbient, setBusy, celebrateIfMilestone, PACE };
