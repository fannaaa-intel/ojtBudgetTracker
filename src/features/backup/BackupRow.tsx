import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ListRow } from '@/components';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { exportBackup } from './export';

/** More → "Back up data": writes the JSON backup and opens the share sheet. */
export function BackupRow({ last }: { last?: boolean }) {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await exportBackup();
      showSnack(`Backup ready: ${r.rows} rows in ${r.fileName}`);
    } catch (e) {
      showSnack(`Backup failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ListRow
      icon="cloud-upload-outline"
      title="Back up data"
      subtitle="One file you can keep anywhere"
      right={busy ? <ActivityIndicator color={colors.text} /> : undefined}
      onPress={run}
      last={last}
    />
  );
}
