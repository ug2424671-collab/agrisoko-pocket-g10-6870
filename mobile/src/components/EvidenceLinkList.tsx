import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { EvidenceLink } from '../types';
import { linkTypeLabel, openEvidenceLink } from '../services/format';

interface Props {
  links: EvidenceLink[];
}

/**
 * Evidence links open in the device browser through Linking. A refused or
 * unsupported URL shows a message instead of failing silently.
 */
export function EvidenceLinkList({ links }: Props) {
  if (!links.length) {
    return (
      <Text style={styles.empty}>
        No evidence link is stored offline for this member. Reconnect to load the approved repository evidence.
      </Text>
    );
  }

  const handlePress = async (link: EvidenceLink) => {
    const opened = await openEvidenceLink(link);
    if (!opened) {
      Alert.alert('Link unavailable', `This device could not open:\n${link.url}`);
    }
  };

  return (
    <View>
      {links.map((link) => (
        <Pressable
          key={`${link.type}-${link.url}`}
          onPress={() => void handlePress(link)}
          accessibilityRole="link"
          accessibilityLabel={`${linkTypeLabel(link.type)}: ${link.label}`}
          accessibilityHint="Opens the evidence in your browser"
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <View style={styles.meta}>
            <Text style={styles.type}>{linkTypeLabel(link.type)}</Text>
            <Text style={styles.label}>{link.label}</Text>
            <Text style={styles.url} numberOfLines={1}>
              {link.url}
            </Text>
          </View>
          <Text style={styles.open}>Open</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.surfaceMuted,
  },
  meta: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  type: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 15,
    color: colors.text,
    marginTop: 2,
  },
  url: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  open: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
});
