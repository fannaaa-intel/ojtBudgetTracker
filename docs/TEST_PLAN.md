# OJT Budget — phone test plan

Run on an Android phone with Expo Go (`npm start`, scan the QR). Do **Profile A**, then use
**Settings → Erase all data** and do **Profile B** on the same phone. Tick each line.

Automated checks for the same rules: `npm test` (`__tests__/scenarios.test.ts` covers both regions and the fare hike).

## Profile A — Metro Manila (NFRDI, Diliman)

### Register
- [ ] Welcome shows the logo, four feature rows and **Get started**
- [ ] Register → student discount **Yes** → agency **NFRDI** → home pin → start date (calendar) → hours 5 → required 300 → Finish
- [ ] Home says “Hi, <name>” and NFRDI

### Commute and fares
- [ ] Commute → New route: *Jeep (traditional)* 6 km + *MRT-3* fare 15 → round trip **₱59.00** → Save (marked Daily)
- [ ] Fare table lists LRT-1, LRT-2, MRT-3, EDSA Carousel
- [ ] Commute → Beep card → add with ₱100 → Add tab → Log today’s commute with **Trains on Beep** → card shows ₱70.00
- [ ] Beep → Top up ₱100 → Home “spent today” does **not** go up
- [ ] Save a second route (e.g. Bus) with minutes → Commute → Compare routes marks Cheapest / Fastest

### Daily logging
- [ ] Add → tap *Carinderia lunch* (₱80) → Undo works → tap again
- [ ] Add expense → Pagkain → Snacks, tag Late → Save; History shows it; edit amount; delete + Undo
- [ ] Home Today card total matches History for today

### Budgets, bills, savings
- [ ] Budget → weekly Pagkain ₱300 → log food past ₱240 (“Near limit”) and ₱300 (black “OVER”)
- [ ] Settings → Living setup → Renting, add 2 roommates → Rent ₱3,000 equal split → pay “Only my share” = ₱1,000
- [ ] Savings → emergency fund → Add money → not counted as spending

### Group features (Metro Manila only)
- [ ] More shows **Barkada & ambagan** → create barkada, 2 members → ambagan ₱900 equal, paid by me → my share ₱300 logged as Gala
- [ ] Utang shows the 2 members owing ₱300 each → tick one paid in the ambagan

### Fare hike
- [ ] Note today’s logged commute amount in History
- [ ] Commute → Update fares → Jeep → base ₱15, per km ₱2.50, effective today → Save
- [ ] Route total goes **up**; the commute already in History keeps the **old** amount
- [ ] Commute subtitle shows “Fares last checked: <today>”

### Data and settings
- [ ] More → Back up data → share sheet opens with a `.json`
- [ ] More → Total OJT cost (PDF) and All transactions (CSV) open the share sheet
- [ ] Settings → App lock → set PIN → leave the app 1+ minute → PIN screen; 5 wrong PINs → 30 s wait
- [ ] Settings → Labels → English → tabs and lists say Fare / Food / Leisure; back to Taglish
- [ ] Settings → Appearance → Dark, then Light, then Same as phone — every screen readable

## Profile B — LGU Talisay (Bicol)

- [ ] Settings → Erase all data → confirm twice → back at Welcome
- [ ] Register with agency **LGU Talisay**
- [ ] Fare table and Update fares show **no** LRT, MRT or Carousel; no Beep card row on Commute
- [ ] More has **Utang** but **no** Barkada & ambagan; Gala planner has no “split with your barkada” button
- [ ] Add → *Carinderia lunch* asks for a price first (“Set price”), then remembers it
- [ ] Rent & bills → Electricity → kWh estimate asks you to set the co-op rate first
- [ ] Route with *Provincial bus (ordinary)* 12 km (student) shows **₱22.00** one way
- [ ] Fare hike: Update fares → Bus → change per km → route re-prices, history unchanged

## Restore
- [ ] More → Restore from backup → pick Profile A’s `.json` → confirm twice → Profile A’s data is back (no PIN)
