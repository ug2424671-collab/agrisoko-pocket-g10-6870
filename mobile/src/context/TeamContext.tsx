import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { GROUP_CODE } from '../config';
import { ApiError, askTeam, bundledDirectory, fetchDirectory } from '../services/api';
import { lookupOffline } from '../services/offline';
import { cache } from '../services/storage';
import { toOfflineProfile } from '../data/members';
import type {
  AnswerView,
  ApiErrorShape,
  DirectoryMember,
  MemberProfile,
  SourceKind,
} from '../types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface TeamContextValue {
  groupCode: string;
  isOnline: boolean;
  isCheckingNetwork: boolean;
  connectionType: string;
  refreshNetwork: () => void;
  directory: DirectoryMember[];
  directorySource: SourceKind;
  isAsking: boolean;
  error: ApiErrorShape | null;
  answer: AnswerView | null;
  lastSavedAt: number | null;
  ask: (query: string) => Promise<AnswerView>;
  retryLastQuery: () => Promise<AnswerView | null>;
  refreshDirectory: () => Promise<void>;
  findMember: (memberId: string) => DirectoryMember | undefined;
  clearError: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { isOnline, isChecking, connectionType, refresh } = useNetworkStatus();
  const [directory, setDirectory] = useState<DirectoryMember[]>(bundledDirectory);
  const [directorySource, setDirectorySource] = useState<SourceKind>('offline');
  const [isAsking, setAsking] = useState(false);
  const [error, setError] = useState<ApiErrorShape | null>(null);
  const [answer, setAnswer] = useState<AnswerView | null>(null);

  // Restore the cached directory and the last useful answer at startup.
  useEffect(() => {
    let active = true;
    (async () => {
      const cachedDirectory = await cache.readDirectory();
      if (active && cachedDirectory?.length) {
        setDirectory(cachedDirectory);
        setDirectorySource('cached');
      }
      const cachedAnswer = await cache.readLastAnswer();
      if (active && cachedAnswer) {
        setAnswer(cachedAnswer);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const refreshDirectory = useCallback(async () => {
    try {
      const remote = await fetchDirectory();
      if (remote.length) {
        setDirectory(remote);
        setDirectorySource('live');
        await cache.writeDirectory(remote);
      }
    } catch {
      // Keep the bundled or cached directory; the chip already reports offline.
    }
  }, []);

  useEffect(() => {
    if (isOnline) {
      void refreshDirectory();
    }
  }, [isOnline, refreshDirectory]);

  const buildOfflineAnswer = useCallback(
    (query: string): AnswerView | null => {
      const result = lookupOffline(query, directory);
      if (!result) {
        return null;
      }
      const profile: MemberProfile = toOfflineProfile(result.member);
      return {
        query,
        source: 'offline',
        confidence: 1,
        threshold: 0,
        reason: `Offline exact ${result.matchedKind} match on "${result.matchedValue}". No AI scoring was used.`,
        matchedTerms: [result.matchedValue],
        introduction: profile.introductionDraft,
        evidenceLinks: [],
        member: profile,
        suggestions: directory.slice(0, 5).map((member) => ({ label: member.fullName, kind: 'name' as const })),
        topCandidates: [],
        modelVersion: 'offline-exact-lookup',
        datasetFingerprint: '',
        storedAt: Date.now(),
        offlineLookup: result,
      };
    },
    [directory],
  );

  const ask = useCallback(
    async (query: string): Promise<AnswerView> => {
      setAsking(true);
      setError(null);
      await cache.appendHistory(query);

      const settle = async (next: AnswerView, source: SourceKind) => {
        const value = { ...next, source, storedAt: Date.now() };
        setAnswer(value);
        await cache.writeLastAnswer(value);
        return value;
      };

      if (!isOnline) {
        const offline = buildOfflineAnswer(query);
        setAsking(false);
        if (offline) {
          return settle(offline, 'offline');
        }
        const noMatch: AnswerView = {
          query,
          source: 'offline',
          confidence: 0,
          threshold: 0,
          reason:
            'Offline mode only answers exact name, nickname, role or feature questions from the bundled directory. Reconnect for AI matching.',
          matchedTerms: [],
          introduction: null,
          evidenceLinks: [],
          member: null,
          suggestions: directory.slice(0, 5).map((member) => ({ label: member.fullName, kind: 'name' as const })),
          topCandidates: [],
          modelVersion: 'offline-exact-lookup',
          datasetFingerprint: '',
          storedAt: Date.now(),
          offlineLookup: null,
        };
        // An offline miss is not an error: it is an honest limitation.
        await settle(noMatch, 'offline');
        return noMatch;
      }

      try {
        const response = await askTeam(query);
        const view: AnswerView = {
          query: response.query,
          source: 'live',
          confidence: response.confidence,
          threshold: response.threshold,
          reason: response.reason,
          matchedTerms: response.matchedTerms,
          introduction: response.introduction,
          evidenceLinks: response.evidenceLinks,
          member: response.match,
          suggestions: response.suggestions,
          topCandidates: response.topCandidates,
          modelVersion: response.modelVersion,
          datasetFingerprint: response.datasetFingerprint,
          storedAt: Date.now(),
          offlineLookup: null,
        };
        return await settle(view, 'live');
      } catch (caught) {
        const shape: ApiErrorShape =
          caught instanceof ApiError
            ? caught.shape
            : { kind: 'server', message: 'Unexpected error while asking the AI service.' };
        setError(shape);

        const offline = buildOfflineAnswer(query);
        if (offline) {
          const view = await settle(offline, 'offline');
          return view;
        }
        if (answer) {
          // Keep the last useful result visible instead of losing it.
          return answer;
        }
        throw caught;
      } finally {
        setAsking(false);
      }
    },
    [answer, buildOfflineAnswer, directory, isOnline],
  );

  const retryLastQuery = useCallback(async () => {
    if (!answer) {
      return null;
    }
    return ask(answer.query);
  }, [answer, ask]);

  const findMember = useCallback(
    (memberId: string) => directory.find((member) => member.id === memberId),
    [directory],
  );

  const value = useMemo<TeamContextValue>(
    () => ({
      groupCode: GROUP_CODE,
      isOnline,
      isCheckingNetwork: isChecking,
      connectionType,
      refreshNetwork: refresh,
      directory,
      directorySource,
      isAsking,
      error,
      answer,
      lastSavedAt: answer?.storedAt ?? null,
      ask,
      retryLastQuery,
      refreshDirectory,
      findMember,
      clearError: () => setError(null),
    }),
    [
      answer,
      ask,
      connectionType,
      directory,
      directorySource,
      error,
      findMember,
      isChecking,
      isOnline,
      refresh,
      refreshDirectory,
      retryLastQuery,
    ],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

export function useTeam(): TeamContextValue {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used inside TeamProvider');
  }
  return context;
}
