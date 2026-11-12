import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppText, Chip, ChipRow, TextField, ToggleRow } from '@/components';
import type { Region } from '@/db/schema';
import { formatPeso, toCentavos } from '@/lib/money';
import { legFare, parseKm } from '@/lib/route';
import { useTheme } from '@/theme';
import { totalsFor, useFareRules, useRoutes } from '../../commute/queries';

type Source = { kind: 'route'; id: number } | { kind: 'ride' } | { kind: 'amount' } | { kind: 'none' };

/**
 * Gala fare from saved fare rules: a saved route (round trip), one ride priced by km, or a typed amount.
 * Calls onChange with centavos whenever the fare changes.
 */
export function FarePicker({ region, isStudent, onChange }: { region: Region; isStudent: boolean; onChange: (centavos: number) => void }) {
  const { spacing } = useTheme();
  const routes = useRoutes(region).filter((r) => !r.needsUpdate);
  const rules = useFareRules(region).filter((r) => !r.isFixed);
  const [source, setSource] = useState<Source>({ kind: 'none' });
  const [ruleId, setRuleId] = useState<number | null>(null);
  const [kmText, setKmText] = useState('');
  const [roundTrip, setRoundTrip] = useState(true);
  const [amountText, setAmountText] = useState('');

  const rideFare = (() => {
    const rule = rules.find((r) => r.id === ruleId);
    const km = parseKm(kmText);
    if (!rule || km == null || Number.isNaN(km) || km <= 0) return 0;
    const one = legFare(rule, { kmEstimated: km, kmActual: null, fixedFare: null, discountApplies: true }, isStudent).payable;
    return roundTrip ? one * 2 : one;
  })();

  // Keep the parent's fare in step with the ride calculator.
  useEffect(() => {
    if (source.kind === 'ride') onChange(rideFare);
  }, [source.kind, rideFare]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(s: Source, value: number) {
    setSource(s);
    onChange(value);
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="label" tone="secondary">
        Fare
      </AppText>
      <ChipRow>
        <Chip label="No fare" selected={source.kind === 'none'} onPress={() => pick({ kind: 'none' }, 0)} />
        {routes.map((r) => {
          const rt = totalsFor(r, isStudent).roundTrip;
          return <Chip key={r.id} label={r.name} detail={`${formatPeso(rt)} round trip`} selected={source.kind === 'route' && source.id === r.id} onPress={() => pick({ kind: 'route', id: r.id }, rt)} />;
        })}
        <Chip label="One ride by km" selected={source.kind === 'ride'} onPress={() => pick({ kind: 'ride' }, rideFare)} />
        <Chip label="Type amount" selected={source.kind === 'amount'} onPress={() => pick({ kind: 'amount' }, toCentavos(amountText) ?? 0)} />
      </ChipRow>

      {source.kind === 'ride' ? (
        <View style={{ gap: spacing.sm }}>
          <ChipRow>
            {rules.map((r) => (
              <Chip key={r.id} label={r.label} selected={ruleId === r.id} onPress={() => setRuleId(r.id)} />
            ))}
          </ChipRow>
          <TextField label="Distance (km)" value={kmText} onChangeText={setKmText} keyboardType="decimal-pad" placeholder="e.g. 8" />
          <ToggleRow label="Round trip" value={roundTrip} onChange={setRoundTrip} />
          <AppText variant="caption" tone="secondary">
            {rideFare > 0 ? `Fare from your fare table: ${formatPeso(rideFare)}` : 'Pick a ride and distance'}
          </AppText>
        </View>
      ) : null}
      {source.kind === 'amount' ? (
        <TextField
          label="Fare (₱)"
          value={amountText}
          onChangeText={(t) => {
            setAmountText(t);
            onChange(toCentavos(t) ?? 0);
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
          hint="For Grab, tricycle or any fixed fare."
        />
      ) : null}
    </View>
  );
}
