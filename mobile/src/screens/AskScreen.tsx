import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { PrimaryButton } from '../components/PrimaryButton';
import { StateBanner } from '../components/StateBanner';
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from '../config';
import { useTeam } from '../context/TeamContext';
import { cache } from '../services/storage';
import { describeApiError } from '../services/format';
import { validateQuery } from '../services/validation';
import { colors, radius, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const BASE_EXAMPLES = [
  'Who is the AI and data engineer?',
  'Who built offline mode?',
  'Who owns the API contract?',
];

export function AskScreen() {
  const navigation = useNavigation<Navigation>();
  const { ask, isAsking, error, isOnline, directory, clearError } = useTeam();
  const [query, setQuery] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  // The first suggestion is built from the approved directory, so it can never
  // name somebody who is not in the dataset.
  const examples = directory.length
    ? [`Tell me about ${directory[0].aliases[0] ?? directory[0].fullName}`, ...BASE_EXAMPLES]
    : BASE_EXAMPLES;
  const [crashGuard, setCrashGuard] = useState<string | null>(null);

  useEffect(() => {
    void cache.readHistory().then(setHistory);
  }, []);

  const submit = useCallback(
    async (value: string) => {
      const validation = validateQuery(value);
      if (!validation.valid) {
        setValidationMessage(validation.message ?? 'The question cannot be sent.');
        return;
      }
      setValidationMessage(null);
      try {
        await ask(value.trim());
        setHistory(await cache.readHistory());
        navigation.navigate('Tabs', { screen: 'Result' });
      } catch {
        // The context already stored a precise error; keep the user on this screen.
        setCrashGuard('The service did not answer. Your last saved result is still available in the Result tab.');
      }
    },
    [ask, navigation],
  );

  const remaining = MAX_QUERY_LENGTH - query.length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} maxFontSizeMultiplier={1.5}>
          Ask about a team member
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.7}>
          Use a name, nickname, role or feature. Matching is deterministic keyword retrieval, so specific words work
          best.
        </Text>

        {!isOnline ? (
          <StateBanner message="You are offline. Exact name, nickname, role and feature answers still work from the bundled directory." />
        ) : null}

        {error ? <StateBanner tone="danger" message={describeApiError(error)} onRetry={clearError} retryLabel="Dismiss" /> : null}
        {crashGuard ? <StateBanner message={crashGuard} onRetry={() => setCrashGuard(null)} retryLabel="Dismiss" /> : null}

        <Text style={styles.label} maxFontSizeMultiplier={1.6} nativeID="question-label">
          Your question
        </Text>
        <TextInput
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            if (validationMessage) {
              setValidationMessage(null);
            }
          }}
          placeholder="For example: Who built offline mode?"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, validationMessage ? styles.inputError : null]}
          multiline
          numberOfLines={3}
          maxLength={MAX_QUERY_LENGTH + 50}
          accessibilityLabel="Question about a team member"
          accessibilityHint={`Between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters`}
          accessibilityLabelledBy="question-label"
          returnKeyType="send"
          onSubmitEditing={() => void submit(query)}
        />
        <Text style={[styles.counter, remaining < 0 ? styles.counterError : null]} maxFontSizeMultiplier={1.6}>
          {query.trim().length} characters used, {Math.max(0, remaining)} left
        </Text>

        {validationMessage ? (
          <StateBanner tone="danger" message={validationMessage} />
        ) : null}

        <PrimaryButton
          label={isAsking ? 'Asking the AI service…' : 'Ask the team'}
          disabled={isAsking}
          onPress={() => void submit(query)}
          hint={isOnline ? 'Validated then sent to POST /ask' : 'Uses offline directory lookup'}
        />

        {isAsking ? (
          <View style={styles.loading} accessibilityRole="progressbar" accessibilityLabel="Waiting for the AI service">
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText} maxFontSizeMultiplier={1.6}>
              Matching your question against the approved member records…
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
          Example questions
        </Text>
        {examples.map((example) => (
          <Pressable
            key={example}
            onPress={() => setQuery(example)}
            accessibilityRole="button"
            accessibilityLabel={`Use the example question: ${example}`}
            style={({ pressed }) => [styles.example, pressed && styles.examplePressed]}
          >
            <Text style={styles.exampleText} maxFontSizeMultiplier={1.7}>
              {example}
            </Text>
          </Pressable>
        ))}

        {directory.length ? (
          <>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
              Try a name from the directory
            </Text>
            <View style={styles.chipRow}>
              {directory.map((member) => (
                <Pressable
                  key={member.id}
                  onPress={() => setQuery(`Tell me about ${member.aliases[0] ?? member.fullName}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask about ${member.fullName}`}
                  style={({ pressed }) => [styles.nameChip, pressed && styles.examplePressed]}
                >
                  <Text style={styles.nameChipText} maxFontSizeMultiplier={1.6}>
                    {member.fullName.split(' ')[0]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {history.length ? (
          <>
            <Text style={styles.sectionTitle} maxFontSizeMultiplier={1.6}>
              Recent questions on this phone
            </Text>
            {history.slice(0, 5).map((item) => (
              <Pressable
                key={item}
                onPress={() => void submit(item)}
                accessibilityRole="button"
                accessibilityLabel={`Ask again: ${item}`}
                style={({ pressed }) => [styles.example, pressed && styles.examplePressed]}
              >
                <Text style={styles.historyText} maxFontSizeMultiplier={1.7}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    minHeight: 84,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.danger,
  },
  counter: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  counterError: {
    color: colors.danger,
    fontWeight: '700',
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
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  example: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  examplePressed: {
    backgroundColor: colors.surfaceMuted,
  },
  exampleText: {
    fontSize: 15,
    color: colors.primaryDark,
  },
  historyText: {
    fontSize: 15,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  nameChip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  nameChipText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
});
