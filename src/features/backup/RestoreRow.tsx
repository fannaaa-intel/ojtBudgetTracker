import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert } from 'react-native';
import { ListRow } from '@/components';
import { formatDateLabel } from '@/lib/dates';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { pickBackup, restoreBackup, saveSafetyBackup, type PickedBackup } from './restore';

const ask = (title: string, message: string, ok: string) =>
  new Promise<boolean>((resolve) =>
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );

/** More → "Restore from backup": pick a file, confirm twice, safety copy, replace everything. */
export function RestoreRow({ last }: { last?: boolean }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      let picked: PickedBackup | null;
      try {
        picked = await pickBackup();
      } catch (e) {
        showSnack(e instanceof Error ? e.message : String(e));
        return;
      }
      if (!picked) return;
      const when = picked.backup.exportedOn ? formatDateLabel(picked.backup.exportedOn) : 'unknown date';
      if (!(await ask('Replace all data?', `${picked.fileName}\nSaved ${when} · ${picked.rows} rows.\n\nEverything on this phone will be replaced. Your current data is saved to a file first.`, 'Continue'))) return;
      if (!(await ask('Are you sure?', 'This replaces your expenses, routes, budgets and settings with the backup.', 'Replace all data'))) return;
      const safety = saveSafetyBackup('before-restore');
      restoreBackup(picked.backup);
      router.replace('/');
      showSnack(`Backup restored. Your previous data is saved as ${safety}.`);
    } catch (e) {
      showSnack(`Restore failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ListRow
      title="Restore from backup"
      subtitle="Replace all data with a backup file"
      right={busy ? <ActivityIndicator color={colors.text} /> : undefined}
      onPress={run}
      last={last}
    />
  );
}
