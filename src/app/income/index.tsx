import { router } from 'expo-router';
import { View } from 'react-native';
import { Appear, AppText, Button, EmptyState, IconBadge, ListRow, Screen, Section } from '@/components';
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
      subtitle="When each one arrives."
      footer={<Button label="Add income source" onPress={() => router.push({ pathname: '/income/[id]', params: { id: 'new' } })} />}
    >
      {next ? (
        <Appear grow>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg }}>
            <IconBadge name="calendar-outline" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="heading">{next.title}</AppText>
              <AppText variant="caption" tone="secondary">
                {next.detail}
              </AppText>
            </View>
            <AppText variant="amount">{next.amount}</AppText>
          </View>
        </Appear>
      ) : null}
      {sources.length === 0 ? (
        <EmptyState icon="wallet-outline" message="Add your weekly baon or monthly stipend." />
      ) : (
        <Section title="Sources" icon="wallet-outline">
          {sources.map((s, i) => {
            const d = nextPayDate(s.frequency, s.nextDate, today);
            return (
              <Appear key={s.id} index={i} rise={6}>
                <ListRow
                  title={s.name}
                  subtitle={d ? `${PAY_FREQUENCY_LABEL[s.frequency]}, next ${formatDateLabel(d)}` : PAY_FREQUENCY_LABEL[s.frequency]}
                  value={formatPeso(s.amount)}
                  onPress={() => router.push({ pathname: '/income/[id]', params: { id: String(s.id) } })}
                  last={i === sources.length - 1}
                />
              </Appear>
            );
          })}
        </Section>
      )}
    </Screen>
  );
}
