import Constants from 'expo-constants';
import { ActivityIndicator } from 'react-native';
import { ListRow } from '@/components';
import { useTheme } from '@/theme';
import { checkForAppUpdate, restartIntoUpdate, updatesAvailable, useUpdateStatus, type UpdateStatus } from './appUpdate';

function line(status: UpdateStatus, version: string, installed: boolean): string {
  if (!installed) return `Version ${version}, in the installed app only`;
  switch (status) {
    case 'checking':
      return 'Checking…';
    case 'downloading':
      return 'Downloading the update…';
    case 'ready':
      return 'Update ready. Tap to restart';
    case 'latest':
      return `Version ${version}, up to date`;
    case 'error':
      return 'Could not check. Try again later';
    default:
      return `Version ${version}`;
  }
}

/** Settings → "Check for updates": works any time (automatic checks only run 8 PM – 12 AM). */
export function UpdateRow({ last }: { last?: boolean }) {
  const { colors } = useTheme();
  const status = useUpdateStatus((s) => s.status);
  const version = Constants.expoConfig?.version ?? '';
  const busy = status === 'checking' || status === 'downloading';
  return (
    <ListRow
      icon={status === 'ready' ? 'refresh-outline' : 'cloud-download-outline'}
      title={status === 'ready' ? 'Restart to update' : 'Check for updates'}
      subtitle={line(status, version, updatesAvailable())}
      right={busy ? <ActivityIndicator color={colors.text} /> : undefined}
      onPress={() => (status === 'ready' ? restartIntoUpdate() : void checkForAppUpdate(true))}
      last={last}
    />
  );
}
