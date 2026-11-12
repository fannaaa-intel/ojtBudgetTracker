import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { amountToInput } from '@/lib/transactions';
import { toCentavos } from '@/lib/money';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { TextField } from './TextField';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  /** Centavos to pre-fill (0 → empty field). */
  initial?: number;
  confirmLabel: string;
  /** Allow ₱0 (e.g. setting a preset back to baon-style ₱0). */
  allowZero?: boolean;
  onSubmit: (centavos: number) => void;
  onCancel: () => void;
};

/** Small dialog that asks for one peso amount. Returns integer centavos. */
export function AmountPrompt({ visible, title, message, initial = 0, confirmLabel, allowZero, onSubmit, onCancel }: Props) {
  const { colors, radius, spacing, typography } = useTheme();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(initial > 0 ? amountToInput(initial) : '');
      setError(null);
    }
  }, [visible, initial]);

  function submit() {
    const c = toCentavos(text);
    if (c == null || c < 0 || (!allowZero && c === 0)) {
      setError(allowZero ? 'Enter an amount (0 is allowed)' : 'Enter an amount more than ₱0');
      return;
    }
    onSubmit(c);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Close" onPress={onCancel} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
            <AppText variant="heading">{title}</AppText>
            {message ? <AppText variant="caption" tone="secondary">{message}</AppText> : null}
            <TextField
              label="Amount (₱)"
              value={text}
              onChangeText={(t) => {
                setText(t);
                setError(null);
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              autoFocus
              error={error}
              style={typography.amount}
              onSubmitEditing={submit}
            />
            <View style={{ gap: spacing.sm }}>
              <Button label={confirmLabel} onPress={submit} />
              <Button label="Cancel" variant="ghost" onPress={onCancel} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
