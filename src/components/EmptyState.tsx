import { View } from 'react-native';
import { useTheme } from '@/theme';
import { Appear } from './Appear';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconBadge, type IconName } from './IconBadge';

type Props = {
  icon: IconName;
  /** One short line. */
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Icon + one line + one (outlined) action, instead of plain grey text. */
export function EmptyState({ icon, message, actionLabel, onAction }: Props) {
  const { spacing } = useTheme();
  return (
    <Appear>
      <View style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg }}>
        <IconBadge name={icon} size={56} />
        <AppText tone="secondary" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
        {actionLabel && onAction ? <Button label={actionLabel} variant="secondary" onPress={onAction} style={{ alignSelf: 'center', minWidth: 160 }} /> : null}
      </View>
    </Appear>
  );
}
