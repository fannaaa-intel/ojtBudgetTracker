# OJT Budget Tracker

Offline budget tracker for OJT interns — pamasahe, pagkain, bills, gala and the total cost of your OJT. Expo + SQLite, minimalist monochrome UI.

## Quick start

```bash
npm install
npm run setup   # installs SDK-matched packages and generates the database migration
npm test
npm start       # open in Expo Go or an Android emulator
```

## What works now
- Registration: name, school, student discount → choose agency (NFRDI, LGU Talisay, ITC Bldg, LANDBANK Plaza) → home address/pin → OJT schedule
- On-device database (26 tables) seeded with fares (as of Sept 28, 2026), categories, meal presets, holidays
- Fare calculator, peso formatting, offline Plus Code decoding, OJT date math — all unit-tested
- Five tabs (Home, Commute, Add, Budget, More) with placeholders for the next phases

See **plan.md** for the phase checklist and **CLAUDE.md** for coding rules.
