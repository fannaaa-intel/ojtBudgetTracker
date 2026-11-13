# OJT Budget Tracker — Build Plan

Offline-first mobile app for OJT interns to track commute fares, food, rent/bills, gala and every other necessity, and to see the total cost of their OJT.

Last updated: 2026-11-12 · Spec doc: "OJT Budget Tracker – Final Features & Recommendations" (Claude doc)

---

## 1. Decisions (settled — do not re-ask)

| Topic | Decision |
|---|---|
| Users | 6 interns at 4 agencies. Each intern **registers** on their own phone and **chooses their agency** from the list. No pre-made profiles. |
| Agencies | NFRDI, Diliman QC (2 interns) · LGU Talisay, Camarines Norte, **Bicol** (1) · ITC Bldg, Gil Puyat Ave, Makati (2) · LANDBANK Plaza, Malate, Manila (1) |
| Regions | `NCR` (Metro Manila) for 3 agencies; `REGION_V` (Bicol) for LGU Talisay only |
| Group features | Ambagan, group gala, shared Christmas party/exchange gift: **Metro Manila interns only**. Hidden when the user's region ≠ the barkada's region (Talisay intern = solo gala). |
| OJT schedule | Start Nov 9, 2026 · 5 hours/day · Mon–Fri · editable per user |
| Platform | React Native via **Expo** (Expo Router), Android first |
| Database | **SQLite on device** (expo-sqlite) + **Drizzle ORM**. No server, no account, no internet. |
| Money | **Integer centavos** everywhere (₱14.00 = `1400`). Format only at display. |
| Fares | Editable defaults seeded from the rates in force since **Sept 28, 2026**. Never hardcode fares in screens. |
| Discounts | Student: 20% jeep/bus, 50% LRT/MRT single ticket. LRT-2/MRT-3: 50% promo for all "until further notice" (switchable flag). Discounts never stack — take the larger. |
| Rounding | Formula fares round to the nearest ₱0.25 (as posted matrices do). |
| Theme | **Minimalist monochrome**: black, white, greys only. Emphasis by contrast/weight/inverse fill, never colour. Light + dark mode. |
| Language | English UI with Taglish labels (Pamasahe, Pagkain, Baon, Gala, Utang, Ambagan) |

---

## 2. Folder map

```
ojt-budget-tracker/
├── plan.md                  ← this file
├── CLAUDE.md                ← rules for Claude Code
├── README.md                ← quick start
├── package.json · app.json · tsconfig.json · babel.config.js · metro.config.js · drizzle.config.ts
├── scripts/setup.sh         ← installs SDK-matched packages + generates the first migration
├── drizzle/                 ← generated migrations (npm run db:generate) — do not hand-edit
├── __tests__/               ← jest tests for src/lib (fare, money, distance, dates)
└── src/
    ├── app/                 ← Expo Router screens
    │   ├── _layout.tsx      ← runs migrations + seed, then renders the app
    │   ├── index.tsx        ← redirect: registered → (tabs), else → onboarding
    │   ├── onboarding/      ← welcome → register → agency → home → schedule  ✅ built
    │   └── (tabs)/          ← Home · Commute · Add (+) · Budget · More  (placeholders)
    ├── components/          ← AppText, Button, TextField, OptionRow, Screen, StepIndicator, TodoList
    ├── db/
    │   ├── schema.ts        ← 26 tables
    │   ├── client.ts        ← expo-sqlite + drizzle instance
    │   └── seed/            ← agencies, fareRules, categories, mealPresets, holidays, seedIfEmpty()
    ├── lib/                 ← pure logic, no React: fare.ts, money.ts, distance.ts, dates.ts  ✅ tested
    ├── store/               ← zustand stores (onboarding draft)
    └── theme/               ← monochrome tokens + useTheme()
```

Add new feature code as `src/features/<module>/` (queries, hooks, components) and keep screens in `src/app` thin.

---

## 3. Phase 0 — Setup (do first)

```bash
npm install          # installs Expo
npm run setup        # SDK-matched packages, dev tools, first migration (drizzle/)
npm test             # 19 tests should pass
npm start            # scan the QR with Expo Go, or press a for Android
```

Acceptance: app opens → Welcome → Register → choose agency → home → schedule → Finish → lands on Home tab showing "Hi, <name>" and the agency.

If `npm run setup` fails on a version conflict: `npx expo install --fix`, then rerun `npx drizzle-kit generate`.

---

## 4. Phase 1 — MVP: log money, commute, food, budget

Goal: a usable, demo-ready app. Every task lists where it lives.

- [x] Project structure, theme, components
- [x] Schema (26 tables) + seed (4 agencies, fare rules, categories, meal presets, holidays)
- [x] Fare calculator, money, distance (Plus Code offline), dates — with tests
- [x] Onboarding: register → choose agency → home address/pin + living setup → OJT schedule → save
- [x] **Date picker** in onboarding/schedule (`@react-native-community/datetimepicker`, install with `npx expo install`)
- [x] **Transactions**: add / edit / soft delete with undo snackbar · category picker (parent → child) · wallet · tags (`late`, `rainy`, `baon`) · `src/features/transactions/`
- [x] **Add tab** (`src/app/(tabs)/add.tsx`): meal preset chips (one tap logs a Pagkain expense) · "Log today's commute" (default route, round trip) · Expense form · Income form
- [x] **Saved routes + route editor** (`src/features/commute/`): legs ordered by `seq`, each leg = fare rule + km (estimated/actual) or fixed fare + discount toggle; live total via `computeRouteFare`; mark one route default
- [x] **Fare table screen**: list `fare_rules` for the user's region, edit base/per-km/promo, sets `user_edited = true`; banner "Fares last checked: Sept 28, 2026"
- [x] **Income sources + pay schedule** (weekly / 15th & 30th / monthly); "days until next allowance"
- [x] **Budgets**: weekly/monthly envelopes per category, rollover on/off, "safe to spend today" = (week budget − spent this week) ÷ days left; chips at 80% (outlined) and 100% ("OVER", inverse)
- [x] **Home tab**: Today (spent vs daily limit), This week (food left, gala left), This month (bills due placeholder)
- [x] **Settings** (More tab): edit profile, agency, student discount, hours/day, required hours · **Appearance: System / Light / Dark** (`users.theme_pref`) · no white flash at launch in dark mode (themed splash + root background)
- [x] **Backup export**: all tables → JSON → share sheet (`expo-file-system` + `expo-sharing`)

Acceptance: an intern can register, set up their route once, log a full day (commute + lunch + snack) in under 30 seconds, and see today's and this week's totals update.

---

## 5. Phase 2 — OJT layer and living costs

- [x] OJT hours log per day (worked / absent / WFH / holiday); auto-skip holidays from `holidays`
- [x] Projected end date (`projectEndDate`), cost per OJT day, cost per OJT hour, projected total cost to finish
- [x] Recurring bills (rent, electricity, water, Wi-Fi, LPG) with due-day reminders; electricity estimator kWh × rate (default ₱15.06/kWh Meralco Oct 2026, editable; Bicol = user's co-op rate)
- [x] Roommate split for bills (equal/custom, paid status) — shown when living setup = renting/dorm
- [x] Gala allowance (weekly) + gala planner (fare from saved rules + food + activity)
- [x] Essentials: restock reminders, laundry, load expiry, health, grooming, OJT requirements (one-time tag)
- [x] Savings goals + emergency fund (default target = 1 month of necessities)
- [x] Reports: charts by category and period — simple View-based bar charts (no chart library; decided Nov 12, 2026), monochrome greys only
- [x] Local notifications (`expo-notifications`): 7 PM log reminder, bills, budgets, restock · OJT-hours-not-logged reminder (6 PM workdays)
- [x] Fare update screen: bulk edit a mode; 90-day "check fares" reminder; past transactions never change

---

## 6. Phase 3 — Extras and polish

- [x] Grocery list with last-price memory + price-increase note; rice/staples tracker
- [x] Barkada + ambagan / group gala split + utang tracker — **only when barkada.region = user.region** (hidden for LGU Talisay)
- [x] Beep card wallet; route compare (cost vs minutes)
- [x] "Total OJT cost" report → CSV / PDF (`expo-print`)
- [x] Backup import / restore
- [x] PIN / fingerprint lock (`expo-local-authentication`)
- [x] Taglish label toggle
- [ ] Test on a Metro Manila profile and the Talisay (Bicol) profile, including a fare-hike update — automated scenarios ✅ (`__tests__/scenarios.test.ts`), Settings → Erase all data ✅; **phone run pending: `docs/TEST_PLAN.md`**

---

## 6a. UI pass — space and motion (owner request Nov 12, 2026; follows HANDOFF §6)

STEP 1 report Nov 13, 2026 → GO → built Nov 13 (items 1–7). No new packages (RN `Animated`), no schema change.
Owner accepted the recommendations (Nov 13): OJT cost rows move from Home to the OJT screen · motion on first mount only · Today card shows top 3 categories as rows · More tab = icon + title + one short line. Welcome screen showcase added at owner's request.

- [x] Motion foundation: `src/lib/motion.ts` (durations, easing, stagger, count-up maths) + test · shared `useReduceMotion()` hook
- [x] New shared pieces: `Appear` (fade + rise, stagger), `AnimatedAmount` (count-up), `IconBadge`, `EmptyState`
- [x] Upgrade shared pieces: ListRow (icon, press-shrink, no font shrinking, 1-line subtitle), Section spacing, animated ProgressBar / BarChart / HBarRow, press-shrink Chip / Button, Snackbar slides up
- [x] Welcome (Get started) as a showcase: hero, animated app preview (amounts from seeded `meal_presets`, never hardcoded), swipeable feature slides with page dots, trust pills
- [x] Tab screens: Home, Add, Commute, Budget, More
- [x] List screens: History, Reports, OJT, Bills, Income, Savings, Essentials, Grocery, Utang, Barkada, Beep, Settings
- [x] Detail / form screens: trim copy, replace "·"-joined subtitles (code pass done; **owner to check on the phone at 360 dp + 130% font**)
- [ ] Theme cross-fade tuning (`ThemeFade.tsx`) — kept at 450 ms; **waiting for owner feedback**

---

## 6b. Phase 4 — real phones and loose ends (STEP 1 Nov 13 → GO → items 1–5 built Nov 13; item 6 waits for an Expo account)

- [x] Seed top-up for installed phones (+ `holidays.region` column, migration 0010; local holidays only for their region): add missing holidays (by date) and agency pins (by code); never touch user-edited fares or meal prices · `src/lib/seedTopUp.ts` + test
- [x] 2027 holidays: Proclamation 1427 s. 2026 (owner confirmed "save all") + Camarines Norte for the Talisay intern: Sept 28 Vinzons Day (RA 6720) and Feb 1 Panganiban Day (RA 11445, proclaimed yearly). Town fiesta not added (no proclamation found)
- [x] Agency pins saved (looked up Nov 13 at owner's request; `encodePlusCode` added + tested): ITC Bldg 14.5626, 121.0231 (Waze, building-level) · LANDBANK Plaza 14.5726, 120.9829 (Structurae, building-level) · LGU Talisay 14.1371, 122.9256 (PhilAtlas, town centre — hall is in Poblacion, within a few hundred m) · save lat/lng + derived Plus Codes · test each lies inside its city
- [x] Savings withdrawals ("Take out" → transfer back to Cash, never spending, ≤ saved) + tests — no schema change (`to_wallet_id` set = out of the goal)
- [x] Accessibility pass: big text styles capped (display/amountLarge 1.3×, title 1.4×, label 1.6×; body unlimited) · rows read as one sentence with status · row actions for TalkBack (Essentials "Bought") · headers marked · chart rows spoken — **owner to check on the phone (largest font + TalkBack)**
- [ ] Shareable preview APK via EAS — **setup done Nov 13**: project @sersi07/ojt-budget-tracker linked (`app.json` owner + projectId), `eas.json` preview = APK, `expo-notifications` plugin + white `assets/notification-icon.png`, version 0.2.0 / versionCode 2, `expo-font` added (needed outside Expo Go), SDK patch fixes, `expo-doctor` 20/20. **Waiting: owner runs `npx eas-cli build -p android --profile preview` and installs the APK** (tick when it installs and opens)

- [x] App updates (added Nov 13 at owner's request, **before the first APK**): `expo-updates` / EAS Update, channel `preview`, runtime = app version. Auto check only 8 PM–12 AM Manila when the app is open (max every 30 min) → downloads → "Update ready · Restart" snackbar; Settings → Check for updates any time. CLAUDE.md rule 4 now allows this one exception.

### Revisions after the first APK
Normally shipped as app updates (EAS Update). The two below went into a **fresh APK (versionCode 4)** at the owner's request instead.
- [x] Nov 13: **Usual trip per route** — Round trip (default) or One way, chosen in the route editor (`routes.trip`, migration 0011). Commute tab shows that fare + a chip; the Add tab's one-tap log starts on it (the other can still be picked); Beep "trips left" follows it. Compare routes stays round trip.
- [x] Nov 13: **Keyboard never covers inputs (whole app)** — `Screen` wraps content in a KeyboardAvoidingView (padding, offset measured from the window; Android is edge-to-edge so the window no longer resizes) and scrolls the focused field into view on keyboard show, on layout shrink and on focus (`TextField` → `useRevealFocusedInput`). AmountPrompt uses padding on Android too.

Owner answers (Nov 13): scope 1–6 in order · holidays as above · Expo account later · custom agency stays not allowed (recommended).
Not now: multiple Beep cards, DB-level test harness, custom agency, promo end (already a switch).

---

## 7. Reference defaults (already in `src/db/seed/`)

**Fares (NCR, since 2026-09-28)** — traditional jeep ₱14 first 4 km + ₱2/km (student ₱11.25) · modern jeep ₱17 + ₱2.40/km · city bus ordinary ₱15 first 5 km + ₱2.49/km · aircon/EDSA Carousel ₱18 + ₱2.98/km · UV ₱2.60 / ₱3.00 per km (provisional) · LRT-1 ₱16.25 + ₱1.47/km · LRT-2/MRT-3 station matrix with 50% promo · tricycle per LGU · Grab actual.
**Fares (Bicol)** — provincial bus ordinary ₱12 first 5 km + ₱2.20/km, aircon ₱2.45/km · jeep (verify local) · tricycle per Talisay ordinance.
**Meals (NCR)** — carinderia ₱80 · fast food ₱150 · food court ₱300 · merienda ₱40 · baon ₱0. Bicol: user sets.
**Holidays in OJT period** — Nov 30, Dec 8, Dec 24, Dec 25, Dec 30, Dec 31 (2026), Jan 1 (2027). Add the 2027 list when released.

---

## 8. Open questions

- [x] Google Maps pin / Plus Code for **LGU Talisay, ITC Bldg, LANDBANK Plaza** → filled Nov 13, 2026 (Talisay = town centre; replace with the hall's exact pin if the intern sends one)
- [ ] Required OJT hours per intern (each enters it in onboarding or Settings)
- [ ] Custom agency option for interns not in the list? (currently not allowed)
- [ ] When the LRT-2/MRT-3 50% promo ends → switch `promo_pct` to 0 for `lrt2`, `mrt3`

---

## 9. Working with Claude Code

Do one phase at a time, one checklist item per request, and tick it here when done.

Example prompts:
- "Read plan.md and CLAUDE.md. Do Phase 0 and tell me if anything fails."
- "Phase 1: build the Add tab meal preset chips. One tap inserts a Pagkain → Meals expense for today. Follow CLAUDE.md."
- "Phase 1: build saved routes + route editor in src/features/commute using computeRouteFare. Add tests for the route total."
- "Mark the finished Phase 1 items in plan.md."
