# CLAUDE.md — rules for this repo

Read `plan.md` first: it holds the decisions, phases and checklist. Work one checklist item at a time and tick it in plan.md when done.

## Stack
Expo (React Native) + Expo Router (`src/app`) · expo-sqlite + Drizzle ORM · Zustand · TypeScript strict · Jest (jest-expo). Path alias `@/` = `src/`.

## Commands
- `npm start` — run the app · `npm test` — unit tests · `npm run typecheck`
- `npm run db:generate` — after ANY change to `src/db/schema.ts` (creates a migration in `drizzle/`; never hand-edit `drizzle/`)
- Install Expo packages with `npx expo install <pkg>` (SDK-matched), others with `npm install`

## Hard rules
1. **Money is integer centavos.** Never store or add floats of pesos. Parse with `toCentavos`, show with `formatPeso` (`src/lib/money.ts`).
2. **Never hardcode fares or prices in screens.** Read `fare_rules` / `meal_presets` from the DB; compute with `computeFare` / `computeRouteFare` (`src/lib/fare.ts`).
3. **A saved transaction keeps the amount actually paid.** Fare edits never rewrite history.
4. **Offline only.** No network calls, no analytics, no remote fonts/images.
5. **expo-sqlite is synchronous inside transactions**: use `.run() / .get() / .all()` in `db.transaction((tx) => …)`, never async callbacks.
6. **Dates are `YYYY-MM-DD` strings** in Asia/Manila; use helpers in `src/lib/dates.ts` (no `new Date('YYYY-MM-DD')` local parsing).
7. **Region rules**: user.region comes from the chosen agency. `REGION_V` (Bicol, LGU Talisay) hides MRT/LRT/Carousel and all barkada/ambagan features.
8. **Soft delete** transactions (`deleted_at`) and always filter them out of totals.

## UI rules — minimalist monochrome
- Colours only from `useTheme().colors` (black/white/greys). No hex values in components, no status colours (no red/green).
- Emphasis = contrast, weight, inverse fill. One primary (inverse) button per screen.
- Over budget → inverse chip "OVER"; near limit → outlined chip; info → `textSecondary`/`textMuted`.
- Amounts use `typography.amount` / `amountLarge` (tabular digits).
- Reuse `src/components` (AppText, Button, TextField, OptionRow, Screen). Add new shared pieces there.
- Charts: greys only; highlight one series with `colors.inverse`.
- Min touch target 48 px. Support light and dark mode.

## Code layout
- Pure logic → `src/lib` (no React, no DB) + a test in `__tests__/`.
- Feature code → `src/features/<module>/` (queries, hooks, components). Screens in `src/app` stay thin.
- Replace a tab's `TodoList` placeholder when that screen is built.
