# BEBO the PET - Roadmap

This document tracks all planned features, improvements and ideas for future versions of BEBO.
Every new idea goes here first before touching any code.

---

## Current Version

### v1.0.0 - Released (2026)
- 6 AI functions: Summarize, Humanize, Simplify, Draft Email, Fix Grammar, Ask AI
- Always-on-top desktop pet (Windows)
- Global hotkeys: Ctrl+Shift+W (Wake), Ctrl+Shift+H (Hide), Ctrl+Shift+P (Panel)
- Groq + Llama 3.3 70B (800-1000 tok/s, 14,400 free requests/day)
- Resizable panel, editable output, one-click copy
- Auto-start on Windows login via shell:startup
- System tray support
- Dark theme UI

---

## v1.1.0 - Near Term

### Text Selection Hotkey (Ctrl+Shift+A)
Source: Dev.to community suggestion
Description: User selects any text anywhere on screen, presses Ctrl+Shift+A,
BEBO opens with that text already pre-filled in the input box.
Eliminates the copy-paste step entirely.
How it works:
- Register new global shortcut via globalShortcut
- Silently simulate Ctrl+C using robotjs to capture selected text
- Read clipboard via electron.clipboard.readText()
- Send text to panel via existing IPC
- Open panel with text pre-filled
Package needed: npm install robotjs
Effort: Low (2-3 hours, infrastructure already in place)

### Conversation History Panel
Description: Store last N AI conversations locally so user can refer back.
Save to a local JSON file in app data folder.
Add a history tab inside the panel to browse past results.
Effort: Medium

### Custom Hotkey Configuration
Description: Let user change the 3 global hotkeys from a settings panel.
Currently hardcoded - should be user configurable.
Effort: Low

### Output History
Description: Save last 10-20 AI results locally so nothing is lost if user
forgets to copy before closing panel.
Effort: Low

---

## v2.0.0 - Future

### Voice Input
Description: User speaks their prompt instead of typing or pasting.
Use Web Speech API available in Electron Chromium renderer - no extra package needed.
Or integrate OpenAI Whisper / Groq Whisper for better accuracy.
Effort: Medium

### Custom AI Personas
Description: Let user pick or create custom AI personalities.
Examples: Formal Assistant, Casual Friend, Expert Coder, Creative Writer.
Implementation: Settings panel with persona selector that changes the ROLE
section of the prompt engine.
Effort: Low

### Plugin System
Description: Let users add their own custom AI functions beyond the 6 built-in.
Simple version: Load custom prompt templates from a local folder.
User creates a .json file with role/objective/context/instructions and BEBO
loads it as a new action button automatically.
Effort: Medium

### Multi-Language Support
Description: Let user pick output language for all AI responses.
Add a language dropdown in settings.
Append language instruction to every prompt automatically.
Effort: Low

### Clipboard Monitor Mode
Description: BEBO automatically detects when user copies text and shows
a subtle prompt asking if they want to process it.
Optional mode that can be toggled on/off.
Effort: Medium

### Font Size and UI Settings
Description: Let user adjust panel font size and text density.
Small, Medium, Large options.
Effort: Low

---

## v3.0.0 - Long Term

### macOS Port
Description: Electron is cross-platform so the core app works on macOS.
Main challenges are window management differences and always-on-top
behavior on macOS which is handled differently than Windows.
Also need to rebuild the EXE as a .dmg installer.
Effort: High

### Custom Prompt Templates
Description: User can write and save their own full prompts as named actions.
Example: user writes a prompt for their specific job and saves it as
a button called "My Work Summary".
Effort: Medium

---

## Ideas Parking Lot
(Not yet assigned to a version - need more thinking)

- BEBO pet animations for different states (thinking, done, error)
- Multiple BEBO skins or color themes
- Mini floating result bubble instead of full panel for quick tasks
- Keyboard navigation inside panel (tab between buttons)
- Export output directly to clipboard in different formats (markdown, plain, HTML)
- Usage stats panel (how many tasks run, tokens used, time saved estimate)

---

## NOT Planned (Technically Not Feasible for BEBO)

| Feature | Reason |
|---|---|
| Mobile companion app | Completely separate project - different tech stack (React Native or Flutter). Not an extension of BEBO. |
| Image understanding | Llama 3.3 70B via Groq does not support vision. Would need a different model and API entirely. |
| Real-time data (stocks, weather, news) | Groq and Llama have no internet access. Would need separate APIs for every data type - outside BEBO scope. |

---

## How to Use This Document

- Every new idea goes here before touching any code
- Add the source of the idea (user suggestion, community feedback, personal idea)
- Assign to a version only when ready to build
- Move to "Ideas Parking Lot" if good but not yet ready to plan
- Mark NOT Planned clearly with reason so we do not revisit dead ends

Last updated: June 2026
