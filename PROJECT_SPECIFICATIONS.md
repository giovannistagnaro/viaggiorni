# Project Context — Viaggiorni

---

## What we're building
A local-first, encrypted desktop journal app. The app should feel cozy, trustworthy, and genuinely useful — not corporate or generic. Users journal daily, track habits, manage todos, log mood, and optionally use AI via Ollama.

---

## Design north star
Cozy, trustworthy, genuinely helpful. Warm minimal aesthetic — not cold, not corporate.

---

## Tech stack

### Frontend
- React + TypeScript + Vite + Tailwind
- shadcn/ui for functional primitives
- TipTap for rich text editing
- Light and dark mode — warm variants of both (warm creams/tans for light, deep warm browns for dark)
- Font pairing: serif/semi-serif for headings (e.g. Lora), clean sans-serif for body
- Color palette: warm whites, creams, muted terracotta (#C17B4E is primary accent), sage, warm tan

### App shell
- Electron for cross-platform desktop packaging
- Electron Builder for distribution targets: .AppImage (Linux), .msi (Windows)
- Mac deferred — no signing budget for v1
- No auto-updates in v1
- Node.js only in Electron main process — no Python sidecar
- React ↔ main process communication via Electron IPC bridge

### Database
- SQLite via better-sqlite3-multiple-ciphers (SQLCipher support)
- Drizzle ORM for type-safe queries
- Single encrypted .db file stored in Electron app data directory
- Password derived to encryption key via PBKDF2 — never stored

### Encryption & auth
- SQLCipher encrypts entire database at rest
- Photos stored as AES-encrypted files on disk in app data directory
- Single app-level password — set on first launch
- No password recovery by design
- App can be locked via UI button or Ctrl+L keybind

### AI (optional integration)
- Ollama at localhost:11434
- App checks connection on launch — AI features shown if running, hidden if not
- User selects model from dropdown populated via GET localhost:11434/api/tags
- All AI features have local fallbacks (JSON word list, prompt list)
- Used for: word of the day, writing prompt generation

---

## UI structure

### Persistent topbar (every screen)
- Left: breadcrumb navigation — Cover › Index › [entry date] — each segment clickable
- Center: auto-save indicator — fades in/out after typing stops
- Right: Lock button (Ctrl+L keybind shown), Settings gear icon

### Screens
1. Login — greeting with time of day + name, password input, local encryption footnote
2. Cover — book with spine, journal title, year, left/right navigation arrows
3. Index — two page spread: calendar (dot indicators on days with entries) + bookmarks list + jump-to shortcuts
4. Day view — two page journal spread:
   - Left page: widget grid (2-column, widgets can be half or full width)
   - Right page: writing prompt + text sections
   - Navigation arrows on far left/far right edges
   - Dog-ear bookmark toggle on top-right corner of right page
5. Settings — sidebar navigation with sections: Profile, Appearance, Security, AI, Habits, Template
6. Template editor — two-column layout manager with drag handles, show/hide toggles, width toggles

### Left page widgets (all optional, template-driven)
- Photo — carousel with scrapbook photo corner mounts
- Habit tracker — checkboxes with colored dots, streak counter
- To-do — today/tomorrow toggle, scrollable list, + button
- Mood — word tag multiselect, user-definable tags
- Word of the day — local fallback + Ollama

### Right page sections (all optional, template-driven)
- Writing prompt — local fallback + Ollama, shown above text areas
- Daily summary — rich text (TipTap)
- Gratitude — rich text
- Notable moment — rich text
- User-defined custom sections

---

## Data model (14 tables)

### settings
id, name, theme, password_hash, streak_tolerance, ollama_model, created_at, updated_at

### entries
id, title, date (YYYY-MM-DD), is_bookmarked, created_at, updated_at

### entry_sections
id, entry_id, type (daily_summary|gratitude|notable_moment|writing_prompt|custom), label, content (TipTap JSON), position, created_at, updated_at

### entry_widgets
id, entry_id, type (habit_tracker|todo_list|mood_tracker|word_of_day|photo), position, col_span (1=half|2=full), is_visible, created_at
Snapshot at entry creation — never updated by template changes

### template
id, name, created_at, updated_at

### template_sections
id, template_id, type, label, position, is_visible, created_at

### template_widgets
id, template_id, type, position, col_span, is_visible, created_at

### habits
id, name, color (hex), is_archived, created_at, updated_at

### habit_logs
id, habit_id, entry_date (YYYY-MM-DD), completed, created_at

### habit_pauses
id, habit_id, start_date, end_date (nullable = currently paused), created_at

### mood_tags
id, label, is_default, created_at
Default tags: Calm, Grateful, Anxious, Energized, Melancholy, Restless, Content, Overwhelmed, Focused, Tired, Hopeful, Stressed

### entry_mood_tags
id, entry_id, tag_id

### todos
id, entry_date (YYYY-MM-DD), label, is_completed, position, created_at, updated_at

### entry_photos
id, entry_id, file_path (encrypted on disk), caption, position, created_at

### word_of_day
id, entry_date (YYYY-MM-DD), word, definition, example, source (local|ollama), created_at

---

## Key decisions & rules
- Past entries are frozen — template changes never affect existing entries
- Entries snapshot the template into entry_widgets and entry_sections at creation
- Streak calculation is always dynamic — never stored
- Habit streak tolerance is a user setting (default 1 missed day)
- Habit pauses are stored as date ranges — pause/resume explicitly, app prompts to resume on open
- Todos linked by entry_date not entry_id — exist independently of journal entries
- Habit logs linked by entry_date not entry_id — same reason
- Photos are AES-encrypted files on disk — not stored as blobs in SQLite
- No leaderboard, no multi-user, no cloud sync — fully local
- No password recovery — communicate clearly to user on first launch
- Ollama model preference stored in settings — populated from /api/tags endpoint
- Lock button and Ctrl+L available on every screen
- Dog-ear corner = bookmark toggle on day view right page

---

## Streak calculation logic
1. Get all habit_logs for this habit ordered by entry_date descending
2. Get all habit_pauses for this habit
3. Start from yesterday (today not penalized until tomorrow)
4. Walk backwards day by day:
   - If day within a pause period → skip entirely
   - If completed = true → increment streak
   - If missed and within streak_tolerance → continue
   - If missed and exceeds streak_tolerance → stop
5. Return streak count

---

## Folder structure (suggested)
```
/
├── src/                    # React frontend
│   ├── components/
│   │   ├── layout/         # Topbar, breadcrumb, page shell
│   │   ├── screens/        # Login, Cover, Index, DayView, Settings, TemplateEditor
│   │   ├── widgets/        # Each widget as its own component
│   │   └── sections/       # Each right-page section component
│   ├── hooks/              # useEntry, useHabits, useTodos, useOllama etc.
│   ├── lib/                # Utility functions
│   └── types/              # Shared TypeScript types
├── electron/
│   ├── main.ts             # Main process — IPC handlers, app lifecycle
│   ├── preload.ts          # Preload script — exposes safe IPC bridge
│   └── db/
│       ├── schema.ts       # Drizzle schema — all 14 tables
│       ├── queries/        # One file per domain (entries, habits, todos etc.)
│       └── seed.ts         # Default template + mood tags on first launch
├── data/
│   └── words.json          # Local word of the day fallback list
│   └── prompts.json        # Local writing prompt fallback list
└── resources/              # App icons, assets
```

---



---

## Keyboard shortcuts
Register all in Electron main process via globalShortcut or IPC:
- Ctrl+L — lock app (clear key from memory, return to login)
- Ctrl+, — open settings
- Ctrl+Left — navigate to previous entry
- Ctrl+Right — navigate to next entry
- Ctrl+B — toggle bookmark on current entry


---

## Logging
- Library: electron-log
- Log file stored in Electron app data directory alongside the .db file
- NOT encrypted — must be readable without unlocking the app
- Log levels: info, warn, error

**Log these events:**
- App launch, lock, unlock, close
- DB opened successfully, DB locked, DB failed to open
- Ollama connected, disconnected, request failed, model selected
- Photo saved successfully, photo file not found
- Error stack traces on any unhandled exception

**Never log:**
- Journal entry content
- Habit names, todo labels, mood tags, display name
- Any user-generated content whatsoever
- File paths that reveal personal information

Log file location should be documented in README so users can find it for bug reports.

---

## Error handling rules
Follow these consistently — decide once, apply everywhere:

- **DB fails to open** — show clear error screen with option to export raw .db file for recovery
- **DB corruption detected** — unlock succeeds but queries fail — show recovery screen, offer backup import
- **Ollama errors** — always fail silently, always fall back to local content, never show error to user
- **Missing photo file** — DB row exists but file not found on disk — show neutral placeholder, do not crash
- **App crash** — electron-log captures error to local log file before exit
- **React render error** — error boundary catches it, shows friendly "something went wrong" with option to reload

---

## Backup & restore
- Settings screen has "Export backup" button
- Uses Electron dialog.showSaveDialog to let user choose location
- Copies encrypted .db file as-is — no decryption needed, it is already encrypted
- First launch screen has "Restore from backup" option
- Import copies .db file into app data directory, then proceeds to login

---

## Onboarding flow (first launch only)
Triggered when no settings row exists in DB:
1. Welcome screen — enter display name
2. Set password — input + confirmation + clear warning that there is no recovery
3. Brief tour — show the three main areas (cover, index, day view)
4. Seed default template (5 widgets, 4 sections) and 12 default mood tags
5. Land on day view ready to write first entry

---

## Window state
- Use electron-window-state package
- Remembers window size and position between launches
- Initialize in main.ts before creating BrowserWindow

---

## Testing stack

- **Vitest** — unit test runner, works natively with Vite
- **React Testing Library** — component behavior testing
- **Playwright** — end-to-end testing driving the actual Electron window

### What to test (priority order)

**Unit tests — high value, test these thoroughly:**
- PBKDF2 key derivation function
- Database lock/unlock logic
- Streak calculation — all edge cases (tolerance, pauses, missing days, today grace)
- Habit pause/resume date range logic
- Entry snapshot logic — template changes must not affect past entries
- Todo date logic — today vs tomorrow

**Component tests — selective:**
- Login screen error state (wrong password)
- Mood tag selection toggle

**E2E tests — critical flows only:**
- Full first launch (name + password setup + first entry)
- Lock and unlock app
- Create entry, check off habit, add todo

### CI/CD workflows

**test.yml — runs on every push to main:**
- ubuntu-latest runner
- npm install → npm run test (Vitest)
- Fast feedback, under 2 minutes

**release.yml — runs on version tags (v*):**
- Two parallel jobs:
  - ubuntu-latest → builds .AppImage
  - windows-latest → builds .msi
- Artifacts attached to GitHub Release automatically
- Trigger: git tag v1.0.0 && git push origin v1.0.0

**Note on Playwright in CI:**
Running Electron in GitHub Actions requires a virtual display (xvfb on Linux).
Run Playwright locally during development — add to CI once app is stable.

## v2 backlog (do not build in v1)
- Multiple journals
- Per-entry locking
- Multiple templates
- Template editor drag-from-bank UI
- Todo rollover
- Habit statistics / trends
- Search across entries
- Export to PDF or markdown
- Mac support
- Auto-updates
- llama-cpp-python bundled AI
- Shareable entry cards
