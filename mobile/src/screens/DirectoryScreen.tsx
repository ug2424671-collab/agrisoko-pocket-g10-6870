import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { MemberCard } from '../components/MemberCard';
import { SourceBadge } from '../components/SourceBadge';
import { StateBanner } from '../components/StateBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { GROUP_CODE } from '../config';
import { useTeam } from '../context/TeamContext';
import { normalizeText } from '../services/offline';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

/** Manual browsing: no AI search is used anywhere on this screen. */
export function DirectoryScreen() {
  const navigation = useNavigation<Navigation>();
  const { directory, directorySource, error, isOnline, refreshDirectory } = useTeam();
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const needle = normalizeText(filter);
    if (!needle) {
      return directory;
    }
    return directory.filter((member) => {
      const haystack = normalizeText(
        [member.fullName, ...member.aliases, member.role, member.feature, ...member.skills].join(' '),
      );
      return haystack.includes(needle);
    });
  }, [directory, filter]);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SourceBadge source={directorySource} />

      <Text style={styles.title} maxFontSizeMultiplier={1.6}>
        Team directory
      </Text>
      <Text style={styles.subtitle} maxFontSizeMultiplier={1.7}>
        {directory.length} approved member record{directory.length === 1 ? '' : 's'} for group code {GROUP_CODE}.
        Listing uses the bundled or cached copy, so it works without a network.
      </Text>

      {!isOnline ? (
        <StateBanner message="Offline: showing the bundled directory. Evidence links need a connection." />
      ) : null}
      {error ? (
        <StateBanner
          tone="danger"
          message="The directory could not be refreshed from the AI service, so the last known copy is shown."
          onRetry={() => void refreshDirectory()}
        />
      ) : null}

      <TextInput
        value={filter}
        onChangeText={setFilter}
        placeholder="Filter by name, role, skill or feature"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        accessibilityLabel="Filter the team directory"
        autoCorrect={false}
      />

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle} maxFontSizeMultiplier={1.6}>
            No member matches “{filter}”
          </Text>
          <Text style={styles.emptyBody} maxFontSizeMultiplier={1.7}>
            {directory.length === 0
              ? 'The bundled directory is empty. Run python ai-api/scripts/sync_mobile_data.py and rebuild the app.'
              : 'Clear the filter to see every member.'}
          </Text>
          {filter ? <PrimaryButton label="Clear the filter" variant="secondary" onPress={() => setFilter('')} /> : null}
        </View>
      ) : (
        filtered.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            subtitle={`Also known as: ${member.aliases.join(', ') || 'no alias recorded'}`}
            onPress={() => navigation.navigate('MemberProfile', { memberId: member.id, fallbackName: member.fullName })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  emptyBody: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
});
