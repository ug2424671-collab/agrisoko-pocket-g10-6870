import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  tone?: 'warning' | 'danger';
}

/** Non-blocking problem banner used for network, timeout and server states. */
export function StateBanner({ message, onRetry, retryLabel = 'Retry', tone = 'warning' }: Props) {
  const palette =
    tone === 'danger'
      ? { background: colors.dangerSoft, text: colors.onDangerSoft, border: colors.danger }
      : { background: colors.warningSoft, text: colors.onWarningSoft, border: colors.warning };

  return (
    <View
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: palette.background, borderColor: palette.border }]}
    >
      <Text style={[styles.message, { color: palette.text }]} maxFontSizeMultiplier={1.8}>
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>{retryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingRight: spacing.sm,
  },
  button: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
