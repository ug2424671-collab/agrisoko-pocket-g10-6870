import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { DirectoryMember } from '../types';

interface Props {
  member: DirectoryMember;
  onPress: () => void;
  subtitle?: string;
}

export function MemberCard({ member, onPress, subtitle }: Props) {
  const initials = member.fullName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open the profile of ${member.fullName}, ${member.role}`}
      accessibilityHint="Shows the full evidence-based profile"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.avatar} accessible={false}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} maxFontSizeMultiplier={1.6}>
          {member.fullName}
        </Text>
        <Text style={styles.role} maxFontSizeMultiplier={1.6}>
          {member.role}
        </Text>
        <Text style={styles.feature} numberOfLines={2} maxFontSizeMultiplier={1.6}>
          {member.feature}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} maxFontSizeMultiplier={1.6}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={styles.chevron} accessible={false}>
        ›
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  initials: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 18,
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  role: {
    fontSize: 14,
    color: colors.primaryDark,
    marginTop: 2,
  },
  feature: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.warning,
    marginTop: 4,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 28,
    color: colors.textMuted,
    paddingLeft: spacing.sm,
  },
});
