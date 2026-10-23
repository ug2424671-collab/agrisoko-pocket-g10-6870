import AsyncStorage from '@react-native-async-storage/async-storage';

import { CACHE_KEYS, GROUP_CODE } from '../config';
import type { AnswerView, DirectoryMember } from '../types';

/**
 * Small typed wrapper around AsyncStorage.
 *
 * Every read tolerates corrupt or partial data: a bad cache must never crash
 * the app or hide the bundled directory.
 */
async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working with in-memory state.
  }
}

export const cache = {
  readDirectory(): Promise<DirectoryMember[] | null> {
    return readJson<DirectoryMember[] | null>(CACHE_KEYS.directory, null);
  },
  writeDirectory(members: DirectoryMember[]): Promise<void> {
    return writeJson(CACHE_KEYS.directory, members);
  },
  readProfiles(): Promise<Record<string, unknown>> {
    return readJson<Record<string, unknown>>(CACHE_KEYS.memberProfiles, {});
  },
  writeProfiles(profiles: Record<string, unknown>): Promise<void> {
    return writeJson(CACHE_KEYS.memberProfiles, profiles);
  },
  readLastAnswer(): Promise<AnswerView | null> {
    return readJson<AnswerView | null>(CACHE_KEYS.lastAnswer, null);
  },
  writeLastAnswer(answer: AnswerView): Promise<void> {
    return writeJson(CACHE_KEYS.lastAnswer, answer);
  },
  readHistory(): Promise<string[]> {
    return readJson<string[]>(CACHE_KEYS.searchHistory, []);
  },
  async appendHistory(query: string): Promise<string[]> {
    const history = await cache.readHistory();
    const next = [query, ...history.filter((item) => item !== query)].slice(0, 10);
    await writeJson(CACHE_KEYS.searchHistory, next);
    return next;
  },
  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    } catch {
      // Ignore: clearing the cache is best effort.
    }
  },
};

export const cacheScope = GROUP_CODE;
