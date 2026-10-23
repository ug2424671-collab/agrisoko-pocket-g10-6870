import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { SourceKind } from '../types';

interface Props {
  source: SourceKind;
  label?: string;
  style?: ViewStyle;
}

const COPY: Record<SourceKind, { title: string; description: string; tone: string; background: string }> = {
  live: {
    title: 'Live AI match',
    description: 'Answered by the FastAPI service now.',
    tone: colors.onPrimary,
    background: colors.primary,
  },
  cached: {
    title: 'Cached result',
    description: 'Last successful online answer, stored on this phone.',
    tone: colors.onWarning,
    background: colors.warning,
  },
  offline: {
    title: 'Offline match',
    description: 'Bundled directory lookup without the AI service.',
    tone: colors.onOffline,
    background: colors.offline,
  },
};

export function SourceBadge({ source, label, style }: Props) {
  const copy = COPY[source];
  return (
    <View
      accessible
      accessibilityLabel={`${copy.title}. ${copy.description}`}
      style={[styles.badge, { backgroundColor: copy.background }, style]}
    >
      <Text style={[styles.title, { color: copy.tone }]}>{label ?? copy.title}</Text>
      <Text style={[styles.description, { color: copy.tone }]}>{copy.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    marginTop: 2,
  },
});
