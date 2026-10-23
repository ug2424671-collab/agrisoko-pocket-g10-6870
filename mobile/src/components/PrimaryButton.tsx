import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  hint?: string;
}

export function PrimaryButton({ label, onPress, disabled, variant = 'primary', hint }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text
        style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}
        maxFontSizeMultiplier={1.6}
      >
        {label}
      </Text>
      {hint ? (
        <View accessible={false}>
          <Text style={styles.hint} maxFontSizeMultiplier={1.6}>
            {hint}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryLabel: {
    color: colors.onPrimary,
  },
  secondaryLabel: {
    color: colors.primaryDark,
  },
  hint: {
    fontSize: 12,
    color: colors.onPrimary,
    marginTop: 2,
  },
});
