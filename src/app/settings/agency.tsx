import { asc } from 'drizzle-orm';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { AppText, Button, OptionRow, Screen } from '@/components';
import { db } from '@/db/client';
import { agencies } from '@/db/schema';
import { useDbQuery } from '@/db/useDbQuery';
import { getProfile } from '@/features/profile/queries';
import { updateAgency } from '@/features/settings/queries';
import { regionChangeWarning } from '@/lib/profile';
import { REGION_LABEL } from '@/lib/region';
import { showSnack } from '@/store/snackbar';

/** Change agency. The region (fares, trains, barkada features) follows the agency. */
export default function ChangeAgency() {
  const [p] = useState(() => getProfile());
  const list = useDbQuery(() => db.select().from(agencies).orderBy(asc(agencies.id)).all(), ['agencies']);
  const [agencyId, setAgencyId] = useState(p?.agency.id ?? null);
  if (!p) return null;

  const chosen = list.find((a) => a.id === agencyId);
  const warning = chosen ? regionChangeWarning(p.user.region, chosen.region) : null;

  function apply() {
    updateAgency(p!.user.id, agencyId!);
    router.back();
    showSnack(`Agency changed to ${chosen?.shortName ?? ''}`);
  }

  function save() {
    if (!chosen || chosen.id === p!.agency.id) return router.back();
    if (warning) {
      Alert.alert(`Move to ${REGION_LABEL[chosen.region]}?`, warning, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change agency', onPress: apply },
      ]);
    } else apply();
  }

  return (
    <Screen insetTop={false} title="Agency" subtitle="This sets your region, fares and group features." footer={<Button label="Save" onPress={save} />}>
      {list.map((a) => (
        <OptionRow key={a.id} title={a.shortName} subtitle={a.address} meta={REGION_LABEL[a.region]} selected={agencyId === a.id} onPress={() => setAgencyId(a.id)} />
      ))}
      {warning ? <AppText variant="caption">{warning}</AppText> : null}
    </Screen>
  );
}
