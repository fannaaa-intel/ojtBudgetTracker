import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { agencies, ojtProfile, users } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';

/** The one registered intern on this phone, with OJT profile and agency. */
export function getProfile() {
  return db
    .select({ user: users, profile: ojtProfile, agency: agencies })
    .from(users)
    .innerJoin(ojtProfile, eq(ojtProfile.userId, users.id))
    .innerJoin(agencies, eq(agencies.id, ojtProfile.agencyId))
    .limit(1)
    .get();
}

export type Profile = NonNullable<ReturnType<typeof getProfile>>;

export const PROFILE_TABLES = ['users', 'ojt_profile', 'agencies'] as const;

export function useProfile(): Profile | undefined {
  return useDbQuery(getProfile, PROFILE_TABLES);
}

/** For write paths: the current user id, or an error if nobody has registered. */
export function requireUserId(): number {
  const p = getProfile();
  if (!p) throw new Error('No registered user on this phone');
  return p.user.id;
}
