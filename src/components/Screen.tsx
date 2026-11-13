import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

type Props = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  /** false when a navigation header already covers the top inset (onboarding steps). */
  insetTop?: boolean;
};

/** Space kept between a focused field and the keyboard / footer (room for its hint or error line). */
const REVEAL_MARGIN = 56;

/** Lets inputs ask the screen they're on to scroll them into view (TextField calls it on focus). */
const RevealContext = createContext<() => void>(() => {});
export const useRevealFocusedInput = () => useContext(RevealContext);

/**
 * Page wrapper: safe area, background, optional large title and a pinned footer (e.g. Continue button).
 * Keyboard-safe on every screen: the content area shrinks above the keyboard (Android draws
 * edge-to-edge, so the window itself no longer resizes) and the focused field scrolls into view.
 */
export function Screen({ title, subtitle, children, scroll = true, footer, insetTop = true }: Props) {
  const { colors, spacing } = useTheme();
  const outerRef = useRef<ComponentRef<typeof View>>(null);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const contentRef = useRef<ComponentRef<typeof View>>(null);
  const scrollY = useRef(0);
  const viewH = useRef(0);
  const [offset, setOffset] = useState(0);

  /** Scroll so the focused input (plus a margin for its hint/error) sits inside the visible area. */
  const reveal = useCallback(() => {
    const run = () => {
      const input = TextInput.State.currentlyFocusedInput();
      const content = contentRef.current;
      const sv = scrollRef.current;
      if (!input || !content || !sv || viewH.current <= 0) return;
      input.measureLayout(
        content,
        (_x, y, _w, h) => {
          const top = scrollY.current;
          const bottom = top + viewH.current;
          if (y + h + REVEAL_MARGIN > bottom) sv.scrollTo({ y: y + h + REVEAL_MARGIN - viewH.current, animated: true });
          else if (y - spacing.lg < top) sv.scrollTo({ y: Math.max(0, y - spacing.lg), animated: true });
        },
        () => {},
      );
    };
    // Wait for the keyboard / layout change to settle before measuring.
    setTimeout(run, Platform.OS === 'android' ? 150 : 60);
  }, [spacing.lg]);

  useEffect(() => {
    const sub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', reveal);
    return () => sub.remove();
  }, [reveal]);

  // The keyboard is measured from the top of the window; this screen may start below a header.
  const onOuterLayout = () => outerRef.current?.measureInWindow((_x, y) => setOffset(Math.max(0, Math.round(y))));

  const onScrollLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    const shrank = viewH.current > 0 && h < viewH.current;
    viewH.current = h;
    if (shrank && TextInput.State.currentlyFocusedInput()) reveal();
  };

  const body = (
    <View ref={contentRef} collapsable={false} style={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl }}>
      {title ? (
        <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          {subtitle ? <AppText tone="secondary">{subtitle}</AppText> : null}
        </View>
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[...(insetTop ? (['top'] as const) : []), 'left', 'right', ...(footer ? (['bottom'] as const) : [])]}>
      <RevealContext.Provider value={reveal}>
        <View ref={outerRef} collapsable={false} onLayout={onOuterLayout} style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={offset} style={{ flex: 1 }}>
            {scroll ? (
              <ScrollView
                ref={scrollRef}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                scrollEventThrottle={16}
                onScroll={(e) => (scrollY.current = e.nativeEvent.contentOffset.y)}
                onLayout={onScrollLayout}
              >
                {body}
              </ScrollView>
            ) : (
              <View style={{ flex: 1 }}>{body}</View>
            )}
            {footer ? <View style={{ padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>{footer}</View> : null}
          </KeyboardAvoidingView>
        </View>
      </RevealContext.Provider>
    </SafeAreaView>
  );
}
