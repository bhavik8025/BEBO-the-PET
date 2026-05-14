# Desktop AI Pet Assistant — Full Production Plan

> A living, animated, emotionally expressive desktop companion for Windows that helps you with real work tasks.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Feature Breakdown](#2-feature-breakdown)
3. [Pet Behavior Model](#3-pet-behavior-model)
4. [Emotion and State Machine](#4-emotion-and-state-machine)
5. [Pet Asset and Manifest Design](#5-pet-asset-and-manifest-design)
6. [Full Architecture](#6-full-architecture)
7. [Folder Structure](#7-folder-structure)
8. [Data Model](#8-data-model)
9. [IPC and Event Design](#9-ipc-and-event-design)
10. [Prompt Templates for Tasks](#10-prompt-templates-for-tasks)
11. [Animation System Design](#11-animation-system-design)
12. [UI Component Plan](#12-ui-component-plan)
13. [Build Roadmap](#13-build-roadmap)
14. [Full MVP Starter Code](#14-full-mvp-starter-code)
15. [How to Run](#15-how-to-run)
16. [Phase 2 Expansion Plan](#16-phase-2-expansion-plan)

---

## 1. Product Vision

### What This Is

A **desktop pet assistant** — not a chatbot, not a widget, not a sidebar tool. A living, animated on-screen companion that sits on top of your desktop at all times, reacts to what you're doing, helps you complete real work tasks, and feels genuinely alive.

### Core Philosophy

- Always visible, never intrusive
- Emotionally expressive, not just functional
- Ambient feedback without forcing full-app context switches
- Useful for real work: writing, emails, summaries, screen understanding
- Feels like a companion you'd miss if it were gone

### Inspired By

The **Codex Pet** model — floating animated overlay, pet package architecture, multiple emotional states, ambient feedback, expandable panel. Combined with the productivity depth of a real AI assistant.

### Target User

Someone who works on a Windows PC all day — writing emails, reviewing documents, researching, taking notes — and wants lightweight, always-available AI help without switching to a browser tab or full app every time.

### What Makes This Different

| Normal AI Tool | This Pet Assistant |
|---|---|
| You open it when you need it | It's always there |
| Static interface | Animated, emotional, alive |
| You go to it | It reacts to you |
| Full app context switch | Ambient, lightweight overlay |
| One interaction mode | Multiple: hover, click, drag, shortcut |

---

## 2. Feature Breakdown

### 2.1 Core Pet Features (MVP)

- Animated floating pet overlay — always on top of all windows
- Transparent, frameless Electron window
- Always-on-top rendering, no taskbar entry
- Draggable pet — reposition anywhere on screen
- Click-through idle mode — mouse passes through pet when idle
- Speech bubble for output and status messages
- Right-click context menu on pet
- System tray integration with quick actions
- Global keyboard shortcuts

### 2.2 Emotional State System (MVP)

- 13 defined emotional states (see Section 4)
- State machine with priority-based transitions
- CSS animation per state (Phase 1) → sprite-based animation (Phase 2)
- Mood engine that changes state based on user activity, task status, idle time
- Auto-sleep after configurable inactivity timeout
- Wake animation on click or keyboard shortcut

### 2.3 Task System (MVP — 6 actions)

| Action | Input Source | Output |
|---|---|---|
| Summarize | Clipboard or typed text | 3–4 bullet summary |
| Rephrase | Clipboard or typed text | Reworded version |
| Humanize | Clipboard or typed text | Natural-sounding rewrite |
| Draft Email | Typed context | Ready-to-send email draft |
| Explain Screen | Screenshot + OCR | Plain-language screen summary |
| Extract Tasks | Clipboard or typed text | Checklist of action items |

### 2.4 Context Capture (MVP)

- Read from clipboard automatically
- Manual screenshot capture (user-triggered only)
- OCR using Tesseract.js for screen text extraction
- Active window title detection (optional)
- Privacy: no silent background capturing — always manual trigger

### 2.5 Memory and History (MVP)

- Last 50 task outputs stored in SQLite
- Timestamp, task type, input source, output text
- History viewable in expanded panel
- One-click copy from history
- Pinned outputs (favorite results)

### 2.6 Settings (MVP)

- Claude API key input (stored locally, never sent anywhere else)
- Idle timeout configuration
- Click-through mode toggle
- Privacy: app blocklist (pet ignores context from listed apps)
- Keyboard shortcut configuration
- Pet scale/position reset
- Dark/light panel theme

### 2.7 Phase 2 Features (Planned — Not MVP)

- Real spritesheet atlas rendering on HTML5 Canvas
- Multiple pet characters (downloadable pet packs)
- Voice interaction (Web Speech API)
- Sound effects per state (opt-in)
- Proactive reminders and calendar awareness
- Gmail/Outlook integration
- Local model support (Ollama)
- Persistent long-term memory
- App-aware context detection
- Richer desktop automation

---

## 3. Pet Behavior Model

### 3.1 Behavioral Principles

The pet must feel alive at all times. This means:

1. **It never sits completely still.** Even in idle state, there are micro-movements — a subtle bounce, a blink, a small sway.
2. **It reacts to everything.** Hover, click, drag, task completion, errors — each triggers a different visual response.
3. **It has opinions about time.** If you ignore it for 3 minutes, it gets sleepy. If you hover over it, it gets curious. If you complete many tasks, it gets energetic.
4. **It communicates without words first.** The animation expresses the state before any text bubble appears.
5. **It respects your focus.** In click-through idle mode, it's visually present but not interactive — ambient, not demanding.

### 3.2 Behavior Rules

#### Idle Behavior
- Plays the idle animation loop continuously
- Small random micro-movements every 8–15 seconds (tiny position shift, blink, bounce)
- After `idleTimeoutMs` (default: 3 minutes) with no user interaction → transitions to `sleeping`
- If click-through mode is enabled → mouse events are forwarded to windows below

#### Hover Behavior
- On mouse enter → immediately transitions to `curious` or `happy` state
- Speech bubble may appear with a random friendly line
- On mouse leave → returns to previous state after 2 seconds

#### Click Behavior
- Single click → opens quick action panel (if closed) OR triggers happy reaction
- Double click → opens full expanded panel
- Right click → context menu (Summarize Clipboard, Settings, Hide, etc.)
- Middle click (optional) → Explain Screen shortcut

#### Drag Behavior
- On drag start → transitions to `listening` state, slight "picked up" scale-up animation
- While dragging → slight rotation tilt effect to indicate movement
- On drag end → bounces back to idle with a small landing animation
- Position saved to settings on drag end

#### Task Running Behavior
- Immediately transitions to `thinking` state when a task starts
- Speech bubble shows "Working on it..." or similar
- Thinking animation plays until result returns
- On success → transitions to `success` state, speech bubble shows output preview
- On failure → transitions to `error` state, speech bubble shows error message
- After 4 seconds → returns to `idle` or `review-ready` if output is waiting

#### Attention Behavior
- If task output is ready and panel is not open → plays a subtle "nudge" animation
- A small notification dot appears near the pet
- Does not force-open anything — respects user focus

#### Sleep Behavior
- After idle timeout → smooth transition to sleeping animation
- Breathing-like slow pulse animation
- ZZZ particle or subtle indicator (optional)
- On any click or keyboard shortcut → plays wake animation, returns to idle

---

## 4. Emotion and State Machine

### 4.1 State Definitions

| State | Trigger | Animation Style | Bubble Style |
|---|---|---|---|
| `idle` | Default, post-task cooldown | Gentle bounce loop, blinks | None |
| `happy` | Hover, click, task success | Bouncy jump, wide expression | Light green tint |
| `excited` | Multiple tasks done, high activity | Fast bouncing, particle burst | Bright yellow |
| `thinking` | Task running | Pulsing glow, looking up | Grey spinner |
| `waiting` | Awaiting input | Slow sway, tilted head | Soft blue |
| `sleepy` | Approaching idle timeout | Slow droop, half-blink | None |
| `sleeping` | Idle timeout reached | Slow breathing pulse | None |
| `listening` | Drag, input mode active | Tilted, ears up | Light blue |
| `confused` | Ambiguous input, no context | Head shake, question mark | Orange tint |
| `error` | API error, task failure | Shake animation | Red tint |
| `success` | Task completed | Jump + sparkle effect | Green tint |
| `review-ready` | Output ready, panel closed | Gentle nudge bounce | Yellow dot |
| `speaking` | Streaming output | Mouth movement cycle | Active bubble |
| `curious` | First hover, new input | Head tilt, eye widening | None |

### 4.2 State Machine Transitions

```text
[any state] --task:run------------------> thinking
thinking ----task:success---------------> success
thinking ----task:error-----------------> error
success -----(4s timeout)---------------> review-ready (if panel closed) or idle
error -------(4s timeout)---------------> idle
idle --------(idleTimeout)--------------> sleepy --(30s)--> sleeping
sleeping ----(click/shortcut)-----------> wake_anim --> idle
idle --------(hover)--------------------> curious or happy
idle --------(drag start)---------------> listening
listening ---(drag end)-----------------> idle
[any state] --(high activity streak)----> excited
```

### 4.3 Priority System

Higher priority states interrupt lower ones. Same-priority states queue.

| Priority Level | States |
|---|---|
| 6 (Highest) | `error`, `success` |
| 5 | `thinking` |
| 4 | `confused`, `listening`, `speaking` |
| 3 | `happy`, `excited`, `curious` |
| 2 | `review-ready`, `waiting` |
| 1 | `sleepy`, `sleeping` |
| 0 (Lowest) | `idle` |

### 4.4 Mood Engine Logic

```js
// Pseudo-code for mood engine
function evaluateMood(context) {
  const { lastInteractionMs, recentTaskCount, lastTaskStatus, isDragging } = context;

  if (isDragging) return 'listening';
  if (lastTaskStatus === 'running') return 'thinking';
  if (lastTaskStatus === 'success') return 'success';
  if (lastTaskStatus === 'error') return 'error';
  if (lastInteractionMs > idleTimeout) return 'sleeping';
  if (lastInteractionMs > idleTimeout * 0.6) return 'sleepy';
  if (recentTaskCount >= 5) return 'excited';
  return 'idle';
}
```

---

## Reference Note

The complete project plan was provided by the user in chat on 2026-05-11 and saved here for future implementation reference.
