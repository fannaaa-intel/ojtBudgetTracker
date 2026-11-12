# OJT Budget Tracker — handoff

Last updated: 2026-11-12 · Branch `main` · Remote `https://github.com/fannaaa-intel/ojtBudgetTracker`

Read in this order: **CLAUDE.md** (rules) → **plan.md** (decisions + checklist) → this file (status + how we work).

---

## 1. How the owner works (follow exactly)

- One phase at a time, with approval:
  1. **STEP 1 — report first, no code:** list every unchecked item; for each: how, files, packages
     (`npx expo install`), schema changes/migrations, tests; risks, questions. Then STOP.
  2. **STEP 2 — build only after "GO":** items in order; after **each** item run
     `npm run typecheck` + `npm test` (+ Android bundle check below), fix errors, tick it in plan.md.
  3. **STEP 3 — phase report:** what was built (files), step-by-step phone test in Expo Go, known
     issues/skipped. Then STOP and wait.
- **"GO" / `/go`** = the owner's approval to do the next pending step (see §4).
- Owner is on **Windows PowerShell** — no bash scripts for them. Never `npm audit fix --force`.
- Ask before changing any decision in plan.md. Recommendations are welcome; the owner usually accepts them.
- **Commit/push only when asked.** Commit messages go through a file (`git commit -F <file>`) —
  PowerShell here-strings piped to `-F -` do not work.
- Design: minimalist monochrome (theme tokens only), no ripple anywhere, one primary button per
  screen, 48 px targets, light + dark, Taglish labels via `useLabels()`.

## 2. Status

| Phase | State |
|---|---|
| 0 Setup | ✅ |
| 1 MVP | ✅ all 10 items (commit `fd64325`) |
| Nav polish | ✅ no ripple, haptic tabs, square + button (`2507503`) |
| 2 OJT layer + living costs | ✅ all 10 items + logo (`49d280a`) |
| 3 Extras + polish | ✅ items 1–7 · ⏳ item 8 = **owner's phone run of `docs/TEST_PLAN.md`** |
| UI polish after Phase 3 | ✅ line heights, roomier rows/sections, wrap instead of squeeze, smooth light/dark fade, redesigned Welcome screen |

Numbers: 28 test suites / **185 tests** passing · migrations `0000`–`0009` (all additive after 0000) · 28 tables.

## 3. Next (what the next session starts with)

1. **Owner runs `docs/TEST_PLAN.md`** on the phone (Metro Manila profile → Settings → Erase all data →
   Talisay profile → fare hike → restore). Fix anything reported, then tick Phase 3 item 8.
2. **Phase 4 is not defined in plan.md yet.** Propose it as a STEP 1 report and wait for GO. Good
   candidates (owner has not decided any of these):
   - Development build / APK (EAS) so the logo icon, splash and notifications work outside Expo Go;
     verify local notifications on SDK 58
   - Fill plan.md §8 open questions: Plus Codes for LGU Talisay, ITC Bldg, LANDBANK Plaza
     (`src/db/seed/agencies.ts`), custom-agency option, LRT-2/MRT-3 promo end
   - Savings withdrawals; multiple Beep cards; 2027 holiday list
   - Optional: DB-level tests with an in-memory SQLite harness for the query layer
   - Accessibility pass (font scaling at 130%, TalkBack labels)

## 4. What "GO" means next session

- If the last thing given was a **STEP 1 report** → GO = build that phase (STEP 2), then STEP 3 report.
- If the last thing given was a **STEP 3 phase report** (current state) → GO = write the **next phase's
  STEP 1 report** (no code), then wait. Right now that is **Phase 4** (see §3), after any fixes from the
  owner's phone test.
- "commit and push" = commit to `main` and `git push`.

## 5. Working notes (gotchas)

- **Typed routes:** after adding a screen file in `src/app`, regenerate `.expo/types/router.d.ts`
  by starting the dev server briefly (`$env:CI='1'; npx expo start --offline --port 8099`), wait until
  the new path appears in that file, then stop it. Otherwise `npm run typecheck` fails on `router.push`.
- **Bundle check** (catches import errors tests miss):
  `npx expo export --platform android --output-dir <temp folder>` (never inside the repo).
- **Schema:** edit `src/db/schema.ts` → `npm run db:generate` → read the new SQL (must be additive:
  ADD COLUMN / CREATE TABLE). New tables must be added to `RESTORE_ORDER` in `src/lib/backup.ts`
  (a test checks every table and foreign-key order) and the table count in `__tests__/backup.test.ts`.
- **Reads:** use `useDbQuery(run, tables, deps)` (`src/db/useDbQuery.ts`), not drizzle `useLiveQuery`
  (that one only watches one table and starts empty).
- **expo-file-system (SDK 58):** `File.write`/`move` are async — use `writeSync` or `await`.
- **Money** in centavos end to end; text ↔ centavos via `toCentavos` / `amountToInput`; display via `formatPeso`.
- **Region gate:** `featuresFor(region)` / `barkadaVisible()` in `src/lib/region.ts`. Bicol: no trains,
  Carousel, Beep, barkada/ambagan; utang is for everyone (owner decision).
- **Transfers** (savings, Beep top-ups) are `kind = 'transfer'` and never count as spending.
- **Restore** clears the PIN on purpose (Forgot PIN = erase → restore).
- **Logo assets** in `assets/` were generated from `assets/brand/logo-source.png` (transparent PNG);
  in-app logo is tinted with the theme text colour (`src/components/Logo.tsx`).

## 6. Map of features → code

| Area | Screens (`src/app`) | Logic (`src/lib`) | Data (`src/features`) |
|---|---|---|---|
| Transactions | `transactions/` | `transactions.ts`, `tags.ts` | `transactions/` |
| Add tab, meals | `(tabs)/add.tsx` | `meals.ts` | `meals/`, `commute/components/CommuteQuickLog.tsx` |
| Routes, fares, Beep | `routes/`, `fares/`, `wallets/beep.tsx` | `fare.ts`, `route.ts`, `fareForm.ts`, `fareCheck.ts`, `wallet.ts`, `region.ts` | `commute/`, `wallets/` |
| Budgets, gala | `budgets/`, `gala/` | `budget.ts`, `gala.ts` | `budgets/`, `gala/` |
| Income | `income/` | `paySchedule.ts` | `income/` |
| OJT | `ojt/` | `ojt.ts`, `dates.ts` | `ojt/` |
| Bills, roommates | `bills/`, `settings/living.tsx` | `bills.ts`, `split.ts` | `bills/`, `roommates/` |
| Essentials, grocery | `essentials/`, `grocery/` | `essentials.ts`, `grocery.ts` | `essentials/`, `grocery/` |
| Savings | `savings/` | `savings.ts` | `savings/` |
| Utang, barkada | `utang/`, `barkada/` | `barkada.ts` | `utang/`, `barkada/` |
| Reports, export | `reports/` | `reports.ts`, `export.ts` | `reports/`, `export/` |
| Backup, restore, erase | More / Settings rows | `backup.ts` | `backup/` |
| Reminders | `settings/reminders.tsx` | `reminders.ts` | `notifications/` |
| Lock | `settings/security.tsx` | `pin.ts` | `security/` |
| Labels, theme | `settings/labels.tsx`, `settings/appearance.tsx` | `labels.ts` | `store/labels.ts`, `store/theme.ts` |
