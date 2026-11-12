import { router } from 'expo-router';
import { Chip, ListRow, Screen, Section } from '@/components';
import { FaresCheckedBanner } from '@/features/commute/components/FaresCheckedBanner';
import { useFareRules, type FareRule } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { describeFormula } from '@/lib/fareForm';
import { formatPeso } from '@/lib/money';
import { REGION_LABEL } from '@/lib/region';

function ruleSummary(r: FareRule): string {
  const parts = [r.isFixed ? 'You enter the fare per ride' : describeFormula(r, (c) => formatPeso(c))];
  if (!r.isFixed && r.studentPct > 0) parts.push(`student ${r.studentPct}% off`);
  if (r.promoPct > 0) parts.push(`promo ${r.promoPct}% for all`);
  return parts.join(' · ');
}

/** Fare rules for the user's region (Bicol never shows trains or the Carousel). Tap to edit. */
export default function FareTable() {
  const profile = useProfile();
  const rules = useFareRules(profile?.user.region);
  if (!profile) return null;

  return (
    <Screen insetTop={false} title="Fare table" subtitle={`${REGION_LABEL[profile.user.region]} fares. Tap a row to edit.`}>
      <FaresCheckedBanner region={profile.user.region} />
      <Section>
        {rules.map((r, i) => (
          <ListRow
            key={r.id}
            title={r.label}
            subtitle={ruleSummary(r)}
            right={r.userEdited ? <Chip label="Edited" status="plain" /> : undefined}
            onPress={() => router.push({ pathname: '/fares/[id]', params: { id: String(r.id) } })}
            last={i === rules.length - 1}
          />
        ))}
      </Section>
    </Screen>
  );
}
