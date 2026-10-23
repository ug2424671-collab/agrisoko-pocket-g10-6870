import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function Chip({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'primary' | 'warning' }) {
  const palette = {
    neutral: { background: colors.surfaceMuted, text: colors.text },
    primary: { background: colors.primarySoft, text: colors.primaryDark },
    warning: { background: colors.warningSoft, text: colors.onWarningSoft },
  }[tone];

  return (
    <View style={[styles.chip, { backgroundColor: palette.background }]}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
