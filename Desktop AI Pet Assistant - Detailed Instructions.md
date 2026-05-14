You are an expert desktop product designer, animation systems designer, Electron engineer, and AI productivity app architect.

I want you to help me build a highly interactive desktop AI pet for Windows that feels very close to the Codex Pet experience, but customized for productivity and daily work help.

IMPORTANT PRODUCT DIRECTION
This is NOT a normal chatbot.
This is NOT just a floating assistant bubble.
This should behave like a real on-screen desktop pet:
- always visible
- animated
- emotionally expressive
- interactive
- draggable
- reactive to my actions
- able to help with real work tasks
- able to read selected context or screen context
- playful in behavior but genuinely useful

The pet should feel similar in spirit to Codex Pets:
- floating overlay on top of other windows
- visible while I continue doing my work
- animated and alive
- changes state depending on what it is doing
- gives ambient feedback without forcing me to open a full app every time
- can expand into a compact assistant panel when needed
- can be custom-styled like a real pet companion, not a corporate widget

CORE GOAL
Build a production-quality MVP of a desktop pet assistant that:
- stays on screen at all times
- behaves like a living digital pet
- has moods, emotions, reactions, and animations
- helps me with my daily tasks
- supports summarize, rephrase, humanize, professional rewrite, email writing, explain screen, extract tasks, and other productivity actions
- can react to my work context intelligently

PLATFORM
Target Windows first.

TECH STACK
Use Electron as the main desktop shell because I want:
- frameless transparent overlay window
- always-on-top floating pet
- click-through mode when appropriate
- draggable pet
- compact side panel or speech bubble
- system tray integration
- keyboard shortcuts
- modern UI with HTML/CSS/JS or React

You may also use:
- SQLite for local memory
- screenshot capture
- OCR
- accessibility text if feasible
- animation system for sprite-based pet states
- LLM integration through API
- local-first data handling where possible

VERY IMPORTANT:
I want the pet to be built like a real animated pet system, inspired by the Codex pet style:
- sprite-based animation or equivalent state animation system
- multiple emotional states
- idle cycles
- waiting cycles
- attention-seeking behavior
- success/failure reactions
- hover reactions
- drag reactions
- sleep state
- wake state
- thinking state
- alert state
- review/ready state
- speaking state

PET BEHAVIOR REQUIREMENTS
The pet must feel alive.
Include:
- idle animation loop
- blink / bounce / tiny micro-movements
- emotional reactions based on task status
- movement variations
- hover response
- click response
- drag response
- a short “thinking” animation while processing
- a “done” or “success” animation after completing tasks
- a “confused” or “error” animation for failures
- a “sleeping” behavior when inactive for long time
- optional “wake up” animation when clicked or called
- optional “attention nudge” when a task is done and I am not looking at the full panel

EMOTIONAL STATES
Define a proper pet emotion model.
At minimum include:
- idle
- happy
- excited
- thinking
- waiting
- sleepy
- listening
- confused
- error
- success
- review-ready
- speaking
- curious

Each state should map to:
- animation behavior
- bubble style / icon / tiny particles if useful
- sound hooks optional but disabled by default
- pet posture / expression change

PET SYSTEM DESIGN
I want a real pet system, not one static animation.
Design it as:
1. Pet State Machine
2. Animation Controller
3. Interaction Handler
4. Mood Engine
5. Task Engine
6. Context Engine
7. Memory Engine
8. Overlay UI Layer
9. Panel UI Layer

The pet should be able to exist in two forms:
1. Floating Pet Mode
- tiny animated pet always on top
- speech bubble / tooltip
- status indicator
- minimal obstruction
- draggable
- click-through when idle if enabled

2. Expanded Assistant Mode
- opens compact side panel or popup panel
- shows task actions
- shows input area
- shows output
- shows context summary
- shows recent history
- allows one-click copy

CODEx-PET-LIKE IMPLEMENTATION DIRECTION
I want the architecture to be inspired by the Codex pet idea and community package model:
- pet manifest
- pet asset pack
- pet animation states
- sprite sheet or atlas support
- pet renderer
- pet widget / draggable overlay
- reusable pet package structure

Please design the pet asset system like this:
- pet.json manifest
- spritesheet.webp or equivalent atlas
- defined animation rows/states
- scale settings
- anchor settings
- emotion map
- state map
- optional metadata like personality, species, style, rarity, voice style

Include support for:
- built-in pet
- future custom pets
- swapping pet themes later
- pet package loader

ANIMATION SYSTEM REQUIREMENTS
Build a sprite-based or equivalent animation framework that supports:
- multiple states
- frame timing
- loop control
- one-shot animations
- state transition logic
- animation priority
- animation interruption rules
- hover and interaction transitions
- simple physics feel for movement if useful

If using sprite sheets, structure it cleanly and define:
- atlas dimensions
- cell size
- state row mapping
- animation config in manifest

UI / UX REQUIREMENTS
The pet should not feel like a toy only.
It must also help me with actual tasks:
- summarize text
- rephrase text
- humanize text
- rewrite professionally
- write email drafts
- explain what is on my screen
- extract action items
- convert notes into bullet points
- create follow-up drafts
- simplify text
- improve grammar

The output style should usually be:
- human-written sounding
- professional
- polite
- natural
- concise
- copy-paste ready

EMAIL-SPECIFIC REQUIREMENTS
Email drafting must:
- sound natural, not robotic
- be polite and professional
- avoid generic AI phrases
- be ready to copy-paste
- support types like request, apology, follow-up, update, thank-you, reminder

SCREEN UNDERSTANDING REQUIREMENTS
The pet should help explain what is on the screen.
It should be able to use:
- selected text
- clipboard text
- screenshot OCR
- active window title if available
- optional accessibility text if available

When I ask “Explain screen”, it should:
- identify what seems to be on screen
- summarize it in simple language
- tell me what seems important
- extract actions / dates / people / next steps if visible
- suggest what I can do next
- optionally create a draft reply or summary from that screen context

MVP FEATURE SET
Build the first version with:
- animated floating pet
- emotion/state machine
- draggable overlay
- always-on-top window
- transparent frameless Electron window
- click-through idle mode
- bubble UI
- compact expandable side panel
- task input box
- quick actions:
  - Summarize
  - Rephrase
  - Humanize
  - Draft Email
  - Explain Screen
  - Extract Tasks
- clipboard support
- screenshot capture
- OCR support
- local task history
- settings panel
- keyboard shortcuts
- privacy controls
- local memory for recent tasks
- support for one built-in pet package

PHASE 2 FEATURES
Design the architecture so these can be added later:
- multiple pets
- downloadable pet packs
- richer emotional intelligence
- proactive reminders
- voice interaction
- sound effects
- Outlook/Gmail integrations
- app-aware workflows
- calendar awareness
- persistent memory
- local model option
- richer desktop automation

PRIVACY / SAFETY RULES
- manual-triggered context capture by default
- clear visual indication when reading screen
- pause / resume screen reading
- app blocklist for sensitive apps
- local-first storage
- no silent background surveillance behavior
- environment variables for secrets
- safe handling of sensitive text
- avoid logging private content unnecessarily

RECOMMENDED INTERNAL ARCHITECTURE
Please structure the app into these modules:

1. electron-shell/
- main process
- overlay window creation
- panel window creation
- tray integration
- global shortcuts

2. pet-engine/
- pet state machine
- emotion engine
- animation controller
- interaction engine
- pet manifest loader
- pet package registry

3. renderer/
- pet widget
- speech bubble
- panel UI
- quick actions
- settings UI
- history UI

4. services/
- screenshot capture
- OCR
- clipboard service
- selected text / context service
- LLM service
- memory service
- task execution service

5. data/
- SQLite database
- settings
- pet package metadata

PET MANIFEST REQUIREMENTS
Please define a pet.json schema with fields like:
- id
- name
- species
- personality
- version
- author
- description
- spritesheet
- frameWidth
- frameHeight
- atlasColumns
- atlasRows
- scale
- anchorX
- anchorY
- defaultState
- states
- emotionMap
- soundMap (optional)
- metadata

Each state should support:
- row
- frames
- fps
- loop
- interruptible
- priority
- transitions

INTERACTION REQUIREMENTS
Support:
- click pet
- hover pet
- drag pet
- double click pet
- right click pet
- keyboard shortcut to wake pet
- keyboard shortcut to tuck away pet
- keyboard shortcut to trigger “Explain Screen”
- keyboard shortcut to open quick action panel

MOOD ENGINE REQUIREMENTS
Create a mood model that changes based on:
- recent user interaction
- whether a task is running
- whether task succeeded
- whether task failed
- idle time
- user attention
- active work state

Example:
- idle too long -> sleepy
- hover/click -> curious or happy
- task running -> thinking
- task complete -> excited / review-ready
- error -> confused / error
- repeated use -> energetic / engaged

TASK SYSTEM REQUIREMENTS
Commands:
- summarize
- rephrase
- humanize
- draft_email
- explain_screen
- extract_tasks
- simplify
- improve_grammar
- make_professional
- make_shorter
- make_more_polite

For each task:
- define input sources
- define output format
- define internal prompt template
- define fallback behavior
- define UI response behavior from pet
Example:
- task running -> pet enters thinking animation
- task complete -> pet shows success animation + speech bubble preview
- task failed -> pet shows error animation

MEMORY / HISTORY REQUIREMENTS
Store:
- recent tasks
- recent outputs
- timestamps
- source type (clipboard / screenshot / typed / selected text)
- task type
- tone preset
- whether copied
- favorite prompts
- pinned outputs

DESIGN REQUIREMENTS
Style should be:
- friendly
- slightly playful
- not childish
- polished
- clean
- modern
- compact
- dark-mode friendly

IMPORTANT:
Do not make the UI look like a generic AI SaaS dashboard.
This should feel like a living desktop companion.

DELIVERABLES I WANT FROM YOU
Please answer in this exact structure:

1. Product Vision
2. Exact Feature Breakdown
3. Pet Behavior Model
4. Emotion and State Machine Design
5. Pet Asset / Manifest Design
6. Full Architecture
7. Folder Structure
8. Data Model
9. IPC / Event Design
10. Prompt Templates for Tasks
11. Animation System Design
12. UI Component Plan
13. Build Roadmap
14. Full MVP Starter Code
15. How to Run
16. Phase 2 Expansion Plan

VERY IMPORTANT OUTPUT REQUIREMENTS
- Do not give only ideas
- Give actual implementation details
- Give actual starter code
- Include code blocks for important files
- Make it runnable
- Use clear filenames
- Explain where each file goes
- Keep MVP practical but strongly aligned with a real animated pet experience

QUALITY BAR
I want this to feel close to the Codex pet idea:
- floating animated overlay
- pet package architecture
- multiple states
- interactive desktop companion behavior
- useful work assistant
- ambient task feedback
- expandable assistant panel
- strong emotional / reactive layer

If the answer becomes too long, continue in phases automatically without repeating.
Start now with a serious production-minded plan and MVP codebase.
