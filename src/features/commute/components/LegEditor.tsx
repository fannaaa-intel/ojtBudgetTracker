import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, View } from 'react-native';
import { AppText, Chip, ChipRow, TextField, ToggleRow } from '@/components';
import { formatPeso } from '@/lib/money';
import { legFare, parseLegText, type LegText } from '@/lib/route';
import { useTheme } from '@/theme';
import type { FareRule } from '../queries';

export type LegForm = LegText & { key: string; fareRuleId: number | null; fromLabel: string; toLabel: string };

type Props = {
  index: number;
  total: number;
  leg: LegForm;
  rules: FareRule[];
  isStudent: boolean;
  showErrors: boolean;
  onChange: (patch: Partial<LegForm>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
};

function IconButton({ name, label, onPress, disabled }: { name: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}
    >
      <Ionicons name={name} size={20} color={colors.text} />
    </Pressable>
  );
}

/** One ride in a route: mode (fare rule), km or fixed fare, discount toggle, live fare. */
export function LegEditor({ index, total, leg, rules, isStudent, showErrors, onChange, onRemove, onMove }: Props) {
  const { colors, radius, spacing } = useTheme();
  const rule = rules.find((r) => r.id === leg.fareRuleId);
  const parsed = rule ? parseLegText(rule, leg) : null;
  const fare = rule && parsed?.ok ? legFare(rule, parsed.values, isStudent) : null;
  const canDiscount = !!rule && !rule.isFixed && isStudent && rule.studentPct > 0;

  return (
    <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppText variant="label" tone="muted" style={{ flex: 1 }}>
          Leg {index + 1}
        </AppText>
        <IconButton name="arrow-up" label="Move leg up" disabled={index === 0} onPress={() => onMove(-1)} />
        <IconButton name="arrow-down" label="Move leg down" disabled={index === total - 1} onPress={() => onMove(1)} />
        <IconButton name="trash-outline" label="Remove leg" onPress={onRemove} />
      </View>

      <ChipRow>
        {rules.map((r) => (
          <Chip key={r.id} label={r.label} selected={leg.fareRuleId === r.id} onPress={() => onChange({ fareRuleId: r.id })} />
        ))}
      </ChipRow>
      {!rule && showErrors ? <AppText variant="caption">Choose how you ride</AppText> : null}

      {rule ? (
        <>
          {rule.note ? <AppText variant="caption" tone="muted">{rule.note}</AppText> : null}
          {rule.isFixed ? (
            <TextField label="Fare you pay (₱)" value={leg.fareText} onChangeText={(fareText) => onChange({ fareText })} keyboardType="decimal-pad" placeholder="0.00" />
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <TextField label="Est. km" value={leg.kmEstText} onChangeText={(kmEstText) => onChange({ kmEstText })} keyboardType="decimal-pad" placeholder="e.g. 6" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Actual km" value={leg.kmActText} onChangeText={(kmActText) => onChange({ kmActText })} keyboardType="decimal-pad" placeholder="optional" />
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <TextField label="From" value={leg.fromLabel} onChangeText={(fromLabel) => onChange({ fromLabel })} placeholder="optional" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="To" value={leg.toLabel} onChangeText={(toLabel) => onChange({ toLabel })} placeholder="optional" />
            </View>
          </View>
          {canDiscount ? (
            <ToggleRow
              label={`Student discount (${rule.studentPct}%)`}
              description="Turn off if you won't show your school ID on this ride."
              value={leg.discountApplies}
              onChange={(discountApplies) => onChange({ discountApplies })}
            />
          ) : null}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
            <AppText variant="caption" tone="secondary" style={{ flex: 1 }}>
              {fare
                ? fare.source === 'fixed'
                  ? 'Fixed fare'
                  : fare.discountPct > 0
                    ? `${fare.discountPct}% off ${formatPeso(fare.regular)}`
                    : 'Regular fare'
                : parsed && !parsed.ok && (showErrors || leg.kmEstText || leg.kmActText || leg.fareText)
                  ? parsed.error
                  : ' '}
            </AppText>
            <AppText variant="amount">{fare ? formatPeso(fare.payable) : '—'}</AppText>
          </View>
        </>
      ) : null}
    </View>
  );
}
