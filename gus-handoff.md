# Gus — The Grammar Checker · Handoff Document

## What is this?
A handoff for a Claude Code agent to begin building **Gus**, a personal desktop writing assistant app for macOS and Windows. All design and architecture decisions have been fully resolved in a prior planning session. This document captures everything needed to start coding from scratch.

---

## Project summary

Gus is a lightweight desktop app that sits in the background and intercepts selected text from any app (Word, Notion, email, etc.) via a global keyboard shortcut. A floating diff panel appears showing the original text alongside AI-suggested changes. The user accepts or dismisses. The corrected text replaces the clipboard, ready to paste back.

---

## Resolved architecture decisions

| Concern | Decision |
|---|---|
| Platform | macOS + Windows |
| Framework | Electron + React + Vite |
| Text capture | Clipboard hook triggered by global shortcut |
| Global shortcut | `Cmd+Shift+G` (Mac) / `Ctrl+Shift+G` (Windows) |
| UI | Floating diff panel — light, minimal, soft pastel colour accents |
| AI backend | Ollama running locally (no cost, fully private) |
| AI model | `llama3.1:8b` (default) |
| Modes | 4 modes (see below) |
| Cost | $0/month — no external APIs |
| App name | Gus — The Grammar Checker |

---

## The 4 modes

Each mode sends a different system prompt to Ollama. The user switches modes via pill buttons in the floating panel. The active mode persists between uses.

1. **Spell & grammar** — fix typos, punctuation, grammar errors only. Do not rephrase or change voice.
2. **Refinement** — improve sentence and paragraph structure, flow, and clarity. May lightly reword.
3. **Tone shift** — rewrite for a specific tone. The user selects a target tone (formal, casual, confident, friendly) — this is a sub-option within the mode.
4. **Concise** — cut waffle, tighten sentences, remove filler words.

---

## User flow

1. User selects text in any app
2. Presses `Cmd+Shift+G`
3. Gus reads text from clipboard
4. Sends text + active mode system prompt to Ollama (`llama3.1:8b`)
5. Floating panel appears near cursor showing:
   - Original text (with removals highlighted red/strikethrough)
   - Suggested text (with additions highlighted green)
   - 4 mode pills at the top (active mode highlighted in soft colour)
   - `Dismiss` and `Accept ↵` buttons
6. User presses `Enter` or clicks Accept → corrected text copied to clipboard → panel closes
7. User pastes back into their app with `Cmd+V`

---

## UI design spec

- **Style**: light, minimal, white card surfaces, soft pastel accents — similar to the IcyLab notes app aesthetic
- **Panel dimensions**: ~480px wide, floating, appears near cursor
- **Border radius**: xl (16px) for the panel card
- **Colours per mode (active pill)**:
  - Spell & grammar → blue (`#E6F1FB` bg, `#0C447C` text, `#B5D4F4` border)
  - Refinement → purple (`#EEEDFE` bg, `#3C3489` text, `#CECBF6` border)
  - Tone shift → teal (`#E1F5EE` bg, `#085041` text, `#9FE1CB` border)
  - Concise → amber (`#FAEEDA` bg, `#633806` text, `#FAC775` border)
- **Diff display**: red strikethrough for removals, green highlight for additions
- **Logo mark**: Small 28x28 rounded square with "G" in blue on blue-50 background
- **App subtitle**: "The grammar checker" in muted small text under "Gus"
- **Shortcut hint**: `⌘ shift G` pill in top-right corner of panel

---

## Tech stack

```
electron              # Desktop shell, global shortcut, clipboard APIs
react + vite          # UI renderer
ollama (local)        # AI backend — must be running as background process
llama3.1:8b           # Default model
```

### Ollama integration
- Ollama exposes a local REST API at `http://localhost:11434`
- Call `/api/generate` with `model: "llama3.1:8b"` and a mode-specific system prompt
- Handle the case where Ollama is not running — show a friendly error state in the panel

---

## Suggested project structure

```
gus/
├── electron/
│   ├── main.js          # App entry, global shortcut, clipboard, tray icon
│   └── preload.js       # Context bridge for renderer ↔ main IPC
├── src/
│   ├── App.jsx          # Floating panel UI
│   ├── components/
│   │   ├── DiffView.jsx     # Original vs suggested diff display
│   │   ├── ModePills.jsx    # Mode switcher pills
│   │   └── ActionBar.jsx    # Accept / Dismiss buttons
│   ├── hooks/
│   │   └── useOllama.js     # Ollama API call logic
│   └── prompts.js           # System prompts for each mode
├── vite.config.js
└── package.json
```

---

## Key Electron APIs to use

- `globalShortcut.register('CommandOrControl+Shift+G', callback)` — trigger
- `clipboard.readText()` — read selected text
- `clipboard.writeText(corrected)` — write accepted text back
- `BrowserWindow` with `alwaysOnTop: true`, `frame: false`, `transparent: true` — floating panel
- Position the window near the cursor using `screen.getCursorScreenPoint()`

---

## Suggested skills to invoke

- `/mnt/skills/public/frontend-design/SKILL.md` — for UI component styling and design tokens
- `/mnt/skills/user/impeccable/SKILL.md` — for UI polish and making the panel feel native and delightful
- `/mnt/skills/user/emil-design-eng/SKILL.md` — for animation and micro-interaction decisions (panel appear/dismiss transitions)

---

## What to build first (suggested order)

1. Scaffold Electron + React + Vite project
2. Register global shortcut and read clipboard in main process
3. Build the floating `BrowserWindow` (frameless, always-on-top, positioned near cursor)
4. Wire up Ollama API call with a hardcoded spell & grammar prompt
5. Build the diff panel UI (DiffView, ModePills, ActionBar)
6. Connect mode switching to different system prompts
7. Handle accept (write to clipboard) and dismiss (close window)
8. Add Ollama-not-running error state
9. Package for macOS + Windows with `electron-builder`

---

## Notes

- User is on an M1 MacBook Air — Ollama runs excellently on Apple Silicon
- The app is for personal use only — no auth, no server, no telemetry
- Keep the dependency footprint minimal — this is a lightweight utility, not a full product
- The panel should feel snappy — target <3s from shortcut trigger to panel appearing
