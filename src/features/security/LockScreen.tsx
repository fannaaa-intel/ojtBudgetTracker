import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, Logo, PinPad } from '@/components';
import { lockoutLeft, MAX_TRIES } from '@/lib/pin';
import { useLock } from '@/store/lock';
import { useTheme } from '@/theme';
import { eraseAllData, saveSafetyBackup } from '../backup/restore';
import { biometricAvailable, biometricEnabled, biometricUnlock, checkPin, getFailures, getPinRecord, recordFailure, resetFailures } from './lock';

/** Full-screen lock: PIN pad, optional fingerprint, 30 s wait after 5 wrong tries, "Forgot PIN". */
export function LockScreen() {
  const { colors, spacing } = useTheme();
  const setLocked = useLock((s) => s.setLocked);
  const [record] = useState(() => getPinRecord());
  const [value, setValue] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [wait, setWait] = useState(() => lockoutLeft(getFailures().n, getFailures().at, Date.now()));
  const [canBio, setCanBio] = useState(false);

  const unlock = useCallback(() => {
    resetFailures();
    setLocked(false);
  }, [setLocked]);

  const tryBiometric = useCallback(async () => {
    if (await biometricUnlock()) unlock();
  }, [unlock]);

  useEffect(() => {
    if (!record) {
      setLocked(false);
      return;
    }
    (async () => {
      const ok = biometricEnabled() && (await biometricAvailable());
      setCanBio(ok);
      if (ok && lockoutLeft(getFailures().n, getFailures().at, Date.now()) === 0) tryBiometric();
    })();
  }, [record, setLocked, tryBiometric]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setInterval(() => setWait(lockoutLeft(getFailures().n, getFailures().at, Date.now())), 1000);
    return () => clearInterval(t);
  }, [wait]);

  useEffect(() => {
    if (!record || value.length < record.length) return;
    (async () => {
      if (await checkPin(value)) return unlock();
      const f = recordFailure();
      setValue('');
      const left = lockoutLeft(f.n, f.at, Date.now());
      if (left > 0) {
        setWait(left);
        setMessage(null);
      } else setMessage(`Wrong PIN · ${MAX_TRIES - f.n} ${MAX_TRIES - f.n === 1 ? 'try' : 'tries'} left`);
    })();
  }, [value, record, unlock]);

  function forgot() {
    Alert.alert(
      'Forgot your PIN?',
      'The only way in is to erase this app’s data and start over. A copy of your data is saved to a file first, and you can restore it later (the restored copy has no PIN).',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase and start over',
          style: 'destructive',
          onPress: () => {
            const file = saveSafetyBackup('before-erase');
            eraseAllData();
            setLocked(false);
            router.replace('/onboarding');
            Alert.alert('Data erased', `Your old data was saved as ${file} in the app’s documents folder. Register again, then use More → Restore from backup.`);
          },
        },
      ],
    );
  }

  if (!record) return null;
  const locked = wait > 0;

  return (
    <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, zIndex: 100, elevation: 100 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Logo size={48} />
          <AppText variant="title">Enter your PIN</AppText>
          <AppText variant="caption" tone={message ? 'default' : 'secondary'} accessibilityLiveRegion="polite">
            {locked ? `Too many tries. Try again in ${Math.ceil(wait / 1000)} s.` : (message ?? 'OJT Budget is locked.')}
          </AppText>
        </View>
        <PinPad value={value} onChange={setValue} dots={record.length} disabled={locked} onBiometric={canBio ? tryBiometric : undefined} />
        <Button label="Forgot PIN?" variant="ghost" onPress={forgot} />
      </View>
    </SafeAreaView>
  );
}
