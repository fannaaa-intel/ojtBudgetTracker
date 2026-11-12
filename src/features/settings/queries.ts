import { eq, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { agencies, ojtProfile, users, type ThemePref } from '@/db/schema';
import type { ScheduleValues } from '@/lib/profile';
import { useThemePref } from '@/store/theme';

const now = sql`(datetime('now'))`;

export type ProfileInput = { name: string; nickname: string; school: string; course: string; isStudent: boolean };

export function updateProfile(userId: number, p: ProfileInput): void {
  db.update(users)
    .set({
      name: p.name.trim(),
      nickname: p.nickname.trim() || null,
      school: p.school.trim() || null,
      course: p.course.trim() || null,
      isStudent: p.isStudent,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .run();
}

/** Change agency. user.region always follows the agency (CLAUDE.md rule 7). */
export function updateAgency(userId: number, agencyId: number): void {
  const agency = db.select().from(agencies).where(eq(agencies.id, agencyId)).get();
  if (!agency) throw new Error('Agency not found');
  db.transaction((tx) => {
    tx.update(ojtProfile).set({ agencyId, updatedAt: now }).where(eq(ojtProfile.userId, userId)).run();
    tx.update(users).set({ region: agency.region, updatedAt: now }).where(eq(users.id, userId)).run();
  });
}

export function updateSchedule(userId: number, v: ScheduleValues): void {
  db.update(ojtProfile)
    .set({ startDate: v.startDate, hoursPerDay: v.hoursPerDay, requiredHours: v.requiredHours, updatedAt: now })
    .where(eq(ojtProfile.userId, userId))
    .run();
}

/** Save Light / Dark / System and switch the app immediately. */
export function updateThemePref(userId: number, pref: ThemePref): void {
  db.update(users).set({ themePref: pref, updatedAt: now }).where(eq(users.id, userId)).run();
  useThemePref.getState().setPref(pref);
}
