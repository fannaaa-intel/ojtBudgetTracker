import { router } from 'expo-router';
import { Button, Chip, ListRow, Screen, Section } from '@/components';
import { FaresCheckedBanner } from '@/features/commute/components/FaresCheckedBanner';
import { useFareRules, type FareRule } from '@/features/commute/queries';
import { useProfile } from '@/features/profile/queries';
import { describeFormula } from '@/lib/fareForm';
import { formatPeso } from '@/lib/money';
import { REGION_LABEL } from '@/lib/region';

/** One line: the formula (or "you enter the fare"). Discounts show as chips, details on the edit screen. */
function ruleSummary(r: FareRule): string {
  return r.isFixed ? 'You enter the fare per ride' : describeFormula(r, (c) => formatPeso(c));
}

/** Fare rules for the user's region (Bicol never shows trains or the Carousel). Tap to edit. */
export default function FareTable() {
  const profile = useProfile();
  const rules = useFareRules(profile?.user.region);
  if (!profile) return null;

  return (
    <Screen
      insetTop={false}
      title="Fare table"
      subtitle={`${REGION_LABEL[profile.user.region]} fares. Tap a row to edit.`}
      footer={<Button label="Update fares after a hike" variant="secondary" onPress={() => router.push('/fares/update')} />}
    >
      <FaresCheckedBanner region={profile.user.region} />
      <Section>
        {rules.map((r, i) => (
          <ListRow
            key={r.id}
            title={r.label}
            subtitle={ruleSummary(r)}
            right={
              r.userEdited || r.promoPct > 0 || (!r.isFixed && r.studentPct > 0) ? (
                <>
                  {!r.isFixed && r.studentPct > 0 ? <Chip label={`Student ${r.studentPct}%`} status="plain" /> : null}
                  {r.promoPct > 0 ? <Chip label={`Promo ${r.promoPct}%`} status="outline" /> : null}
                  {r.userEdited ? <Chip label="Edited" status="plain" /> : null}
                </>
              ) : undefined
            }
            onPress={() => router.push({ pathname: '/fares/[id]', params: { id: String(r.id) } })}
            last={i === rules.length - 1}
          />
        ))}
      </Section>
    </Screen>
  );
}
