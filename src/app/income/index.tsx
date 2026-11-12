import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, ListRow, Screen, Section } from '@/components';
import { useNextAllowanceLabel } from '@/features/income/components/NextAllowance';
import { useIncomeSources } from '@/features/income/queries';
import { formatDateLabel, todayManila } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { nextPayDate, PAY_FREQUENCY_LABEL } from '@/lib/paySchedule';
import { useTheme } from '@/theme';

/** Allowance / stipend sources and their pay schedules. */
export default function IncomeSources() {
  const { colors, radius, spacing } = useTheme();
  const sources = useIncomeSources();
  const next = useNextAllowanceLabel();
  const today = todayManila();

  return (
    <Screen
      insetTop={false}
      title="Income & allowance"
      subtitle="Baon, padala, stipend — and when each one arrives."
      footer={<Button label="Add income source" onPress={() => router.push({ pathname: '/income/[id]', params: { id: 'new' } })} />}
    >
      {next ? (
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: 2 }}>
          <AppText variant="heading">{next.title}</AppText>
          <AppText variant="caption" tone="secondary">{next.detail}</AppText>
        </View>
      ) : null}
      {sources.length === 0 ? (
        <AppText tone="secondary">No sources yet. Add your weekly baon or monthly stipend to see how many days until it arrives.</AppText>
      ) : (
        <Section title="Sources">
          {sources.map((s, i) => {
            const d = nextPayDate(s.frequency, s.nextDate, today);
            return (
              <ListRow
                key={s.id}
                title={s.name}
                subtitle={`${PAY_FREQUENCY_LABEL[s.frequency]} · ${d ? `next ${formatDateLabel(d)}` : 'no upcoming date'}`}
                value={formatPeso(s.amount)}
                onPress={() => router.push({ pathname: '/income/[id]', params: { id: String(s.id) } })}
                last={i === sources.length - 1}
              />
            );
          })}
        </Section>
      )}
    </Screen>
  );
}
