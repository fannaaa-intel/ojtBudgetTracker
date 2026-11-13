# OJT Budget Tracker — handoff

Last updated: 2026-11-13 · Branch `main` · Remote `https://github.com/fannaaa-intel/ojtBudgetTracker`

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
| UI polish after Phase 3 | ✅ line heights, roomier rows/sections, wrap instead of squeeze, redesigned Welcome screen |
| Theme switch | ✅ snapshot cross-fade (`react-native-view-shot`, 450 ms ease-in-out) when tapping Settings → Appearance; flicker-free colour fade for phone-driven changes; off with Reduce Motion — **owner to confirm it feels smooth on the phone** |
| UI pass (space + motion) | ✅ plan.md §6a items 1–7 built 2026-11-13, committed + pushed (`0d21079`) · ⏳ item 8 cross-fade tuning waits for owner feedback |
| 4 Real phones + loose ends | ✅ plan.md §6b items 1–5 built 2026-11-13 (**not committed yet**) · ⏳ item 6 APK: setup done, project linked — owner runs the EAS build · **STEP 3 report given** |

Numbers: 31 test suites / **203 tests** passing · migrations `0000`–`0010` (all additive after 0000; 0010 = `holidays.region`) · 28 tables.

## 3. Next (what the next session starts with)

0. **UI pass — built (2026-11-13), STEP 3 report given.** Waiting for the owner's phone check:
   Welcome showcase, Home, tabs, list screens at 360 dp + 130% font, light + dark, Reduce Motion.
   Fix what they report. Then tick §6a item 8 (cross-fade, kept at 450 ms) once they confirm.
   How it's built (keep using these):
   - Motion rules in `src/lib/motion.ts` (tested). `useReduceMotion()` / `reduceMotionNow()`
     (`src/components/useReduceMotion.ts`) is the one Reduce Motion source — ThemeFade uses it too.
   - `Appear` (fade + rise once on mount, `index` = stagger, capped at 8), `AnimatedAmount`
     (count-up, centavos stay integers, screen readers hear the final value), `IconBadge`,
     `EmptyState`, `useGrow` (bars grow via `scaleX/scaleY` + `transformOrigin`, native driver).
   - `ListRow` has `icon`, press-shrink, no font shrinking; `Section` has `icon`. Button / Chip
     press-shrink via `Animated.createAnimatedComponent(Pressable)`; Button `style` is now a plain
     style (no function form). Snackbar slides in/out.
   - Welcome showcase lives in `src/features/onboarding/components/WelcomeShowcase.tsx`
     (PulseRings, WelcomePreview using seeded NCR `meal_presets`, FeatureSlides auto-advance 4 s,
     TrustPills). Ambient loops there are the only motion > 300 ms; off with Reduce Motion.
   - Transaction rows use the category's seeded `icon` (+ `-outline`); `TxListItem.categoryIcon`.
   - Home `OjtProgressCard compact`; the full cost rows are on the OJT screen.
1. **Owner runs `docs/TEST_PLAN.md`** on the phone (Metro Manila profile → Settings → Erase all data →
   Talisay profile → fare hike → restore). Fix anything reported, then tick Phase 3 item 8.
2. **Phase 4 — items 1–5 built (2026-11-13), STEP 3 report given.** How it's built:
   - `topUpSeed(db)` (`src/db/seed/index.ts`, logic in `src/lib/seedTopUp.ts`) runs on every start
     and after a restore: adds missing holidays (by date) / agencies (by code) and missing agency pins.
     **To ship new holidays or pins later, just add them to the seed files** — installed phones get them.
   - `holidays.region` (null = national). `getHolidayMap(region)` / `holidaysFor()` filter by the
     user's region. REGION_V rows = Camarines Norte days for the Talisay intern (Feb 1, Sept 28).
   - 2027 list = Proclamation 1427 s. 2026 (read via GMA News; Official Gazette blocks bots).
     Eid'l Fitr / Eid'l Adha not in yet — add when their proclamations come out.
   - Agency pins in `agencies.ts`; `encodePlusCode()` in `src/lib/distance.ts` derives the codes.
     Talisay is the town centre — replace with the hall's exact pin if the intern sends one.
   - Savings withdrawal = transfer with `savings_goal_id` + `to_wallet_id` (Cash), `wallet_id` null.
     `goalSaved()` / `withdrawalError()` in `src/lib/savings.ts`. AmountPrompt has `validate`.
   - ListRow: `status` (spoken) and `actions` (TalkBack custom actions). AppText caps font scaling
     for display / amountLarge / title / label only.
3. **APK (§6b item 6): setup done 2026-11-13, owner runs the build.** Expo account `sersi07`
   (also has a team `sersi07s-team` — we use the personal one). Project linked:
   https://expo.dev/accounts/sersi07/projects/ojt-budget-tracker. Owner runs
   `npx eas-cli build -p android --profile preview` (first run asks to generate an Android keystore →
   Yes; EAS stores it). Install the APK link on the phone; move data via Back up → Restore.
   Bump `version` + `android.versionCode` in app.json before every new APK (appVersionSource local).
   Notes: `expo-font` must stay installed (vector icons need it outside Expo Go); run
   `npx expo-doctor` before builds; npm now skips install scripts (esbuild) — harmless so far.
   **The first APK the owner built (started before expo-updates was added) is a test copy only —
   the APK sent to interns must be built after the app-updates change.**
4. **Shipping a revision (EAS Update)** — owner decision 2026-11-13, see CLAUDE.md rule 4:
   - JS-only change (screens, logic, copy, seed data like holidays/fares): **do NOT change
     `version`** (runtime = app version). Run checks, commit, then the owner runs
     `npx eas-cli update --channel preview --platform android --message "<what changed>"` and tells the interns to open
     the app between 8 PM and 12 AM (or Settings → Check for updates). They tap Restart.
   - Native change (new native package, plugin, icon, permissions): bump `version` **and**
     `android.versionCode`, build a new APK, everyone reinstalls (data stays only if they back up →
     restore; reinstalling over the old APK with the same package + keystore keeps data).
   - Code: `src/lib/updates.ts` (window maths, tested), `src/features/updates/` (appUpdate store,
     UpdateSync in the root layout, UpdateRow in Settings). `checkAutomatically: NEVER` in app.json —
     we decide when to check. Disabled in Expo Go / dev.
   - Rollback a bad update: `npx eas-cli update:rollback` (or republish the previous commit).

## 4. What "GO" means next session

- If the last thing given was a **STEP 1 report** → GO = build that phase (STEP 2), then STEP 3 report.
- If the last thing given was a **STEP 3 phase report** → GO = write the **next phase's
  STEP 1 report** (no code), then wait.
- **Current state (2026-11-13): the Phase 4 STEP 3 report was the last thing given** (items 1–5
  done, not committed; item 6 APK set up, owner runs the build). Next: apply fixes from the owner's
  phone check / APK install; "commit and push" when asked; tick item 6 once the APK installs. No Phase 5 is defined — a plain GO after
  the APK = propose Phase 5 as a STEP 1 report (ideas: Eid holiday dates when proclaimed, Talisay
  hall pin, multiple Beep cards, DB-level test harness).
- "commit and push" = commit to `main` and `git push`.

## 5. Working notes (gotchas)

- **Node is on the owner's external drive** (`E:\Code\node.exe`). If `npm` is "not recognized",
  ask the owner to plug the drive in — don't hunt for another install.
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
- **Expo Go warnings (expected, harmless):** `[expo-notifications] Push notifications … unavailable in
  Expo Go` and `expo-notifications functionality is not fully supported in Expo Go`. The app uses only
  **local** reminders, which still work in Expo Go. The warnings print when the package loads and go
  away only with a development build / APK (Phase 4 candidate). Don't "fix" them by removing reminders.
- **Theme switching:** go through `transitionTheme(apply)` (`src/components/ThemeFade.tsx`) so the
  change cross-fades. The root layout wraps the Stack + Snackbar in a captured View (`screenRef`);
  ThemeFade is a sibling on top of it, under LockGate.
- **Logo assets** in `assets/` were generated from `assets/brand/logo-source.png` (transparent PNG);
  in-app logo is tinted with the theme text colour (`src/components/Logo.tsx`).

## 6. Design direction (owner request, Nov 12 2026)

The owner still finds some text **crowded** and the app a bit **static**. Goal: minimalist, calm,
spacious — but alive. Monochrome rules in CLAUDE.md still apply (no colour, theme tokens only).

**Space and text — fix crowding first**
- Audit every screen at a narrow width (~360 dp) and with phone font size at 130%.
- One idea per row: a title, at most one short subtitle line, one value. Move extra facts to the
  detail screen instead of joining them with "·" into long subtitles.
- Shorten copy: captions ≤ 1 line where possible; drop repeated explanations ("Past entries keep
  what you paid" once per screen, not per row).
- Generous spacing: screen gutter 16–20, section gap 24+, row padding 12–16, never two text styles
  touching without a gap. Prefer whitespace over dividers.
- Numbers get their own space: large amounts on their own line (`amountLarge`), not squeezed next
  to labels. Never shrink text to fit; wrap or move it.
- Fewer things per screen: collapse rarely used options behind "More options" / detail screens.

**Elements — so it isn't static (all monochrome)**
- Icons: a small outlined Ionicons glyph in a 36–40 px rounded square for list rows and section
  headers (as on the Welcome screen) — gives rhythm without colour.
- Empty states: icon + one-line message + one action instead of plain grey text.
- Cards: use `surface` fills and the inverse hero card sparingly to create hierarchy.
- Progress: thin bars / rings for budgets, OJT hours and savings (already partly there).

**Motion — subtle, purposeful, Reduce Motion respected**
- Screen content fades/rises in on mount (like the Welcome screen), 200–300 ms, ease-out.
- Numbers count up when they change (today spent, safe to spend, OJT hours).
- Progress bars animate to their new width; chips/rows press-shrink (no ripple — see `usePressScale`).
- List items appear with a short stagger; snackbar slides up instead of popping.
- Keep everything native-driver, ≤ 300 ms, and turned off when Reduce Motion is on.

Deliver it the usual way: STEP 1 report listing the screens/components to change (with before →
after notes), wait for GO, then build component by component (shared pieces in `src/components`
first, so every screen benefits), with typecheck + tests + bundle after each step.

## 7. Map of features → code

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
