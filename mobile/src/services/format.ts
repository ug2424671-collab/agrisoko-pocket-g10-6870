import { Linking } from 'react-native';

import type { ApiErrorShape, EvidenceLink } from '../types';

export function formatConfidence(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatTimestamp(millis: number): string {
  const date = new Date(millis);
  return date.toLocaleString();
}

export function shorten(value: string, max = 120): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

/** Human, non-technical messages. The app never shows a raw stack trace. */
export function describeApiError(error: ApiErrorShape): string {
  switch (error.kind) {
    case 'not-configured':
      return 'No online AI service is configured in this build. Offline lookup still works.';
    case 'timeout':
      return `The service did not answer within the configured timeout. Showing the last saved result if one exists.`;
    case 'network':
      return 'The phone cannot reach the AI service right now. Offline lookup still works.';
    case 'invalid':
      return error.message;
    case 'server':
    default:
      return 'The AI service reported a problem. Please retry in a moment.';
  }
}

export function describeHttpStatus(status: number): string {
  if (status === 404) {
    return 'That profile is no longer in the approved dataset.';
  }
  if (status === 422) {
    return 'The service rejected the question. Keep it between 3 and 300 characters.';
  }
  if (status >= 500) {
    return 'The AI service failed safely. Please retry.';
  }
  return `Unexpected service response (${status}).`;
}

/**
 * Open an external evidence link. Returns false when the device refuses to
 * open it, so the caller can tell the user instead of failing silently.
 */
export async function openEvidenceLink(link: EvidenceLink): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(link.url);
    if (!supported) {
      return false;
    }
    await Linking.openURL(link.url);
    return true;
  } catch {
    return false;
  }
}

export function linkTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    issue: 'Issue',
    branch: 'Branch',
    pull_request: 'Pull request',
    commit: 'Commit',
    review: 'Review',
    demo: 'Demo',
    apk: 'APK',
    report: 'Report',
    artifact: 'Evidence',
  };
  return labels[type] ?? 'Evidence';
}
