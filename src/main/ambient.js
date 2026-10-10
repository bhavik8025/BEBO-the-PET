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

// Blinking is the one expression that has to feel constant rather than
// occasional. On the weighted schedule below it landed roughly once every
// 10 minutes, which reads as a sprite that happened to twitch — not a
// creature. So it runs on its own fast timer, independent of the pace gaps.
// Kept at ~10s on every pace (except Off): it is the subtlest motion BEBO has,
// so it never competes with the bigger expressions for attention.
const BLINK_EVERY = { min: 8600, max: 11400 };   // ~10s, jittered either side
const BLINK_MS = 1060;                           // botEyelid runs 1s; +60ms so
                                                 // the lift is not cut short

// Weighted so most activity is almost subliminal and the big stuff is a treat.
// `ms` must exceed the CSS animation length or the pet snaps back to idle
// mid-movement: sway runs 7.2s and dance 4.2s, so a flat cutoff truncated them.
// `rest` is a deliberate no-op holding the slot blink used to occupy, so moving
// blink to its own timer did not silently make every other expression ~1.5x
// more frequent.
const REPERTOIRE = [
  { state: null,         weight: 34, ms: 0 },     // rest — BEBO just sits there
  { state: 'sway',       weight: 22, ms: 7400 },  // botSway 3.6s x2
  { state: 'lookAround', weight: 16, ms: 3000 },   // botLook 2.8s
  { state: 'stretch',    weight: 11, ms: 1700 },   // botStretch 1.5s
  { state: 'wave',       weight: 7,  ms: 1450 },   // botWave 1.25s
  { state: 'jump',       weight: 6,  ms: 1180 },   // botJump 980ms
  { state: 'dance',      weight: 4,  ms: 4400 },   // botDance 2.1s x2
  { state: 'yawn',       weight: 0,  ms: 2000 }    // night only, see pickExpression
];

const SLEEP_AFTER_SEC = 10 * 60;   // system idle before BEBO dozes off
const IDLE_POLL_MS = 15000;

// Each self-rescheduling chain keeps a single handle rather than being pushed
// onto a growing list. BEBO auto-starts with Windows and runs for weeks without
// a restart, so with blinking every 10s an append-only list of timer handles
// would retain tens of thousands of dead Timeout objects.
let blinkTimer = null;
let paceTimer = null;
let asleep = false;
let busy = false;                  // an AI task is running
let expressionUntil = 0;           // ms timestamp; a motion is still playing

function pickExpression(hour) {
  // Time of day nudges the mood: a stretch in the morning, a yawn late at night.
  const night = hour >= 23 || hour < 5;
  const morning = hour >= 5 && hour < 10;

  const pool = REPERTOIRE.map((item) => {
    let weight = item.weight;
    if (morning && item.state === 'stretch') weight *= 3;
    if (night && (item.state === 'dance' || item.state === 'jump')) weight = 0;
    if (item.state === 'yawn') weight = night ? 18 : 0;   // sleepy only at night
    return { state: item.state, weight, ms: item.ms };
  }).filter((i) => i.weight > 0);

  const total = pool.reduce((sum, i) => sum + i.weight, 0);
  let roll = Math.random() * total;
  for (const item of pool) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return REPERTOIRE[0];
}

function currentPace() {
  const key = readConfig().expressionPace || 'normal';
  return Object.prototype.hasOwnProperty.call(PACE, key) ? PACE[key] : PACE.normal;
}

function clearTimers() {
  clearTimeout(blinkTimer);
  clearTimeout(paceTimer);
  blinkTimer = paceTimer = null;
}

function startAmbient({ petWindow, panelWindow }) {
  const alive = () => petWindow && !petWindow.isDestroyed();

  const play = (state, durationMs) => {
    if (!alive()) return;
    // Remember when this motion ends so the 10s blink never cuts a sway or a
    // dance in half. `sleeping` has no duration and holds until woken, which
    // the `asleep` flag already guards.
    expressionUntil = durationMs ? Date.now() + durationMs : 0;
    petWindow.webContents.send('pet:setState', { state, durationMs });
  };

  // Shared gate: BEBO stays still while the user is actually working with it.
  const canMove = () => {
    const panelInUse = panelWindow && !panelWindow.isDestroyed() && panelWindow.isVisible();
    const hidden = !alive() || !petWindow.isVisible();
    return !busy && !asleep && !panelInUse && !hidden;
  };

  // ── Blinking, on its own clock ───────────────────────────────────────────
  const scheduleBlink = () => {
    const gap = BLINK_EVERY.min + Math.random() * (BLINK_EVERY.max - BLINK_EVERY.min);
    blinkTimer = setTimeout(() => {
      // Skip rather than queue: a blink owed from 9s ago is not worth playing,
      // and overriding a longer motion mid-animation looks like a glitch.
      if (currentPace() && canMove() && Date.now() >= expressionUntil) {
        play('blink', BLINK_MS);
      }
      scheduleBlink();
    }, gap);
  };

  // ── Unprompted expressions ──────────────────────────────────────────────
  const scheduleNext = () => {
    const pace = currentPace();
    if (!pace) {                                 // switched off
      paceTimer = setTimeout(scheduleNext, 60000);  // re-check if re-enabled
      return;
    }
    const gap = pace.min + Math.random() * (pace.max - pace.min);
    paceTimer = setTimeout(() => {
      if (canMove()) {
        const pick = pickExpression(new Date().getHours());
        // pick.state is null on a `rest` slot — BEBO deliberately does nothing.
        if (pick.state) play(pick.state, pick.ms);   // per-expression, so nothing truncates
      }
      scheduleNext();
    }, gap);
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
  scheduleBlink();
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
  expressionUntil = Date.now() + 1500;    // keep the blink timer off the celebration
  petWindow.webContents.send('pet:setState', { state: 'celebrate', durationMs: 1500 });
  petWindow.webContents.send('pet:showBubble', {
    text: `${count} tasks!`,
    autoHideMs: 2800
  });
  return true;
}

module.exports = { startAmbient, setBusy, celebrateIfMilestone, PACE };
