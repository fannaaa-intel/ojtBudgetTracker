import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { formatDateLabel, isoToPickerDate, isValidISO, pickerDateToISO, type ISODate } from '@/lib/dates';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  value: ISODate;
  onChange: (value: ISODate) => void;
  hint?: string;
  minimumDate?: ISODate;
  maximumDate?: ISODate;
};

/**
 * Date input that stores 'YYYY-MM-DD'. Android opens the native calendar dialog;
 * iOS expands an inline calendar under the field.
 */
export function DateField({ label, value, onChange, hint, minimumDate, maximumDate }: Props) {
  const { colors, radius, spacing, isDark } = useTheme();
  const [iosOpen, setIosOpen] = useState(false);
  const valid = isValidISO(value);
  const current = isoToPickerDate(valid ? value : '2026-11-09');
  const min = minimumDate ? isoToPickerDate(minimumDate) : undefined;
  const max = maximumDate ? isoToPickerDate(maximumDate) : undefined;

  function open() {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate: min,
        maximumDate: max,
        onValueChange: (_e, date) => onChange(pickerDateToISO(date)),
      });
    } else {
      setIosOpen((o) => !o);
    }
  }

  return (
    <View style={{ gap: spacing.xs }}>
      <AppText variant="label" tone="secondary">
        {label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${valid ? formatDateLabel(value) : 'not set'}. Tap to change.`}
        onPress={open}
        style={({ pressed }) => ({
          minHeight: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: iosOpen ? colors.borderStrong : colors.border,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AppText>{valid ? formatDateLabel(value) : 'Choose a date'}</AppText>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      {Platform.OS === 'ios' && iosOpen ? (
        <DateTimePicker
          value={current}
          mode="date"
          display="inline"
          themeVariant={isDark ? 'dark' : 'light'}
          accentColor={colors.text}
          textColor={colors.text}
          minimumDate={min}
          maximumDate={max}
          onValueChange={(_e, date) => {
            onChange(pickerDateToISO(date));
            setIosOpen(false);
          }}
        />
      ) : null}
      {hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
