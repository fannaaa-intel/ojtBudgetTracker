import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, PinPad, Screen, Section, ToggleRow } from '@/components';
import { useProfile } from '@/features/profile/queries';
import { biometricAvailable, biometricEnabled, checkPin, getPinRecord, removePin, setBiometricEnabled, setPin } from '@/features/security/lock';
import { PIN_MAX, PIN_MIN, validatePin } from '@/lib/pin';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

type Step = { kind: 'idle' } | { kind: 'current'; then: 'change' | 'remove' } | { kind: 'new' } | { kind: 'confirm'; first: string };

/** Settings → App lock: set / change / remove a PIN, fingerprint unlock. */
export default function Security() {
  const { spacing } = useTheme();
  const profile = useProfile();
  const [hasPin, setHasPin] = useState(() => !!getPinRecord());
  const [bio, setBio] = useState(() => biometricEnabled());
  const [bioAvailable, setBioAvailable] = useState(false);
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    biometricAvailable().then(setBioAvailable);
  }, []);

  // Unlocking with the current PIN auto-submits at its length.
  useEffect(() => {
    if (step.kind !== 'current') return;
    const rec = getPinRecord();
    if (!rec || value.length < rec.length) return;
    (async () => {
      if (!(await checkPin(value))) {
        setValue('');
        return setError('Wrong PIN');
      }
      setValue('');
      setError(null);
      if (step.then === 'remove') {
        removePin(profile!.user.id);
        setHasPin(false);
        setBio(false);
        setStep({ kind: 'idle' });
        showSnack('App lock turned off');
      } else setStep({ kind: 'new' });
    })();
  }, [value, step, profile]);

  if (!profile) return null;

  async function next() {
    if (step.kind === 'new') {
      const problem = validatePin(value);
      if (problem) return setError(problem);
      setStep({ kind: 'confirm', first: value });
      setValue('');
      setError(null);
    } else if (step.kind === 'confirm') {
      if (value !== step.first) {
        setValue('');
        setStep({ kind: 'new' });
        return setError('The PINs did not match. Try again.');
      }
      await setPin(profile!.user.id, value);
      setHasPin(true);
      setValue('');
      setError(null);
      setStep({ kind: 'idle' });
      showSnack('PIN saved. The app locks when opened and after a minute away.');
    }
  }

  if (step.kind !== 'idle') {
    const title = step.kind === 'current' ? 'Enter your current PIN' : step.kind === 'new' ? `Choose a ${PIN_MIN}–${PIN_MAX} digit PIN` : 'Enter it again';
    const rec = getPinRecord();
    return (
      <Screen
        insetTop={false}
        title={title}
        footer={
          step.kind === 'current' ? (
            <Button label="Cancel" variant="ghost" onPress={() => (setStep({ kind: 'idle' }), setValue(''), setError(null))} />
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Button label={step.kind === 'new' ? 'Next' : 'Save PIN'} disabled={value.length < PIN_MIN} onPress={next} />
              <Button label="Cancel" variant="ghost" onPress={() => (setStep({ kind: 'idle' }), setValue(''), setError(null))} />
            </View>
          )
        }
      >
        <AppText variant="caption" tone={error ? 'default' : 'secondary'}>
          {error ?? (step.kind === 'new' ? 'Avoid birthdays and 1234.' : step.kind === 'confirm' ? 'Type the same PIN to confirm.' : ' ')}
        </AppText>
        <PinPad value={value} onChange={(v) => (setValue(v), setError(null))} dots={step.kind === 'current' ? (rec?.length ?? PIN_MIN) : Math.max(PIN_MIN, Math.min(PIN_MAX, value.length + (value.length < PIN_MAX ? 1 : 0)))} />
      </Screen>
    );
  }

  return (
    <Screen insetTop={false} title="App lock" subtitle="Keep your money details private on a shared phone.">
      <Section>
        <View style={{ paddingVertical: spacing.md, gap: spacing.md }}>
          <AppText>{hasPin ? 'PIN lock is on.' : 'No PIN set.'}</AppText>
          <AppText variant="caption" tone="secondary">
            The app locks when opened and after 1 minute in the background. After 5 wrong tries you wait 30 seconds.
          </AppText>
          {hasPin ? (
            <>
              <Button label="Change PIN" variant="secondary" onPress={() => setStep({ kind: 'current', then: 'change' })} />
              <Button label="Turn off app lock" variant="ghost" onPress={() => setStep({ kind: 'current', then: 'remove' })} />
            </>
          ) : (
            <Button label="Set a PIN" onPress={() => setStep({ kind: 'new' })} />
          )}
        </View>
      </Section>
      {hasPin && bioAvailable ? (
        <ToggleRow
          label="Unlock with fingerprint"
          description="Your PIN still works as a backup."
          value={bio}
          onChange={(v) => {
            setBiometricEnabled(v);
            setBio(v);
          }}
        />
      ) : null}
      {hasPin && !bioAvailable ? <AppText variant="caption" tone="muted">Fingerprint unlock appears here when this phone has a fingerprint saved.</AppText> : null}
      <AppText variant="caption" tone="muted">The lock protects the app’s screens. Backups you share are plain files, so keep them private.</AppText>
      <Button label="Back to settings" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
