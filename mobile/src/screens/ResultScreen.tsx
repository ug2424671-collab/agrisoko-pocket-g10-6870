import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Chip } from '../components/Chip';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { EvidenceLinkList } from '../components/EvidenceLinkList';
import { MemberCard } from '../components/MemberCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SourceBadge } from '../components/SourceBadge';
import { StateBanner } from '../components/StateBanner';
import { useTeam } from '../context/TeamContext';
import { formatConfidence, formatTimestamp } from '../services/format';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { MemberProfile } from '../types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function ResultScreen() {
  const navigation = useNavigation<Navigation>();
  const {
    answer,
    isAsking,
    error,
    isOnline,
    retryLastQuery,
    refreshNetwork,
    directory,
    findMember,
  } = useTeam();
  const [profile, setProfile] = useState<MemberProfile | null>(null);

  // A live answer already carries the full approved profile.
  useEffect(() => {
    if (answer?.member && answer.source !== 'offline') {
      setProfile(answer.member);
      return;
    }
    if (answer?.member) {
      setProfile(answer.member);
      return;
    }
    setProfile(null);
  }, [answer]);

  const openProfile = useCallback(
    (memberId: string) => {
      const known = findMember(memberId);
      navigation.navigate('MemberProfile', { memberId, fallbackName: known?.fullName });
    },
    [findMember, navigation],
  );

  if (!answer) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title} maxFontSizeMultiplier={1.6}>
          No AI result yet
        </Text>
        <Text style={styles.body} maxFontSizeMultiplier={1.7}>
          Ask a question about a team member and the grounded profile will appear here. You can also pick a member
          manually from the directory.
        </Text>
        <PrimaryButton label="Ask a question" onPress={() => navigation.navigate('Tabs', { screen: 'Ask' })} />
        <View style={styles.spacer} />
        <PrimaryButton
          label="Open the team directory"
          variant="secondary"
          onPress={() => navigation.navigate('Tabs', { screen: 'Directory' })}
        />
      </ScrollView>
    );
  }

  const isNoMatch = answer.member === null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SourceBadge source={answer.source} />

      <View style={styles.queryBox}>
        <Text style={styles.queryLabel} maxFontSizeMultiplier={1.6}>
          Your question
        </Text>
        <Text style={styles.queryText} maxFontSizeMultiplier={1.7}>
          {answer.query}
        </Text>
        <Text style={styles.timestamp} maxFontSizeMultiplier={1.6}>
          Saved {formatTimestamp(answer.storedAt)} · model {answer.modelVersion}
        </Text>
      </View>

      {error ? (
        <StateBanner
          tone="danger"
          message="The last online request failed, so this result comes from a fallback source."
          onRetry={() => void retryLastQuery()}
        />
      ) : null}

      {!isOnline ? (
        <StateBanner
          message="Offline mode: this result comes from the bundled directory or the cache, not from the AI service."
          onRetry={refreshNetwork}
          retryLabel="Recheck network"
        />
      ) : null}

      <View style={styles.confidenceCard}>
        <View style={styles.confidenceHeader}>
          <Text style={styles.confidenceTitle} maxFontSizeMultiplier={1.6}>
            Confidence
          </Text>
          <Text style={styles.confidenceValue} maxFontSizeMultiplier={1.6}>
            {answer.source === 'offline' && isNoMatch ? 'n/a' : formatConfidence(answer.confidence)}
          </Text>
        </View>
        <ConfidenceMeter value={answer.confidence} threshold={answer.threshold || 0.45} />
        <Text style={styles.reason} maxFontSizeMultiplier={1.7}>
          {answer.reason}
        </Text>
        {answer.threshold ? (
          <Text style={styles.threshold} maxFontSizeMultiplier={1.6}>
            Threshold {answer.threshold.toFixed(2)} · the red marker shows where a match would be rejected
          </Text>
        ) : null}
        {answer.matchedTerms.length ? (
          <View style={styles.termRow}>
            {answer.matchedTerms.slice(0, 6).map((term) => (
              <Chip key={term} label={term} tone="primary" />
            ))}
          </View>
        ) : null}
      </View>

      {isAsking ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText} maxFontSizeMultiplier={1.6}>
            Asking the AI service again…
          </Text>
        </View>
      ) : null}

      {isNoMatch ? (
        <View style={styles.noMatch}>
          <Text style={styles.noMatchTitle} maxFontSizeMultiplier={1.6}>
            No confident match found
          </Text>
          <Text style={styles.body} maxFontSizeMultiplier={1.7}>
            {answer.source === 'offline'
              ? 'Offline mode only answers exact name, nickname, role or feature questions.'
              : 'The question did not reach the confidence threshold, so no profile was invented.'}
          </Text>
          {answer.topCandidates.length ? (
            <Text style={styles.candidates} maxFontSizeMultiplier={1.7}>
              Closest records: {answer.topCandidates.map((candidate) => `${candidate.fullName} (${formatConfidence(candidate.confidence)})`).join(', ')}
            </Text>
          ) : null}
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
            Try one of these instead
          </Text>
          {answer.suggestions.slice(0, 6).map((suggestion) => (
            <Text key={`${suggestion.kind}-${suggestion.label}`} style={styles.suggestion} maxFontSizeMultiplier={1.7}>
              • {suggestion.label} ({suggestion.kind})
            </Text>
          ))}
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
            Generated introduction
          </Text>
          <View style={styles.introCard}>
            <Text style={styles.intro} maxFontSizeMultiplier={1.8}>
              {answer.introduction}
            </Text>
          </View>

          {answer.offlineLookup ? (
            <Text style={styles.note} maxFontSizeMultiplier={1.7}>
              Offline exact {answer.offlineLookup.matchedKind} match on “{answer.offlineLookup.matchedValue}”. No AI
              scoring was applied, and the full profile needs the service.
            </Text>
          ) : null}

          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
            Evidence links
          </Text>
          <EvidenceLinkList links={answer.evidenceLinks} />

          <PrimaryButton
            label="Open the full member profile"
            onPress={() => openProfile(answer.member!.id)}
            hint="Contribution, skills, measured evidence and links"
          />
        </>
      )}

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Directory fallback
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        The AI search is never the only way to reach a profile.
      </Text>
      {directory.map((member) => (
        <MemberCard key={member.id} member={member} onPress={() => openProfile(member.id)} />
      ))}

      {answer.topCandidates.length && !isNoMatch ? (
        <>
          <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
            Other ranked candidates
          </Text>
          {answer.topCandidates.slice(1).map((candidate) => (
            <Text key={candidate.id} style={styles.suggestion} maxFontSizeMultiplier={1.7}>
              • {candidate.fullName} ({formatConfidence(candidate.confidence)})
            </Text>
          ))}
        </>
      ) : null}

      {profile && answer.source === 'offline' ? (
        <Text style={styles.fingerprint} maxFontSizeMultiplier={1.6}>
          Offline result stored on this phone. Reconnect to refresh the dataset fingerprint.
        </Text>
      ) : null}
      {answer.datasetFingerprint ? (
        <Text style={styles.fingerprint} maxFontSizeMultiplier={1.6}>
          Dataset fingerprint {answer.datasetFingerprint.slice(0, 16)}…
        </Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  spacer: { height: spacing.md },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  queryBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  queryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  queryText: {
    fontSize: 17,
    color: colors.text,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  confidenceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confidenceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  confidenceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  reason: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  threshold: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  termRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
  },
  noMatch: {
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  noMatchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onWarningSoft,
  },
  candidates: {
    fontSize: 14,
    color: colors.onWarningSoft,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.md,
  },
  intro: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  note: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  suggestion: {
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  fingerprint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
