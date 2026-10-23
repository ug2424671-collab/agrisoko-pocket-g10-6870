/**
 * Runtime configuration.
 *
 * Values come from `app.json -> expo.extra` and are injected by Expo at build
 * time, so the same source can be pointed at a different FastAPI host with
 * EXPO_PUBLIC_API_BASE_URL. No credentials are stored in the app.
 *
 * `Constants.expoConfig.extra` supplies the defaults below. It is imported
 * lazily so the shared configuration module stays loadable by the Node-based
 * checks in `scripts/`.
 */
type Extra = {
  groupCode?: string;
  apiBaseUrl?: string;
  requestTimeoutMs?: number;
  confidenceThreshold?: number;
  modelVersion?: string;
};

function readExtra(): Extra {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const constants = require('expo-constants');
    const resolved = constants?.default ?? constants;
    return (resolved?.expoConfig?.extra ?? {}) as Extra;
  } catch {
    return {};
  }
}

const extra = readExtra();

/** Kept in step with app.json -> expo.version. */
const APP_VERSION_FALLBACK = '1.0.0';


function fromEnv(value: string | undefined, fallback: string): string {
  const trimmed = (value ?? '').trim();
  return trimmed.length ? trimmed : fallback;
}

function envNumber(value: string | undefined, fallback: number): number {
  const parsed = Number((value ?? '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Empty string means "no online service configured"; the app stays usable offline. */
export const API_BASE_URL = fromEnv(process.env.EXPO_PUBLIC_API_BASE_URL, extra.apiBaseUrl ?? '').replace(/\/+$/, '');

export const REQUEST_TIMEOUT_MS = envNumber(process.env.EXPO_PUBLIC_REQUEST_TIMEOUT_MS, extra.requestTimeoutMs ?? 8000);

export const GROUP_CODE = fromEnv(process.env.EXPO_PUBLIC_GROUP_CODE, extra.groupCode ?? 'GXX');

export const CONFIDENCE_THRESHOLD = envNumber(
  process.env.EXPO_PUBLIC_CONFIDENCE_THRESHOLD,
  extra.confidenceThreshold ?? 0.45,
);

export const MODEL_VERSION = fromEnv(process.env.EXPO_PUBLIC_MODEL_VERSION, extra.modelVersion ?? 'agrisoko-tfidf-v1');

export const APP_VERSION = APP_VERSION_FALLBACK;

export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 300;

export const REPOSITORY_URL = 'https://github.com/ug2424671-collab/agrisoko-pocket-gxx';
export const RELEASE_URL = `${REPOSITORY_URL}/releases/tag/v1.0.0`;
export const APK_ASSET_NAME = `AgriSokoPocket_${GROUP_CODE}.apk`;

export const CACHE_KEYS = {
  directory: `agrisoko:${GROUP_CODE}:directory:v1`,
  memberProfiles: `agrisoko:${GROUP_CODE}:profiles:v1`,
  lastAnswer: `agrisoko:${GROUP_CODE}:last-answer:v1`,
  searchHistory: `agrisoko:${GROUP_CODE}:history:v1`,
} as const;

export const LIMITATIONS = [
  'Matching is deterministic keyword retrieval (TF-IDF and character shingles), not a language model.',
  'A profile can only repeat facts approved in ai-api/data/members.json.',
  'Offline mode supports exact name, nickname and role lookup only; it does not score questions.',
  'Confidence is a retrieval score, never a claim that a profile is true.',
];
