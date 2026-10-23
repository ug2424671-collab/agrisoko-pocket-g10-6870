import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Chip } from '../components/Chip';
import { MemberCard } from '../components/MemberCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SourceBadge } from '../components/SourceBadge';
import { APP_VERSION, GROUP_CODE, MODEL_VERSION } from '../config';
import { useTeam } from '../context/TeamContext';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    directory,
    directorySource,
    isOnline,
    isCheckingNetwork,
    connectionType,
    answer,
    error,
    retryLastQuery,
  } = useTeam();

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="AgriSoko Pocket home screen">
      <View style={styles.hero}>
        <Text style={styles.heroTitle} maxFontSizeMultiplier={1.5}>
          AgriSoko Pocket {GROUP_CODE}
        </Text>
        <Text style={styles.heroSubtitle} maxFontSizeMultiplier={1.6}>
          Ask about any team member by name, nickname, role or feature and get a profile that points back to the
          repository, the demo and the tests.
        </Text>
      </View>

      <SourceBadge source={answer?.source ?? directorySource} />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText} maxFontSizeMultiplier={1.6}>
            The last online request failed: {error.kind}. Offline lookup is still available.
          </Text>
          <PrimaryButton label="Retry the last question" variant="secondary" onPress={() => void retryLastQuery()} />
        </View>
      ) : null}

      <View style={styles.grid}>
        <InfoTile label="Intended users" value="Potato cooperative members, employers and innovation partners in Musanze." />
        <InfoTile label="Release version" value={`${APP_VERSION} (model ${MODEL_VERSION})`} />
        <InfoTile
          label="Status"
          value={
            isCheckingNetwork
              ? 'Checking connectivity…'
              : isOnline
                ? `Online via ${connectionType}`
                : 'Offline: bundled directory lookup only'
          }
        />
        <InfoTile label="Team members in the approved directory" value={`${directory.length}`} />
      </View>

      <PrimaryButton
        label="Ask the team"
        hint="Name, nickname, role or feature"
        onPress={() => navigation.navigate('Tabs', { screen: 'Ask' })}
      />
      <View style={styles.spacer} />
      <PrimaryButton
        label="Browse the directory"
        variant="secondary"
        onPress={() => navigation.navigate('Tabs', { screen: 'Directory' })}
      />
      <View style={styles.spacer} />
      <PrimaryButton
        label="About, evidence and limitations"
        variant="secondary"
        onPress={() => navigation.navigate('About')}
      />

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Who built what
      </Text>
      <Text style={styles.sectionHint} maxFontSizeMultiplier={1.6}>
        Manual selection is always available, with or without the AI search.
      </Text>
      {directory.slice(0, 3).map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          onPress={() =>
            navigation.navigate('MemberProfile', { memberId: member.id, fallbackName: member.fullName })
          }
        />
      ))}
      <View style={styles.chipRow}>
        <Chip label={`Group code ${GROUP_CODE}`} tone="primary" />
        <Chip label="Deterministic TF-IDF" />
        <Chip label="Offline capable" tone="warning" />
      </View>
    </ScrollView>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
      <Text style={styles.tileValue} maxFontSizeMultiplier={1.8}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  grid: {
    marginVertical: spacing.lg,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tileValue: {
    fontSize: 15,
    color: colors.text,
    marginTop: 4,
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
  },
  sectionHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  errorBox: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  errorText: {
    color: colors.onWarningSoft,
    marginBottom: spacing.sm,
    fontSize: 14,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
  },
  spacer: {
    height: spacing.md,
  },
});
