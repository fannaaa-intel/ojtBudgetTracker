import { useState } from 'react';
import { View } from 'react-native';
import { AmountPrompt, AppText, Chip, ChipRow } from '@/components';
import type { Region } from '@/db/schema';
import { presetNeedsPrice } from '@/lib/meals';
import { formatPeso } from '@/lib/money';
import { showSnack } from '@/store/snackbar';
import { useTheme } from '@/theme';
import { softDeleteTransaction } from '../../transactions/queries';
import { logMealPreset, updateMealPresetPrice, useMealPresets, type MealPreset } from '../queries';

type PromptState = { preset: MealPreset; mode: 'log' | 'edit' } | null;

/**
 * One tap logs a Pagkain expense for today (with Undo).
 * ₱0 presets without a price ask first; long-press edits the preset price.
 */
export function MealPresetChips({ region, userId }: { region: Region; userId: number }) {
  const { spacing } = useTheme();
  const presets = useMealPresets(region);
  const [prompt, setPrompt] = useState<PromptState>(null);

  function log(p: MealPreset, amount: number) {
    const id = logMealPreset(userId, p, amount);
    showSnack(`${p.label} ${formatPeso(amount)} logged`, { label: 'Undo', onPress: () => softDeleteTransaction(id) });
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <ChipRow>
        {presets.map((p) => (
          <Chip
            key={p.id}
            label={p.label}
            detail={presetNeedsPrice(p) ? 'Set price' : formatPeso(p.price, { hideZeroCents: true })}
            accessibilityLabel={`Log ${p.label}${presetNeedsPrice(p) ? '' : `, ${formatPeso(p.price)}`}. Long-press to change the price.`}
            onPress={() => (presetNeedsPrice(p) ? setPrompt({ preset: p, mode: 'log' }) : log(p, p.price))}
            onLongPress={() => setPrompt({ preset: p, mode: 'edit' })}
          />
        ))}
      </ChipRow>
      <AppText variant="caption" tone="muted">
        Tap to log for today. Long-press to change a price.
      </AppText>
      <AmountPrompt
        visible={prompt != null}
        title={prompt?.mode === 'log' ? `How much was ${prompt.preset.label}?` : `Price for ${prompt?.preset.label ?? ''}`}
        message={
          prompt?.mode === 'log'
            ? 'Saved as this chip’s price, so next time it is one tap.'
            : 'Changes the one-tap price only. Past entries keep what you paid.'
        }
        initial={prompt?.preset.price}
        allowZero={prompt?.mode === 'edit'}
        confirmLabel={prompt?.mode === 'log' ? 'Log it' : 'Save price'}
        onCancel={() => setPrompt(null)}
        onSubmit={(amount) => {
          if (!prompt) return;
          updateMealPresetPrice(prompt.preset.id, amount);
          if (prompt.mode === 'log') log(prompt.preset, amount);
          else showSnack(`${prompt.preset.label} is now ${formatPeso(amount)}`);
          setPrompt(null);
        }}
      />
    </View>
  );
}
