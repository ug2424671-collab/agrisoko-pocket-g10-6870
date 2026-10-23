import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';

/** Horizontal confidence bar with a marker for the configured threshold. */
export function ConfidenceMeter({ value, threshold }: { value: number; threshold: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  const width = `${Math.round(clamped * 100)}%` as const;
  const thresholdLeft = `${Math.round(Math.max(0, Math.min(1, threshold)) * 100)}%` as const;

  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ now: Math.round(clamped * 100), min: 0, max: 100 }}>
      <View style={[styles.fill, { width }]} />
      <View style={[styles.threshold, { left: thresholdLeft }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  threshold: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: colors.danger,
  },
  badgeRow: {
    marginTop: spacing.xs,
  },
});
