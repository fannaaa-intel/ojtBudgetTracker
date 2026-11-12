import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ListRow } from '@/components';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { exportOjtPdf, exportTransactionsCsv } from './ojtExport';

/** "Total OJT cost (PDF)" and "All transactions (CSV)" rows. */
export function ExportRows() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState<'pdf' | 'csv' | null>(null);

  async function run(kind: 'pdf' | 'csv') {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === 'pdf') await exportOjtPdf();
      else showSnack(`${await exportTransactionsCsv()} transactions exported`);
    } catch (e) {
      showSnack(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <ListRow
        title="Total OJT cost (PDF)"
        subtitle="One printable page for your coordinator or parents"
        right={busy === 'pdf' ? <ActivityIndicator color={colors.text} /> : undefined}
        onPress={() => run('pdf')}
      />
      <ListRow
        title="All transactions (CSV)"
        subtitle="Open in Excel or Google Sheets"
        right={busy === 'csv' ? <ActivityIndicator color={colors.text} /> : undefined}
        onPress={() => run('csv')}
        last
      />
    </>
  );
}
