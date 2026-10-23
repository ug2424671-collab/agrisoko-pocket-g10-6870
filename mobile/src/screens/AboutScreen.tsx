import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { SourceBadge } from '../components/SourceBadge';
import { StateBanner } from '../components/StateBanner';
import { EvidenceLinkList } from '../components/EvidenceLinkList';
import {
  APK_ASSET_NAME,
  APP_VERSION,
  GROUP_CODE,
  LIMITATIONS,
  RELEASE_URL,
  REPOSITORY_URL,
} from '../config';
import { bundledMeta } from '../services/api';
import { ApiError, fetchHealth, fetchModelInfo, isApiConfigured } from '../services/api';
import { describeApiError, formatTimestamp, openEvidenceLink } from '../services/format';
import { cache } from '../services/storage';
import { useTeam } from '../context/TeamContext';
import { colors, radius, spacing } from '../theme';
import type { ApiErrorShape, HealthResponse, ModelInfoResponse } from '../types';

const REPO_LINKS = [
  { label: 'GitHub repository (group code included in the name)', url: REPOSITORY_URL, type: 'artifact' },
  { label: 'v1.0.0 release with the APK asset', url: RELEASE_URL, type: 'artifact' },
  { label: 'Dataset source: ai-api/data/members.json', url: `${REPOSITORY_URL}/blob/main/ai-api/data/members.json`, type: 'artifact' },
  { label: 'Evaluation report: ai-api/evaluation/RESULTS.md', url: `${REPOSITORY_URL}/blob/main/ai-api/evaluation/RESULTS.md`, type: 'artifact' },
];

export function AboutScreen() {
  const { isOnline, error: askError, groupCode } = useTeam();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthResponse, modelResponse] = await Promise.all([fetchHealth(), fetchModelInfo()]);
      setHealth(healthResponse);
      setModelInfo(modelResponse);
    } catch (caught) {
      const shape: ApiErrorShape =
        caught instanceof ApiError
          ? caught.shape
          : { kind: 'server', message: 'The service information could not be loaded.' };
      setError(shape);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openLink = async (url: string, label: string) => {
    const opened = await openEvidenceLink({ url, label, type: 'artifact' });
    if (!opened) {
      setLinkMessage(`This device could not open: ${url}`);
    } else {
      setLinkMessage(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SourceBadge source={isOnline ? 'live' : 'offline'} />

      <Text style={styles.title} maxFontSizeMultiplier={1.5}>
        About AgriSoko Pocket {groupCode}
      </Text>
      <Text style={styles.body} maxFontSizeMultiplier={1.7}>
        A small product for a short demonstration: a visitor asks about a team member and receives a profile that
        links every claim back to repository, test and demonstration evidence.
      </Text>

      <Section title="Build and verification">
        <KeyValue label="Application name" value={`AgriSoko Pocket ${GROUP_CODE}`} />
        <KeyValue label="Group verification code" value={GROUP_CODE} />
        <KeyValue label="APK version" value={APP_VERSION} />
        <KeyValue label="APK file name" value={APK_ASSET_NAME} />
        <KeyValue label="Bundled dataset fingerprint" value={bundledMeta.datasetFingerprint.slice(0, 32)} />
        <KeyValue label="Bundled data synced at" value={bundledMeta.generatedAt} />
        <KeyValue label="Bundled member count" value={`${bundledMeta.memberCount}`} />
      </Section>

      <Section title="AI approach">
        <KeyValue label="Model version" value={modelInfo?.modelVersion ?? bundledMeta.modelVersion} />
        <KeyValue label="Vectorizer" value={modelInfo?.vectorizerType ?? 'Deterministic TF-IDF (word + char_wb)'} />
        <KeyValue label="Similarity and confidence" value={modelInfo?.confidenceMethod ?? modelInfo?.similarity ?? '0.6 × cosine + 0.4 × query-term coverage'} />
        <KeyValue label="Confidence threshold" value={`${(modelInfo?.threshold ?? 0.45).toFixed(2)}`} />
        <KeyValue label="Alias rule" value={modelInfo?.aliasBoost ?? 'Exact full name or alias raises the score to 0.97.'} />
        <KeyValue label="Features fitted" value={modelInfo?.features ?? 'Available when the service is reachable'} />
        <KeyValue label="Build commit" value={modelInfo?.buildCommit ?? 'Reconnect to read the service build commit'} />
      </Section>

      <Section title="Service status">
        {!isApiConfigured ? (
          <Text style={styles.note} maxFontSizeMultiplier={1.7}>
            No API base URL was configured for this build, so only offline lookup is available.
          </Text>
        ) : null}
        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.note} maxFontSizeMultiplier={1.7}>
              Reading /health and /model-info…
            </Text>
          </View>
        ) : null}
        {error ? (
          <StateBanner tone="danger" message={describeApiError(error)} onRetry={() => void load()} />
        ) : null}
        {askError ? (
          <StateBanner message={`The last /ask request failed: ${askError.kind}.`} />
        ) : null}
        <KeyValue label="API status" value={health ? `${health.status} (service v${health.version})` : 'unknown'} />
        <KeyValue label="Server dataset fingerprint" value={health?.datasetFingerprint.slice(0, 32) ?? 'unavailable'} />
        <KeyValue label="Server member count" value={health ? `${health.memberCount}` : 'unavailable'} />
        <KeyValue label="Evaluation: top-1 accuracy" value={modelInfo?.evaluation ? modelInfo.evaluation.top1Accuracy.toFixed(3) : 'not published yet'} />
        <KeyValue
          label="Evaluation: no-match rejection"
          value={modelInfo?.evaluation ? modelInfo.evaluation.noMatchRejectionAccuracy.toFixed(3) : 'not published yet'}
        />
        <KeyValue
          label="Evaluation generated"
          value={modelInfo?.evaluation?.generatedAt ?? 'run python ai-api/scripts/evaluate.py'}
        />
        <PrimaryButton label="Refresh service information" variant="secondary" onPress={() => void load()} />
      </Section>

      <Section title="Limitations and responsible AI">
        {(modelInfo?.limitations ?? LIMITATIONS).map((limitation) => (
          <Text key={limitation} style={styles.bullet} maxFontSizeMultiplier={1.7}>
            • {limitation}
          </Text>
        ))}
        <Text style={styles.note} maxFontSizeMultiplier={1.7}>
          Privacy: no phone numbers, home addresses, passwords or tokens are stored in members.json or in the app. A
          tester quote appears only with recorded consent and a named tester category.
        </Text>
      </Section>

      <Section title="Repository and release evidence">
        <EvidenceLinkList links={REPO_LINKS} />
        {linkMessage ? <StateBanner tone="danger" message={linkMessage} /> : null}
      </Section>

      <Section title="Local data">
        <Text style={styles.note} maxFontSizeMultiplier={1.7}>
          The app caches the directory, the last answer and recently opened profiles on this phone. Clearing them
          keeps the bundled directory available.
        </Text>
        <PrimaryButton
          label="Clear cached data on this phone"
          variant="secondary"
          onPress={async () => {
            await cache.clear();
            setLinkMessage('Local cache cleared. The bundled directory is still available.');
          }}
        />
        {linkMessage && !linkMessage.startsWith('This device') ? (
          <Text style={styles.note} maxFontSizeMultiplier={1.7}>
            {linkMessage}
          </Text>
        ) : null}
      </Section>

      <Text style={styles.footer} maxFontSizeMultiplier={1.6}>
        Group verification code {GROUP_CODE} · APK version {APP_VERSION} · checked {formatTimestamp(Date.now())}
      </Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel} maxFontSizeMultiplier={1.6}>
        {label}
      </Text>
      <Text style={styles.kvValue} maxFontSizeMultiplier={1.7}>
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
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  kv: {
    marginBottom: spacing.sm,
  },
  kvLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kvValue: {
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
  note: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  footer: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
