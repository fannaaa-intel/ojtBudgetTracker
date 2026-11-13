/**
 * Drizzle schema — 26 tables. Money columns are INTEGER centavos. Dates are 'YYYY-MM-DD' text.
 * After changing this file run: npm run db:generate
 */
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const REGIONS = ['NCR', 'REGION_V'] as const; // REGION_V = Bicol (Talisay, Camarines Norte)
export type Region = (typeof REGIONS)[number];

export const THEME_PREFS = ['system', 'light', 'dark'] as const;
export type ThemePref = (typeof THEME_PREFS)[number];

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
};
const id = () => integer('id').primaryKey({ autoIncrement: true });
const bool = (name: string) => integer(name, { mode: 'boolean' });

// ── Profile and OJT ─────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: id(),
  name: text('name').notNull(),
  nickname: text('nickname'),
  school: text('school'),
  course: text('course'),
  isStudent: bool('is_student').notNull().default(true),
  region: text('region', { enum: REGIONS }).notNull(),
  pinHash: text('pin_hash'),
  themePref: text('theme_pref', { enum: THEME_PREFS }).notNull().default('system'),
  ...timestamps,
});

export const agencies = sqliteTable('agencies', {
  id: id(),
  code: text('code').notNull().unique(), // e.g. 'NFRDI'
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  province: text('province'),
  region: text('region', { enum: REGIONS }).notNull(),
  lat: real('lat'),
  lng: real('lng'),
  plusCode: text('plus_code'),
  isCustom: bool('is_custom').notNull().default(false),
  ...timestamps,
});

export const ojtProfile = sqliteTable('ojt_profile', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  agencyId: integer('agency_id').notNull().references(() => agencies.id),
  homeAddress: text('home_address').notNull(),
  homeLat: real('home_lat'),
  homeLng: real('home_lng'),
  homePlusCode: text('home_plus_code'),
  livingSetup: text('living_setup', { enum: ['home', 'renting', 'dorm'] }).notNull().default('home'),
  startDate: text('start_date').notNull(),
  hoursPerDay: real('hours_per_day').notNull().default(5),
  requiredHours: integer('required_hours'),
  workdays: text('workdays').notNull().default('1,2,3,4,5'), // 0=Sun … 6=Sat
  ...timestamps,
});

export const ojtDays = sqliteTable(
  'ojt_days',
  {
    userId: integer('user_id').notNull().references(() => users.id),
    date: text('date').notNull(),
    hours: real('hours').notNull().default(0),
    status: text('status', { enum: ['worked', 'absent', 'wfh', 'holiday'] }).notNull(),
    note: text('note'),
  },
  (t) => [primaryKey({ columns: [t.userId, t.date] }), index('ojt_days_date_idx').on(t.date)],
);

export const holidays = sqliteTable('holidays', {
  date: text('date').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['regular', 'special'] }).notNull(),
  /** null = national holiday; a region = local holiday only for users in that region (e.g. LGU Talisay). */
  region: text('region', { enum: REGIONS }),
});

// ── Commute ─────────────────────────────────────────────────────
export const fareRules = sqliteTable('fare_rules', {
  id: id(),
  region: text('region', { enum: REGIONS }).notNull(),
  mode: text('mode').notNull(), // see FARE_MODES in seed/fareRules.ts
  label: text('label').notNull(),
  baseFare: integer('base_fare').notNull().default(0),
  baseKm: real('base_km').notNull().default(0),
  perKm: integer('per_km').notNull().default(0),
  studentPct: integer('student_pct').notNull().default(0),
  promoPct: integer('promo_pct').notNull().default(0),
  roundTo: integer('round_to').notNull().default(25),
  isFixed: bool('is_fixed').notNull().default(false),
  note: text('note'),
  effectiveDate: text('effective_date').notNull(),
  source: text('source'),
  userEdited: bool('user_edited').notNull().default(false),
  ...timestamps,
});

export const routes = sqliteTable('routes', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  isDefault: bool('is_default').notNull().default(false),
  minutes: integer('minutes'),
  ...timestamps,
});

export const routeLegs = sqliteTable(
  'route_legs',
  {
    id: id(),
    routeId: integer('route_id').notNull().references(() => routes.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    fareRuleId: integer('fare_rule_id').notNull().references(() => fareRules.id),
    fromLabel: text('from_label'),
    toLabel: text('to_label'),
    kmEstimated: real('km_estimated'),
    kmActual: real('km_actual'),
    fixedFare: integer('fixed_fare'),
    discountApplies: bool('discount_applies').notNull().default(true),
  },
  (t) => [index('route_legs_route_seq_idx').on(t.routeId, t.seq)],
);

export const wallets = sqliteTable('wallets', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['cash', 'beep', 'gcash', 'bank'] }).notNull(),
  balance: integer('balance').notNull().default(0),
  ...timestamps,
});

// ── Money in and out ────────────────────────────────────────────
export const categories = sqliteTable('categories', {
  id: id(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  icon: text('icon'),
  parentId: integer('parent_id'),
  bucket: text('bucket', { enum: ['needs', 'gala', 'savings'] }).notNull(),
  isSystem: bool('is_system').notNull().default(true),
  sort: integer('sort').notNull().default(0),
});

export const transactions = sqliteTable(
  'transactions',
  {
    id: id(),
    userId: integer('user_id').notNull().references(() => users.id),
    date: text('date').notNull(),
    kind: text('kind', { enum: ['expense', 'income', 'transfer'] }).notNull(),
    amount: integer('amount').notNull(), // centavos, always positive; kind gives the sign
    categoryId: integer('category_id').references(() => categories.id),
    walletId: integer('wallet_id').references(() => wallets.id),
    routeId: integer('route_id').references(() => routes.id),
    incomeSourceId: integer('income_source_id').references(() => incomeSources.id), // income only
    savingsGoalId: integer('savings_goal_id').references(() => savingsGoals.id), // transfer into a goal
    toWalletId: integer('to_wallet_id').references(() => wallets.id), // transfer between wallets (Beep top-up)
    tags: text('tags'), // comma-separated: late,rainy,baon
    note: text('note'),
    isOneTime: bool('is_one_time').notNull().default(false),
    deletedAt: text('deleted_at'),
    ...timestamps,
  },
  (t) => [index('tx_date_idx').on(t.date), index('tx_category_idx').on(t.categoryId)],
);

export const incomeSources = sqliteTable('income_sources', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  amount: integer('amount').notNull(),
  frequency: text('frequency', { enum: ['weekly', 'semi_monthly', 'monthly', 'once'] }).notNull(),
  nextDate: text('next_date'),
  ...timestamps,
});

export const budgets = sqliteTable('budgets', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').references(() => categories.id), // null = overall
  period: text('period', { enum: ['daily', 'weekly', 'monthly'] }).notNull(),
  limitAmount: integer('limit_amount').notNull(),
  rollover: bool('rollover').notNull().default(false),
  ...timestamps,
});

export const mealPresets = sqliteTable('meal_presets', {
  id: id(),
  source: text('source', { enum: ['baon', 'carinderia', 'fast_food', 'food_court', 'delivery', 'snack', 'coffee'] }).notNull(),
  label: text('label').notNull(),
  price: integer('price').notNull(),
  region: text('region', { enum: REGIONS }),
  sort: integer('sort').notNull().default(0),
});

// ── Bills and living ────────────────────────────────────────────
export const recurringBills = sqliteTable('recurring_bills', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  amount: integer('amount').notNull(),
  dueDay: integer('due_day').notNull(), // 1-31
  isVariable: bool('is_variable').notNull().default(false), // e.g. electricity
  /** Roommate split: none, equal (everyone incl. me), or custom amounts in bill_shares. */
  splitMode: text('split_mode', { enum: ['none', 'equal', 'custom'] }).notNull().default('none'),
  ...timestamps,
});

export const billPayments = sqliteTable('bill_payments', {
  id: id(),
  billId: integer('bill_id').notNull().references(() => recurringBills.id, { onDelete: 'cascade' }),
  period: text('period').notNull(), // 'YYYY-MM'
  amount: integer('amount').notNull(),
  paidAt: text('paid_at'),
  transactionId: integer('transaction_id').references(() => transactions.id), // the expense logged when paid
});

export const roommates = sqliteTable('roommates', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
});

export const billShares = sqliteTable(
  'bill_shares',
  {
    billId: integer('bill_id').notNull().references(() => recurringBills.id, { onDelete: 'cascade' }),
    roommateId: integer('roommate_id').notNull().references(() => roommates.id, { onDelete: 'cascade' }),
    share: integer('share').notNull(),
    paidAt: text('paid_at'),
  },
  (t) => [primaryKey({ columns: [t.billId, t.roommateId] })],
);

/** Whether a roommate paid their share of a bill for one month. */
export const billSharePayments = sqliteTable(
  'bill_share_payments',
  {
    billId: integer('bill_id').notNull().references(() => recurringBills.id, { onDelete: 'cascade' }),
    roommateId: integer('roommate_id').notNull().references(() => roommates.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // 'YYYY-MM'
    paidAt: text('paid_at').notNull(),
  },
  (t) => [primaryKey({ columns: [t.billId, t.roommateId, t.period] })],
);

// ── Food, essentials, goals ─────────────────────────────────────
export const groceryItems = sqliteTable('grocery_items', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  unit: text('unit'),
  lastPrice: integer('last_price'),
  updatedAt: text('updated_at'),
  /** Price paid the time before lastPrice (for "₱5 more than last time"). */
  prevPrice: integer('prev_price'),
  onList: bool('on_list').notNull().default(false),
  /** Ticked in the cart during a shopping trip, with the price typed in the store. */
  inCart: bool('in_cart').notNull().default(false),
  cartPrice: integer('cart_price'),
  /** Staples (rice, oil, eggs) get a "runs out in N days" countdown. */
  isStaple: bool('is_staple').notNull().default(false),
  lastsDays: integer('lasts_days'),
  lastBought: text('last_bought'),
});

export const restockItems = sqliteTable('restock_items', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  lastBought: text('last_bought'),
  lastsDays: integer('lasts_days').notNull(),
  typicalPrice: integer('typical_price'),
  kind: text('kind', { enum: ['restock', 'laundry', 'load', 'health', 'grooming'] }).notNull().default('restock'),
  categoryId: integer('category_id').references(() => categories.id),
});

export const savingsGoals = sqliteTable('savings_goals', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  target: integer('target').notNull(),
  saved: integer('saved').notNull().default(0),
  deadline: text('deadline'),
  isEmergencyFund: bool('is_emergency_fund').notNull().default(false),
});

export const debts = sqliteTable('debts', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  person: text('person').notNull(),
  amount: integer('amount').notNull(),
  direction: text('direction', { enum: ['owed_to_me', 'i_owe'] }).notNull(),
  note: text('note'),
  settledAt: text('settled_at'),
  /** Set when this debt was created by an ambagan someone else paid for. */
  ambaganId: integer('ambagan_id'),
  ...timestamps,
});

// ── App settings (key → value; e.g. electricity rate, reminder times, fares checked date) ──
export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// ── Barkada (group features: only when the barkada's region matches the user's) ──
export const barkada = sqliteTable('barkada', {
  id: id(),
  userId: integer('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  region: text('region', { enum: REGIONS }).notNull(),
});

export const barkadaMembers = sqliteTable('barkada_members', {
  id: id(),
  barkadaId: integer('barkada_id').notNull().references(() => barkada.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const ambagan = sqliteTable('ambagan', {
  id: id(),
  barkadaId: integer('barkada_id').notNull().references(() => barkada.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // e.g. "Gala SM North", "Christmas party"
  date: text('date').notNull(),
  total: integer('total').notNull(),
  splitMode: text('split_mode', { enum: ['equal', 'custom'] }).notNull().default('equal'),
  kind: text('kind', { enum: ['gala', 'party', 'gift', 'other'] }).notNull().default('gala'),
  /** 'me' or the member name who paid the whole amount. */
  paidBy: text('paid_by').notNull().default('me'),
  /** My share, logged as an expense. */
  transactionId: integer('transaction_id').references(() => transactions.id),
});

export const ambaganShares = sqliteTable(
  'ambagan_shares',
  {
    ambaganId: integer('ambagan_id').notNull().references(() => ambagan.id, { onDelete: 'cascade' }),
    memberName: text('member_name').notNull(),
    share: integer('share').notNull(),
    paidAt: text('paid_at'),
  },
  (t) => [primaryKey({ columns: [t.ambaganId, t.memberName] })],
);
