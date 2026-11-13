import { router } from 'expo-router';
import { Alert } from 'react-native';
import { ListRow } from '@/components';
import { eraseAllData, saveSafetyBackup } from './restore';

/** Settings → "Erase all data": safety copy first, two confirmations, then back to registration. */
export function EraseRow() {
  function run() {
    Alert.alert('Erase all data?', 'Removes your profile, expenses, routes, budgets and settings from this phone. A copy is saved to a file first.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Erase everything?', 'You will register again from the start. Use More → Restore from backup to bring the copy back.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Erase all data',
              style: 'destructive',
              onPress: () => {
                const file = saveSafetyBackup('before-erase');
                eraseAllData();
                router.replace('/onboarding');
                Alert.alert('Data erased', `A copy was saved as ${file} in the app’s documents folder.`);
              },
            },
          ]),
      },
    ]);
  }
  return <ListRow icon="trash-outline" title="Erase all data" subtitle="Start over. A copy is saved first." onPress={run} last />;
}
