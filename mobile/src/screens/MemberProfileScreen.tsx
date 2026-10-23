import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';

import { Chip } from '../components/Chip';
import { EvidenceLinkList } from '../components/EvidenceLinkList';
import { PrimaryButton } from '../components/PrimaryButton';
import { StateBanner } from '../components/StateBanner';
import { ApiError, fetchMember, isApiConfigured } from '../services/api';
import { describeApiError, formatTimestamp } from '../services/format';
import { toOfflineProfile } from '../data/members';
import { useTeam } from '../context/TeamContext';
import { cache } from '../services/storage';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import type { ApiErrorShape, MemberProfile } from '../types';

type ProfileRoute = RouteProp<RootStackParamList, 'MemberProfile'>;

export function MemberProfileScreen() {
  const route = useRoute<ProfileRoute>();
  const { memberId } = route.params;
  const { findMember, isOnline, answer } = useTeam();

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [origin, setOrigin] = useState<'live' | 'cached' | 'offline'>('offline');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<ApiErrorShape | null>(null);

  const directoryMember = findMember(memberId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const profiles = (await cache.readProfiles()) as Record<string, MemberProfile>;
    const cachedProfile = profiles[memberId];

    if (!isOnline || !isApiConfigured) {
      if (cachedProfile) {
        setProfile(cachedProfile);
        setOrigin('cached');
      } else if (directoryMember) {
        setProfile(toOfflineProfile(directoryMember));
        setOrigin('offline');
      } else if (answer?.member?.id === memberId) {
        setProfile(answer.member);
        setOrigin('cached');
      } else {
        setProfile(null);
      }
      setLoading(false);
      return;
    }

    if (cachedProfile) {
      // Show something useful immediately, then refresh from the service.
      setProfile(cachedProfile);
      setOrigin('cached');
    }

    try {
      const live = await fetchMember(memberId);
      setProfile(live);
      setOrigin('live');
      await cache.writeProfiles({ ...profiles, [memberId]: live });
    } catch (caught) {
      const shape: ApiErrorShape =
        caught instanceof ApiError
          ? caught.shape
          : { kind: 'server', message: 'The profile could not be loaded.' };
      setError(shape);
      if (!cachedProfile) {
        if (directoryMember) {
          setProfile(toOfflineProfile(directoryMember));
          setOrigin('offline');
        } else if (answer?.member?.id === memberId) {
          setProfile(answer.member);
          setOrigin('cached');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [answer, directoryMember, isOnline, memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText} maxFontSizeMultiplier={1.6}>
          Loading the approved profile…
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <StateBanner
          tone="danger"
          message={`No approved profile is available for "${route.params.fallbackName ?? memberId}" on this phone.`}
          onRetry={() => void load()}
        />
        <Text style={styles.body} maxFontSizeMultiplier={1.7}>
          The member may have been removed from members.json, or the directory has not been synced yet.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View
        style={[
          styles.origin,
          origin === 'live' ? styles.originLive : origin === 'cached' ? styles.originCached : styles.originOffline,
        ]}
      >
        <Text style={styles.originText} maxFontSizeMultiplier={1.6}>
          {origin === 'live'
            ? 'Live profile from the AI service'
            : origin === 'cached'
              ? 'Cached profile: last successful online copy'
              : 'Offline record: bundled directory facts only'}
        </Text>
      </View>

      {error ? (
        <StateBanner tone="danger" message={describeApiError(error)} onRetry={() => void load()} />
      ) : null}

      <Text style={styles.name} maxFontSizeMultiplier={1.5}>
        {profile.fullName}
      </Text>
      <Text style={styles.role} maxFontSizeMultiplier={1.7}>
        {profile.role}
      </Text>
      <Text style={styles.meta} maxFontSizeMultiplier={1.6}>
        Registration number: {profile.registrationNumber} · GitHub: @{profile.githubUsername}
      </Text>
      <Text style={styles.meta} maxFontSizeMultiplier={1.6}>
        Also known as: {profile.aliases.join(', ') || 'no alias recorded'}
      </Text>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Professional value
      </Text>
      <View style={styles.introCard}>
        <Text style={styles.intro} maxFontSizeMultiplier={1.8}>
          {profile.introductionDraft}
        </Text>
      </View>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        <Text style={styles.bold}>Target user: </Text>
        {profile.targetUser}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        <Text style={styles.bold}>Problem addressed: </Text>
        {profile.problem}
      </Text>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Owned contribution
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        {profile.contribution}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        <Text style={styles.bold}>Featured component: </Text>
        {profile.feature}
      </Text>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Skills
      </Text>
      <View style={styles.chipRow}>
        {profile.skills.map((skill) => (
          <Chip key={skill} label={skill} tone="primary" />
        ))}
      </View>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Measured evidence
      </Text>
      <View style={styles.metricCard}>
        <Text style={styles.metric} maxFontSizeMultiplier={1.7}>
          {profile.outcomeMetric}
        </Text>
      </View>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Repository and demonstration evidence
      </Text>
      <EvidenceLinkList links={profile.evidenceLinks} />
      <View style={styles.linkGrid}>
        {profile.issueUrl ? <Chip label="Owned issue" tone="primary" /> : null}
        {profile.branchName ? <Chip label={`Branch: ${profile.branchName}`} /> : null}
        {profile.pullRequestUrl ? <Chip label="Pull request" tone="primary" /> : null}
        {profile.reviewedCommitUrl ? <Chip label="Reviewed commit" /> : null}
        {profile.mergedCommitUrl ? <Chip label="Merged commit" tone="primary" /> : null}
        {profile.reviewedPullRequestUrl ? <Chip label="Peer review" tone="warning" /> : null}
        {profile.demoTimestamp ? <Chip label={`Demo at ${profile.demoTimestamp}`} /> : null}
        {profile.personalClipUrl ? <Chip label="Personal clip" /> : null}
      </View>

      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        Tester feedback
      </Text>
      {profile.testerFeedback.length ? (
        profile.testerFeedback.map((feedback) => (
          <View key={`${feedback.category}-${feedback.quote.slice(0, 12)}`} style={styles.feedbackCard}>
            <Text style={styles.feedbackQuote} maxFontSizeMultiplier={1.7}>
              “{feedback.quote}”
            </Text>
            <Text style={styles.feedbackMeta} maxFontSizeMultiplier={1.6}>
              Tester category: {feedback.category}
              {feedback.consent
                ? feedback.name
                  ? ` · named with consent: ${feedback.name}`
                  : ' · consent recorded, kept anonymous'
                : ' · no consent to quote'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.body} maxFontSizeMultiplier={1.7}>
          No consented tester feedback is stored for this member in the offline record.
        </Text>
      )}

      <PrimaryButton label="Reload this profile" variant="secondary" onPress={() => void load()} />

      <Text style={styles.footer} maxFontSizeMultiplier={1.6}>
        {profile.evidenceLinks.length
          ? `Evidence links checked ${origin === 'live' ? 'from the AI service' : 'from the cached copy'}.`
          : 'Reconnect to load the approved evidence links for this member.'}
      </Text>
      <Text style={styles.footer} maxFontSizeMultiplier={1.6}>
        Last refresh {formatTimestamp(answer?.storedAt ?? Date.now())}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    fontSize: 15,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
    backgroundColor: colors.background,
  },
  origin: {
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  originLive: { backgroundColor: colors.primary },
  originCached: { backgroundColor: colors.warning },
  originOffline: { backgroundColor: colors.offline },
  originText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  role: {
    fontSize: 16,
    color: colors.primaryDark,
    marginTop: 2,
  },
  meta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
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
    marginBottom: spacing.md,
  },
  intro: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bold: {
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  metric: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.primaryDark,
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackQuote: {
    fontSize: 15,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 22,
  },
  feedbackMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
