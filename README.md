# 🤖 BEBO the PET — AI Desktop Companion

[![Downloads](https://img.shields.io/badge/TOTAL%20DOWNLOADS-106%2B-7c5cfc?style=for-the-badge)](https://github.com/bhavik8025/BEBO-the-PET/releases/latest)
[![Latest Release](https://img.shields.io/github/v/release/bhavik8025/BEBO-the-PET?style=for-the-badge&color=22d3ee&label=LATEST)](https://github.com/bhavik8025/BEBO-the-PET/releases/latest)
[![License](https://img.shields.io/badge/LICENSE-MIT-10b981?style=for-the-badge)](https://github.com/bhavik8025/BEBO-the-PET/blob/main/LICENSE)

> A tiny animated AI pet that lives on your Windows desktop. Click it, get superpowers.

**Website:** https://bhavik8025.github.io/BEBO-the-PET/  
**Download:** https://github.com/bhavik8025/BEBO-the-PET/releases/latest

---

## What is BEBO?

BEBO is a **desktop AI productivity assistant** disguised as an adorable animated pet. It lives in the corner of your screen at all times — always on top, always ready. One click opens a sleek assistant panel powered by **GPT-OSS 120B** via the **Groq API**, letting you summarize documents, write emails, fix grammar, simplify complex text, humanize AI-generated content, or ask anything — all without switching windows or opening a browser.

Built entirely with **Electron + Node.js**, BEBO runs natively on Windows with zero browser needed.

---

## Features

### 🐾 Animated Desktop Pet
- Lives permanently on your Windows desktop — always on top, always visible
- Smooth CSS animations — idle float, happy bounce, thinking pulse, excited wiggle, and more
- Fully **draggable** — reposition BEBO anywhere on screen by dragging
- **Click to toggle** the assistant panel open/closed
- Right-click for quick menu (Open Assistant, Wake Pet, Hide Pet, Quit)
- Speech bubble shows live status — "Working...", "Done.", "Looking..."

### 🧠 AI Assistant Panel
- Opens **next to BEBO's current position** — always near the pet wherever you drag it
- **Resizable** — drag panel edges to any size
- **Resets to default size** (380×620) every time it reopens — clean slate every session
- Editable output — modify AI results directly in the output box
- One-click Copy button on all results
- Powered by **GPT-OSS 120B** on Groq — blazing fast inference

### ⚡ 6 AI Functions

| Button | What it does |
|---|---|
| **Summarize** | Condenses any text — articles, reports, emails, notes — into sharp executive-level summaries |
| **Humanize** | Transforms AI-generated or robotic text into warm, natural human writing |
| **Simplify** | Rewrites complex, technical, legal, or academic text in plain everyday language |
| **Draft Email** | Writes a complete professional email from rough notes or a topic |
| **Fix Grammar** | Fixes spelling, grammar, and punctuation — without changing your style or voice |
| **Ask AI** | Free-form prompt — type anything, get an intelligent response |

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + P` | Toggle the assistant panel open/closed |
| `Ctrl + Shift + W` | Wake BEBO — shows a happy animation |
| `Ctrl + Shift + B` | Show/hide the pet |

### 🖥️ System Tray
- BEBO lives in the system tray when running in the background
- Tray menu: Open Assistant / Show Pet / Hide Pet / Quit

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Desktop Framework | **Electron v29** | Runs the app as a native Windows desktop application |
| Runtime | **Node.js** | Powers the main process — IPC, AI calls, window management |
| AI Model | **GPT-OSS 120B** (auto-fallback: GPT-OSS 20B) | The large language model that processes all AI tasks |
| AI Inference | **Groq API** | Hosts and runs GPT-OSS — free tier, ultra-fast inference |
| Frontend | **HTML5 / CSS3 / Vanilla JS** | Renderer process — pet animations and panel UI |
| Config | **dotenv** | Loads API keys from `.env` securely |
| IPC | **Electron IPC** | Bidirectional communication between main and renderer processes |

---

## Architecture

```
BEBO the PET
├── src/
│   ├── main/                          ← Node.js Main Process
│   │   ├── index.js                   ← App entry point — boots everything
│   │   ├── windows.js                 ← Creates pet window + panel window
│   │   ├── ipc-router.js              ← Handles all IPC events (clicks, drag, panel toggle)
│   │   ├── ai-service.js              ← Groq API integration + prompt engine
│   │   ├── shortcuts.js               ← Global keyboard shortcuts
│   │   └── tray.js                    ← System tray setup
│   │
│   └── renderer/                      ← Browser Renderer Process
│       ├── pet/                       ← The animated pet window
│       │   ├── index.html             ← Pet character markup
│       │   ├── pet.css                ← All pet animations (idle, happy, thinking, etc.)
│       │   ├── pet.js                 ← Pet state machine + drag logic
│       │   └── preload.js             ← Secure IPC bridge for pet
│       │
│       └── panel/                     ← The assistant panel window
│           ├── index.html             ← Panel UI — buttons, input, output
│           ├── panel.css              ← Dark theme styling
│           ├── panel.js               ← Button handlers + result rendering
│           └── preload.js             ← Secure IPC bridge for panel
│
├── .env                               ← Your API keys (never commit this)
├── .env.example                       ← Template for setup
├── package.json                       ← Project config and dependencies
├── Start BEBO.bat                     ← One-click launcher
└── Start BEBO Hidden.vbs              ← Silent launcher (no console window)
```

### How It All Connects

```
User clicks BEBO pet
        │
        ▼
pet.js sends IPC → "pet:clicked"
        │
        ▼
ipc-router.js receives event
  → togglePanel() — shows/hides panel
  → positions panel next to pet's current screen position
  → resets panel to default size (380×620)
        │
        ▼
User picks an AI action (e.g. Summarize)
        │
        ▼
panel.js sends IPC → "task:run" with { type, input }
        │
        ▼
ipc-router.js → ai-service.js → Groq API (GPT-OSS 120B)
        │
        ▼
Result returned → stripMarkdown() → clean plain text
        │
        ▼
panel.js renders output in editable output box
BEBO shows speech bubble → "Done." ✓
```

---

## AI Prompt System

Every AI function uses a structured **ROLE → OBJECTIVE → CONTEXT → INSTRUCTIONS** prompt architecture — engineered for maximum output quality from GPT-OSS 120B on Groq.

```
ROLE:         Who the AI is (expert framing sets the quality bar)
OBJECTIVE:    Exactly what the task must accomplish
CONTEXT:      What situation the user is in — what they need and why
INSTRUCTIONS: Precise rules for output format, tone, length, and constraints
```

Each task also has a **tuned temperature** for optimal results:

| Task | Temperature | Reason |
|---|---|---|
| Fix Grammar | 0.05 | Near-deterministic — fix errors, zero creativity |
| Summarize | 0.2 | Faithful and accurate to source |
| Draft Email | 0.25 | Structured and professional |
| Simplify | 0.3 | Clear but naturally flowing |
| Ask AI | 0.5 | Balanced for general queries |
| Humanize | 0.65 | Creative, varied, authentic human voice |

A `stripMarkdown()` safety function runs on every response — strips asterisks, hashes, bullet symbols, backticks — ensuring 100% clean plain text output.

---

## Setup & Installation

### Prerequisites
- Windows 10 or 11
- Node.js v18 or higher → [nodejs.org](https://nodejs.org)
- A free Groq API key → [groq.com](https://groq.com) *(no credit card needed)*

### 1. Clone the repository
```bash
git clone https://github.com/bhavik8025/BEBO-the-PET.git
cd BEBO-the-PET
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure your API key
Create a `.env` file in the root folder:
```
GROQ_API_KEY=your_groq_api_key_here
```
Get your free key at → [console.groq.com/keys](https://console.groq.com/keys)

### 4. Run BEBO
```bash
npm start
```
Or double-click **`Start BEBO.bat`** for a one-click launch.
Use **`Start BEBO Hidden.vbs`** for a silent launch without a console window.

---

## How BEBO Was Built

BEBO was built as a solo project by **Bhavik Thakkar**, a student at Lal Bahadur Shastri Institute of Management. The entire project was conceived, designed, and built using AI-assisted development tools.

### Tools Used in Development

| Tool | Role in Building BEBO |
|---|---|
| **Claude (Anthropic)** | Primary AI coding assistant — architecture design, debugging, feature implementation, prompt engineering |
| **Claude Code** | Agentic coding agent — made direct file edits, refactored code, managed the codebase iteratively in real-time |
| **Groq + GPT-OSS 120B** | The AI brain powering BEBO's productivity features at runtime |
| **Electron** | Desktop framework that made a native Windows app possible using web technologies |
| **Node.js** | Backend runtime for the main process |

### Development Journey

1. **Concept** — Idea of a persistent desktop AI pet that is always visible and one-click accessible
2. **Architecture** — Designed dual-window Electron app (transparent pet window + floating panel window)
3. **Pet Window** — Built animated character with CSS keyframe animations and a state machine (idle, happy, thinking, excited, confused, error, success)
4. **Panel Window** — Built the assistant UI with dark theme, IPC communication, resizable layout
5. **AI Integration** — Started with Google Gemini API, migrated to Groq + Llama 3.3 70B, then to GPT-OSS 120B when Groq retired all Llama models (Aug 2026)
6. **Prompt Engineering** — Iterated on ROLE/OBJECTIVE/CONTEXT/INSTRUCTIONS prompt structure for best output quality
7. **UX Polish** — Added resizable panel, toggle behaviour, dynamic positioning next to pet, editable output, plain text stripping

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key from console.groq.com/keys |
| `GEMINI_API_KEY` | ❌ Optional | Legacy — only if switching back to Gemini |
| `GEMINI_MODEL` | ❌ Optional | Legacy — Gemini model name |

---

## Security

- API keys stored in `.env` — never committed to version control
- `.gitignore` excludes `.env` by default
- Electron `contextIsolation: true` and `nodeIntegration: false` on all renderer windows
- All IPC communication goes through secure preload bridges
- Your text is never stored or logged — all AI requests are fully stateless
- Optional anonymous install counter: one daily ping with the app version and a random id (never your content) — opt out anytime from the panel's ⚙ settings

---

## Roadmap

- [x] Voice input — press Win + H and dictate straight into BEBO (v2.0)
- [ ] Custom AI personas — choose BEBO's personality and name
- [ ] Conversation history — scroll through past AI interactions
- [x] Multi-monitor support — BEBO wakes on your active monitor (v2.0)
- [ ] Plugin system — add your own custom AI functions
- [ ] macOS port
- [ ] Auto-start on Windows login
- [x] Dark/Light theme toggle for panel (v2.0)
- [x] Custom hotkey remapping — change any shortcut from the panel settings (v2.0)
- [x] In-app update alerts when a new version is released (v2.0)

---

## Project Stats

| Metric | Value |
|---|---|
| Desktop Framework | Electron v29 |
| AI Model | GPT-OSS 120B |
| AI Provider | Groq (free tier) |
| Free Daily Requests | ~1,000 |
| Avg Response Speed | ~0.5–1.5 seconds |
| App Size | < 5MB (excl. node_modules) |
| Platform | Windows 10 / 11 |
| Source Files | 14 files |

---

## License

MIT License — free to use, fork, and build on top of BEBO.

---

## Author

**Bhavik Thakkar**
Student — Lal Bahadur Shastri Institute of Management
GitHub: [@bhavik8025](https://github.com/bhavik8025)

---

*Built with Electron, Node.js, Groq, GPT-OSS 120B, and Claude.*
