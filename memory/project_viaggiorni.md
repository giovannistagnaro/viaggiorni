---
name: Project — Viaggiorni Journal App
description: Overview of the local-first encrypted desktop journal app the user is building
type: project
---

Local-first, encrypted desktop journal app codenamed "Viaggiorni" (working directory: /home/mashed/Desktop/projects/viaggiorni).

**Stack:** React + TypeScript + Vite + Tailwind + shadcn/ui + TipTap (rich text) + Electron + better-sqlite3-multiple-ciphers (SQLCipher) + Drizzle ORM + electron-log + Vitest + Playwright

**Design:** Warm minimal aesthetic. Primary accent: #C17B4E (terracotta). Light mode: warm creams/tans. Dark mode: deep warm browns. Fonts: Lora (headings), clean sans-serif (body).

**Key architecture decisions:**
- Single encrypted SQLite .db file in Electron app data directory
- Password → PBKDF2 key derivation, never stored
- Photos stored as AES-encrypted files on disk (not blobs in DB)
- Past entries are frozen — template changes never affect existing entries
- Entries snapshot template at creation time (entry_widgets, entry_sections)
- Todos and habit logs linked by entry_date (not entry_id) — exist independently
- No password recovery by design
- AI via Ollama (localhost:11434) — optional, always falls back to local JSON content
- No cloud sync, no multi-user, no leaderboard

**14 DB tables:** settings, entries, entry_sections, entry_widgets, template, template_sections, template_widgets, habits, habit_logs, habit_pauses, mood_tags, entry_mood_tags, todos, entry_photos, word_of_day

**Distribution targets:** .AppImage (Linux), .msi (Windows). Mac deferred (no signing budget for v1). No auto-updates in v1.

**Context file:** CLAUDE_CODE_CONTEXT.md in project root — read at start of every session.

**Why:** Greenfield project, starting from scratch as of 2026-04-29.
**How to apply:** Always read CLAUDE_CODE_CONTEXT.md at session start. Keep all suggestions within v1 scope — v2 backlog items are explicitly deferred.
