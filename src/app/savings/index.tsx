import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { AmountPrompt, AppText, Button, Chip, ListRow, ProgressBar, Screen, Section } from '@/components';
import { requireUserId } from '@/features/profile/queries';
import { addToGoal, useGoals, useNeedsLastMonth, type Goal } from '@/features/savings/queries';
import { softDeleteTransaction } from '@/features/transactions/queries';
import { formatDateLabel, todayManila } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { weeklyToReach } from '@/lib/savings';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

/** Savings goals + emergency fund. Adding money is a transfer, so it never counts as spending. */
export default function Savings() {
  const { colors, radius, spacing } = useTheme();
  const goals = useGoals();
  const needs = useNeedsLastMonth();
  const [adding, setAdding] = useState<Goal | null>(null);
  const today = todayManila();
  const hasEmergency = goals.some((g) => g.goal.isEmergencyFund);

  return (
    <Screen
      insetTop={false}
      title="Savings"
      subtitle="Money you set aside is not counted as spending."
      footer={<Button label="Add a goal" onPress={() => router.push({ pathname: '/savings/[id]', params: { id: 'new' } })} />}
    >
      {!hasEmergency ? (
        <Section title="Emergency fund">
          <ListRow
            title="Start an emergency fund"
            subtitle={
              needs.suggested > 0
                ? `Suggested target ${formatPeso(needs.suggested)} — 1 month of necessities (from your last ${Math.min(30, needs.days)} days)`
                : 'Target = 1 month of necessities. Log a few days of spending to get a suggestion.'
            }
            onPress={() => router.push({ pathname: '/savings/[id]', params: { id: 'new', emergency: '1' } })}
            last
          />
        </Section>
      ) : null}

      {goals.length === 0 ? <AppText tone="secondary">No goals yet — a laptop, a trip home, or your graduation fee.</AppText> : null}
      {goals.map(({ goal, saved, pct }) => {
        const weekly = weeklyToReach(saved, goal.target, today, goal.deadline);
        return (
          <Pressable
            key={goal.id}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/savings/[id]', params: { id: String(goal.id) } })}
            style={({ pressed }) => ({ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm }}>
              <AppText variant="heading" style={{ flexGrow: 1, flexShrink: 1 }}>
                {goal.name}
              </AppText>
              {goal.isEmergencyFund ? <Chip label="Emergency" status="plain" /> : null}
              {pct >= 100 ? <Chip label="Reached" status="outline" /> : null}
            </View>
            <AppText variant="amount">
              {formatPeso(saved)} <AppText tone="secondary">of {formatPeso(goal.target)}</AppText>
            </AppText>
            <ProgressBar pct={pct} />
            <AppText variant="caption" tone="secondary">
              {pct >= 100
                ? 'Goal reached.'
                : goal.deadline
                  ? `${formatPeso(weekly ?? 0)} a week to reach it by ${formatDateLabel(goal.deadline)}`
                  : `${formatPeso(goal.target - saved)} to go`}
            </AppText>
            <Button label="Add money" variant="secondary" onPress={() => setAdding(goal)} />
          </Pressable>
        );
      })}

      <AmountPrompt
        visible={adding != null}
        title={`Add to ${adding?.name ?? ''}`}
        message="Saved as a transfer today — it does not count as spending."
        confirmLabel="Add"
        onCancel={() => setAdding(null)}
        onSubmit={(amount) => {
          if (!adding) return;
          const id = addToGoal(requireUserId(), adding, amount);
          showSnack(`${formatPeso(amount)} added to ${adding.name}`, { label: 'Undo', onPress: () => softDeleteTransaction(id) });
          setAdding(null);
        }}
      />
    </Screen>
  );
}
