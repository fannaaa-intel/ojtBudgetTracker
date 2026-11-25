/**
 * Budget envelopes: per parent category (or overall), weekly or monthly, optional rollover.
 * A parent envelope counts spending in all its child categories. Soft-deleted rows never count.
 */
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { budgets, categories } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import {
  budgetStatus,
  countedDays,
  countsDay,
  dailyShare,
  daysLeftInPeriod,
  effectiveDays,
  periodRange,
  previousPeriodRange,
  progressPct,
  rolloverCarry,
  type BudgetDays,
  type BudgetPeriod,
  type BudgetStatus,
  type DateRange,
  type DutySchedule,
} from '@/lib/budget';
import { addDays, todayManila, type ISODate } from '@/lib/dates';
import { parseWorkdays } from '@/lib/ojt';
import { getHolidayMap } from '../ojt/queries';
import { getProfile } from '../profile/queries';
import { categoryFamilyIds, sumAmount, sumAmountOnDates } from '../transactions/queries';

export type BudgetRow = typeof budgets.$inferSelect;
export type BudgetInput = { categoryId: number | null; period: BudgetPeriod; limitAmount: number; rollover: boolean; days: BudgetDays };

/** Duty days come from the OJT schedule and holidays, so those tables are watched too. */
export const BUDGET_TABLES = ['budgets', 'transactions', 'categories', 'ojt_profile', 'holidays', 'users'] as const;

/** The intern's duty days: OJT workdays (default Mon–Fri) minus their region's holidays. */
export function getDutySchedule(): DutySchedule {
  const p = getProfile();
  return {
    workdays: p ? parseWorkdays(p.profile.workdays) : [1, 2, 3, 4, 5],
    holidays: new Set(getHolidayMap(p?.user.region ?? null).keys()),
  };
}

export function getBudget(id: number): BudgetRow | undefined {
  return db.select().from(budgets).where(eq(budgets.id, id)).get();
}

/** Another budget for the same category + period, if any (one envelope each). */
export function findDuplicateBudget(input: Pick<BudgetInput, 'categoryId' | 'period'>, exceptId?: number): BudgetRow | undefined {
  return db
    .select()
    .from(budgets)
    .where(and(input.categoryId == null ? isNull(budgets.categoryId) : eq(budgets.categoryId, input.categoryId), eq(budgets.period, input.period)))
    .all()
    .find((b) => b.id !== exceptId);
}

export function saveBudget(userId: number, id: number | undefined, input: BudgetInput): number {
  const row = { ...input, days: effectiveDays(input.period, input.days) };
  if (id == null) return db.insert(budgets).values({ userId, ...row }).returning({ id: budgets.id }).get().id;
  db.update(budgets).set(row).where(eq(budgets.id, id)).run();
  return id;
}

export function deleteBudget(id: number): void {
  db.delete(budgets).where(eq(budgets.id, id)).run();
}

// ── Progress ───────────────────────────────────────────────────

export type BudgetProgress = {
  budget: BudgetRow;
  name: string;
  categoryKey: string | null;
  range: DateRange;
  /** 'duty' = only duty-day spending counts (weekly budgets); 'all' = every day. */
  days: BudgetDays;
  /** Category ids it counts (undefined = all spending). */
  ids: number[] | undefined;
  carry: number;
  available: number;
  /** Spending on the days this budget counts. */
  spent: number;
  /** Duty-day budgets: spending this period on weekends / days off (not counted). 0 otherwise. */
  offDaySpent: number;
  left: number;
  status: BudgetStatus;
  pct: number;
};

function spendIn(range: DateRange, categoryIds: number[] | undefined): number {
  return sumAmount('expense', range.from, range.to, categoryIds);
}

/** Spending in a range on the days a budget counts. */
function spendCounted(days: BudgetDays, range: DateRange, ids: number[] | undefined, s: DutySchedule): number {
  if (range.from > range.to) return 0;
  return days === 'all' ? spendIn(range, ids) : sumAmountOnDates('expense', countedDays(days, range.from, range.to, s), ids);
}

export function listBudgetProgress(today: ISODate = todayManila(), schedule: DutySchedule = getDutySchedule()): BudgetProgress[] {
  const rows = db
    .select({ budget: budgets, name: categories.name, key: categories.key, sort: categories.sort })
    .from(budgets)
    .leftJoin(categories, eq(categories.id, budgets.categoryId))
    .orderBy(asc(budgets.period), asc(categories.sort), asc(budgets.id))
    .all();

  return rows.map(({ budget, name, key }) => {
    const ids = budget.categoryId == null ? undefined : categoryFamilyIds(budget.categoryId);
    const period: BudgetPeriod = budget.period === 'monthly' ? 'monthly' : 'weekly';
    const days = effectiveDays(period, budget.days);
    const range = periodRange(period, today);
    const prev = previousPeriodRange(period, today);
    // Rollover: last period's leftover on the days it counted (duty days for a duty budget).
    const carry = rolloverCarry(budget.rollover, budget.limitAmount, spendCounted(days, prev, ids, schedule));
    const available = budget.limitAmount + carry;
    const spent = spendCounted(days, range, ids, schedule);
    const offDaySpent = days === 'duty' ? spendIn(range, ids) - spent : 0;
    return {
      budget,
      name: name ?? 'All spending',
      categoryKey: key ?? null,
      range,
      days,
      ids,
      carry,
      available,
      spent,
      offDaySpent,
      left: available - spent,
      status: budgetStatus(spent, available),
      pct: progressPct(spent, available),
    };
  });
}

export function useBudgetProgress() {
  return useDbQuery(() => listBudgetProgress(), BUDGET_TABLES);
}

export type SafeToSpendInfo =
  | {
      kind: 'limit';
      period: BudgetPeriod;
      /** 'duty' = duty days left this week; 'week' / 'month' = calendar days left. */
      daysLabel: 'duty' | 'week' | 'month';
      dailyLimit: number;
      spentToday: number;
      left: number;
      daysLeft: number;
      available: number;
    }
  | {
      /** Today is a weekend / day off and every budget in play covers duty days only: no fixed limit. */
      kind: 'off_day';
      spentToday: number;
      /** This week's spending on days off (weekends, holidays) in those budgets. */
      offDaySpent: number;
      /** What is left of the duty-day budget this week (negative = over). */
      dutyLeft: number;
    };

const idsOf = (ps: BudgetProgress[]): number[] | undefined =>
  ps.some((p) => p.ids === undefined) ? undefined : [...new Set(ps.flatMap((p) => p.ids!))];

/**
 * Safe to spend today. Uses weekly budgets when any exist, otherwise monthly ones.
 * Within that period: the overall ("All spending") budget if there is one, otherwise the
 * category envelopes. Only envelopes that count today are used (a duty-day budget is skipped on a
 * weekend). Envelopes with the same days are pooled, so overspending one lowers the shared limit.
 * undefined = no budget at all yet.
 */
export function getSafeToSpend(today: ISODate = todayManila(), schedule: DutySchedule = getDutySchedule()): SafeToSpendInfo | undefined {
  const all = listBudgetProgress(today, schedule);
  const weekly = all.filter((p) => p.budget.period === 'weekly');
  const period: BudgetPeriod = weekly.length > 0 ? 'weekly' : 'monthly';
  const inPeriod = weekly.length > 0 ? weekly : all.filter((p) => p.budget.period === 'monthly');
  if (inPeriod.length === 0) return undefined;
  const overall = inPeriod.find((p) => p.budget.categoryId == null);
  const envelopes = overall ? [overall] : inPeriod;
  const todayOnly = { from: today, to: today };

  const active = envelopes.filter((p) => countsDay(p.days, today, schedule));
  if (active.length === 0) {
    return {
      kind: 'off_day',
      spentToday: spendIn(todayOnly, idsOf(envelopes)),
      offDaySpent: envelopes.reduce((s, p) => s + p.offDaySpent, 0),
      dutyLeft: envelopes.reduce((s, p) => s + p.left, 0),
    };
  }

  let dailyLimit = 0;
  let available = 0;
  let dutyDaysLeft = 0;
  for (const days of ['all', 'duty'] as const) {
    const group = active.filter((p) => p.days === days);
    if (group.length === 0) continue;
    const { from, to } = group[0].range;
    const ids = idsOf(group);
    const groupAvailable = group.reduce((s, p) => s + p.available, 0);
    const spentBefore = spendCounted(days, { from, to: addDays(today, -1) }, ids, schedule);
    const daysLeft = countedDays(days, today, to, schedule).length;
    if (days === 'duty') dutyDaysLeft = daysLeft;
    dailyLimit += dailyShare(groupAvailable, spentBefore, daysLeft);
    available += groupAvailable;
  }
  const spentToday = spendIn(todayOnly, idsOf(active));
  const onlyDuty = active.every((p) => p.days === 'duty');
  return {
    kind: 'limit',
    period,
    daysLabel: onlyDuty ? 'duty' : period === 'weekly' ? 'week' : 'month',
    dailyLimit,
    spentToday,
    left: dailyLimit - spentToday,
    daysLeft: onlyDuty ? dutyDaysLeft : daysLeftInPeriod(period, today),
    available,
  };
}

export function useSafeToSpend() {
  return useDbQuery(() => getSafeToSpend(), BUDGET_TABLES);
}
