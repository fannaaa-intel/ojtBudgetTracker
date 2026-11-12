# OJT Budget Tracker

Offline budget tracker for OJT interns — pamasahe, pagkain, bills, gala and the total cost of your OJT. Expo + SQLite, minimalist monochrome UI, light and dark mode.

## Quick start (Windows PowerShell)

```powershell
npm install
npm test            # 185 unit tests
npm run typecheck
npm start           # scan the QR with Expo Go (Android)
```

## What works now
- **Log fast:** one-tap meal presets, one-tap daily commute (Beep for trains), expense / income forms, undo, history
- **Commute:** saved routes with live fares, editable fare table, bulk fare update after a hike, route compare, Beep card
- **Budgets:** weekly / monthly envelopes, rollover, safe-to-spend today, near / over alerts
- **OJT:** hours log, projected end date, cost per day / hour, projected total
- **Living costs:** rent & bills, electricity estimator, roommate split, essentials, grocery list with price memory, savings goals + emergency fund
- **Group (Metro Manila only):** barkada, ambagan; utang for everyone
- **Data:** reports, OJT cost PDF, CSV, JSON backup / restore, erase
- **App:** local reminders, PIN / fingerprint lock, Taglish / English labels, light / dark / system theme

## Docs
- **plan.md** — decisions and phase checklist
- **CLAUDE.md** — coding rules
- **docs/HANDOFF.md** — current status, how we work, gotchas
- **docs/TEST_PLAN.md** — phone test checklist (Metro Manila + Talisay profiles)
- `/go` — the owner's GO signal for Claude Code (`.claude/commands/go.md`)
