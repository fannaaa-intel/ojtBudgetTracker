import { Redirect } from 'expo-router';
import { db } from '@/db/client';
import { users } from '@/db/schema';

/** One profile per phone: registered → tabs, otherwise → onboarding. */
export default function Index() {
  const user = db.select({ id: users.id }).from(users).limit(1).get();
  return <Redirect href={user ? '/(tabs)' : '/onboarding'} />;
}
