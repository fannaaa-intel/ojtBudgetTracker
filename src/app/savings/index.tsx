import { router } from 'expo-router';
import { useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { AmountPrompt, AnimatedAmount, Appear, AppText, Button, Chip, EmptyState, IconBadge, ListRow, ProgressBar, Screen, Section } from '@/components';
import { usePressScale } from '@/components/usePressScale';
import { requireUserId } from '@/features/profile/queries';
import { addToGoal, takeFromGoal, useGoals, useNeedsLastMonth, type Goal } from '@/features/savings/queries';
import { softDeleteTransaction } from '@/features/transactions/queries';
import { formatDateLabel, todayManila } from '@/lib/dates';
import { formatPeso } from '@/lib/money';
import { weeklyToReach, withdrawalError } from '@/lib/savings';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';

type GoalView = ReturnType<typeof useGoals>[number];

function GoalCard({ g, index, onAdd, onTake }: { g: GoalView; index: number; onAdd: (goal: Goal) => void; onTake: (g: GoalView) => void }) {
  const { colors, radius, spacing } = useTheme();
  const press = usePressScale(0.98);
  const { goal, saved, pct } = g;
  const weekly = weeklyToReach(saved, goal.target, todayManila(), goal.deadline);
  return (
    <Appear index={index}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/savings/[id]', params: { id: String(goal.id) } })}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
      >
        <Animated.View style={[{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md }, press.style]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <IconBadge name={goal.isEmergencyFund ? 'shield-outline' : 'flag-outline'} inverse={pct >= 100} />
            <AppText variant="heading" style={{ flex: 1 }} numberOfLines={2}>
              {goal.name}
            </AppText>
            {pct >= 100 ? <Chip label="Reached" status="outline" /> : goal.isEmergencyFund ? <Chip label="Emergency" status="plain" /> : null}
          </View>
          <View style={{ gap: 2 }}>
            <AnimatedAmount value={saved} variant="amountLarge" />
            <AppText variant="caption" tone="secondary">
              of {formatPeso(goal.target)}
            </AppText>
          </View>
          <ProgressBar pct={pct} height={8} />
          <AppText variant="caption" tone="secondary">
            {pct >= 100 ? 'Goal reached.' : goal.deadline ? `${formatPeso(weekly ?? 0)} a week until ${formatDateLabel(goal.deadline)}` : `${formatPeso(goal.target - saved)} to go`}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button label="Add money" variant="secondary" onPress={() => onAdd(goal)} style={{ flexGrow: 1, minWidth: 140 }} />
            {saved > 0 ? <Button label="Take out" variant="ghost" onPress={() => onTake(g)} style={{ flexGrow: 1, minWidth: 120 }} /> : null}
          </View>
        </Animated.View>
      </Pressable>
    </Appear>
  );
}

/** Savings goals + emergency fund. Adding money is a transfer, so it never counts as spending. */
export default function Savings() {
  const goals = useGoals();
  const needs = useNeedsLastMonth();
  const [adding, setAdding] = useState<Goal | null>(null);
  const [taking, setTaking] = useState<GoalView | null>(null);
  const hasEmergency = goals.some((g) => g.goal.isEmergencyFund);

  return (
    <Screen
      insetTop={false}
      title="Savings"
      subtitle="Money set aside isn't spending."
      footer={<Button label="Add a goal" onPress={() => router.push({ pathname: '/savings/[id]', params: { id: 'new' } })} />}
    >
      {!hasEmergency ? (
        <Appear>
          <Section title="Emergency fund" icon="shield-outline">
            <ListRow
              icon="shield-checkmark-outline"
              title="Start an emergency fund"
              subtitle={needs.suggested > 0 ? '1 month of necessities' : 'Log a few days to get a target'}
              value={needs.suggested > 0 ? formatPeso(needs.suggested) : undefined}
              onPress={() => router.push({ pathname: '/savings/[id]', params: { id: 'new', emergency: '1' } })}
              last
            />
          </Section>
        </Appear>
      ) : null}

      {goals.length === 0 ? <EmptyState icon="flag-outline" message="A laptop, a trip home, or your graduation fee." /> : null}
      {goals.map((g, i) => (
        <GoalCard key={g.goal.id} g={g} index={i + 1} onAdd={setAdding} onTake={setTaking} />
      ))}

      <AmountPrompt
        visible={taking != null}
        title={`Take out of ${taking?.goal.name ?? ''}`}
        message={taking ? `Up to ${formatPeso(taking.saved)}. Goes back to Cash and isn't counted as spending.` : undefined}
        confirmLabel="Take out"
        validate={(amount) => (taking ? withdrawalError(amount, taking.saved) : null)}
        onCancel={() => setTaking(null)}
        onSubmit={(amount) => {
          if (!taking) return;
          try {
            const id = takeFromGoal(requireUserId(), taking.goal, amount, taking.saved);
            showSnack(`${formatPeso(amount)} taken out of ${taking.goal.name}`, { label: 'Undo', onPress: () => softDeleteTransaction(id) });
          } catch (e) {
            showSnack(e instanceof Error ? e.message : String(e));
          }
          setTaking(null);
        }}
      />

      <AmountPrompt
        visible={adding != null}
        title={`Add to ${adding?.name ?? ''}`}
        message="Saved as a transfer today. It does not count as spending."
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
