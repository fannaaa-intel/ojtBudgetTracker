# OJT Budget Tracker — handoff

Last updated: 2026-11-13 (end of session) · Branch `main` · Remote `https://github.com/fannaaa-intel/ojtBudgetTracker`

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
| 4 Real phones + loose ends | ✅ plan.md §6b items 1–5 + app updates, committed + pushed (`1fd101b`) · ⏳ item 6: real APK built on EAS — tick when the owner confirms it installs and opens |
| Tutorial video for co-interns | ⏳ **next task** — owner sends screenshots, then says GO (see §3 item 5 below) |

Numbers: 32 test suites / **209 tests** passing · migrations `0000`–`0011` (all additive after 0000; 0010 = `holidays.region`, 0011 = `routes.trip`) · 28 tables.

Revisions after the APK are normally shipped as EAS Updates (see §3 item 4) and listed in plan.md
§6b "Revisions after the first APK". 2026-11-13: usual trip per route + keyboard fix (whole app) —
the owner chose a **fresh APK (versionCode 4)** for these instead of an update; they reinstall it and
replace the file in their Google Drive folder (same folder link → the video QR stays valid).
Keyboard handling lives in `src/components/Screen.tsx` — any new input must use `TextField` (or call
`useRevealFocusedInput()` on focus) and any new screen must use `Screen`, or the keyboard can cover it.

## 3. Next (what the next session starts with)

**Start with item 5 (tutorial video).** Items 0–4 are background on what was built; still-open
owner checks are listed in each.

### Session log 2026-11-13 (what we did)
- UI pass (space, motion, Welcome showcase) → committed `0d21079`.
- Phase 4: seed top-up, 2027 holidays (+ Camarines Norte days), agency pins (looked up), savings
  withdrawals, accessibility pass, Expo account + EAS project, APK setup, `expo-font`, app updates
  (8 PM–12 AM window), regression review (fixed: info rows read as "disabled") → committed `1fd101b`.
- Real APK build started on EAS (build `29b32882-…`). Owner installs it, then shares it with the
  5 co-interns via a **Google Drive link** (more reliable than the Expo page).
- Group-chat install message (Taglish) was written for the owner — copy kept in item 5 below.
- Owner chose a **tutorial video made from their screenshots** (I edit them into an MP4).

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
   the APK sent to interns must be built after the app-updates change.** That real APK build
   (commit `1fd101b`, versionCode 3) was started 2026-11-13: build `29b32882-2ee9-4032-a4dc-0b53f6e50e23`.
   Tick plan.md §6b item 6 once the owner confirms it installs and opens.
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
5. **Tutorial video for the co-interns — NEXT TASK.** Owner decision 2026-11-13: "Screenshots → I
   edit". The owner takes screenshots on the installed APK, pastes them into the chat, then says
   **GO**. Then build the video. No STEP 1 report needed — the plan below is already agreed.
   - **FINAL shot list (13, owner dropped the APK-install shot)** — light mode, Do Not Disturb,
     **owner uses their own real name/details (owner's choice, 2026-11-13 — don't ask them to use a
     sample name or blur it).** Owner pastes them in order 1→13:
     1 Welcome top (after the animations settle) · 2 Welcome scrolled to "See it in action" ·
     3 Register with their name · 4 Agency (one selected) · 5 Home step filled in · 6 Schedule
     filled in · 7 Route editor "Bahay → Office" with 1–2 rides + total · 8 Commute tab with the
     saved route · 9 + tab (meal chips + Log commute) · 10 black snackbar "Carinderia ₱80.00
     logged · Undo" · 11 Home tab with the Today card · 12 Budget tab "Safe to spend today"
     (after adding Pagkain weekly ₱1,000) · 13 More → Settings → "Check for updates" row.
     If some are missing or out of order, build with what was sent and say which were skipped.
     The install step is NOT a screenshot: show it as a text-only card instead (see captions).
   - **Video spec:** vertical 1080×1920, 45–60 s, MP4 (H.264, plays in Messenger). Monochrome like
     the app: white or near-black background, Logo from `assets/brand/logo-mark.png`.
     Title card (logo + "OJT Budget — Track every peso of your OJT") → one step per screenshot
     (screenshot in a rounded phone frame, slow zoom/slide, step number + big Taglish caption,
     ~4–6 s each, short crossfades) → end card ("I-download na" + **QR code** + "Link sa group chat",
     "Android lang · Offline · Libre"). No music needed (owner can add one in Messenger/CapCut).
   - **Owner's Google Drive link (folder with the APK), given 2026-11-13:**
     https://drive.google.com/drive/folders/1mgw3Yzi55WHVlmu9t8_v1Ri_ASpNc90T?usp=drive_link
     — use THIS for the QR. (It's a folder link: viewers open the folder, tap `OJT-Budget.apk` →
     Download. Folder must be shared "Anyone with the link".)
   - **QR on the end card (owner request):** use a QR of the owner's **Google Drive link** to
     `OJT-Budget.apk` (doesn't expire) — ask for the link if they didn't send it. Generate it
     black-on-white, large quiet zone, e.g. `npx --yes qrcode -o marketing/video/apk-qr.png -w 720 "<link>"`
     (Node `qrcode` CLI; check it scans before rendering). Fallback only: the Expo build-page QR
     the owner sent is saved at `marketing/video/expo-build-qr.png` — it **expires Nov 27, 2026 10:57 AM**
     (EAS build artifacts last 13 days), so don't use it if the video will be shared after that;
     if used, add "Valid until Nov 27" under it.
   - **Real APK:** EAS build `29b32882-2ee9-4032-a4dc-0b53f6e50e23` succeeded 2026-11-13 (APK,
     20 min build). Owner downloads it, renames to `OJT-Budget.apk`, keeps a copy on Google Drive.
   - **Captions (Taglish), FINAL order:** text card after the title (no screenshot) "I-download sa
     link, i-install (Allow → Install anyway)" · 1–2 "Get started — offline, walang account" ·
     3 "Ilagay ang pangalan mo" · 4 "Piliin ang agency mo" · 5 "Saan ka nakatira?" · 6 "OJT
     schedule: start, oras kada araw, required hours" · 7 "I-save ang route mo papuntang office" ·
     8 "Kita agad ang pamasahe (round trip)" · 9 "Isang tap lang: pagkain at pamasahe" ·
     10 "Na-log na! May Undo pa" · 11 "Bantayan ang gastos mo today" · 12 "Magkano pa ang safe
     gastusin" · 13 "Updates: buksan 8 PM–12 AM → Restart". Owner may edit captions.
   - **Tools:** ImageMagick 7 is installed (`magick`). **ffmpeg is NOT installed** — the owner
     rejected `scoop install ffmpeg` mid-step and asked for the shot list first. **Ask before
     installing ffmpeg** (`scoop install ffmpeg`). If they say no: make an animated GIF with
     ImageMagick instead (also plays in Messenger), or MP4 via another tool only with permission.
   - **Files:** save screenshots to `marketing/video/shots/01.png…14.png` and the build script
     (PowerShell + magick/ffmpeg) to `marketing/video/`; output to `marketing/video/out/`.
     Add `marketing/video/shots/` and `marketing/video/out/` to `.gitignore` (no binaries in git;
     the small QR PNGs in `marketing/video/` may be committed).
     Show the owner a few key frames (title, one step, end card) before the final render if
     anything is uncertain.
   - **Group-chat message** (already given to the owner; reuse or update with the Drive link):
     download link → install (Allow unknown apps; Play Protect → More details → Install anyway) →
     Get started → name → agency → home → schedule → Commute → New route → + tab to log →
     updates: open the app 8 PM–12 AM → Restart (or More → Settings → Check for updates) →
     "Offline, walang account, sa phone niyo lang ang data." Android only (no iPhone).

## 4. What "GO" means next session

- If the last thing given was a **STEP 1 report** → GO = build that phase (STEP 2), then STEP 3 report.
- If the last thing given was a **STEP 3 phase report** → GO = write the **next phase's
  STEP 1 report** (no code), then wait.
- **Current state (2026-11-13): Phase 4 committed + pushed (`1fd101b`), real APK built.**
  **Next GO = make the tutorial video** (§3 item 5): the owner pastes the 13 screenshots (FINAL
  shot list in §3 item 5) and says GO. Use the saved Google Drive folder link for the end-card QR.
  Ask about ffmpeg first if it's still not installed (fallback: animated GIF with ImageMagick).
  Before building, confirm the Drive folder opens without login (owner was asked to check it). Deliver the video file path + a short
  report, then STOP.
- Also pending from the owner (handle when they report): APK installs and opens → tick §6b item 6;
  phone-check fixes (ship JS fixes as an EAS Update, see §3 item 4); TEST_PLAN.md run → tick
  Phase 3 item 8; cross-fade feedback → tick §6a item 8.
- After the video, a plain GO with nothing pending = propose Phase 5 (rollout + one week of real use
  + fix round; keep data current: Eid holidays, Feb 1 Panganiban proclamation, promo end, Talisay
  hall pin) as a STEP 1 report.
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
