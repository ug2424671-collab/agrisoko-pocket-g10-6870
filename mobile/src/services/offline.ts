import type { DirectoryMember, OfflineLookupResult } from '../types';

/** Lowercase, strip accents, collapse every separator to one space. */
export function normalizeText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) {
    return false;
  }
  return ` ${haystack} `.includes(` ${needle} `);
}

function levenshtein(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) {
    return limit + 1;
  }
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/** Exact name or alias phrase wins, then a clearly misspelled single name. */
function matchIdentity(query: string, member: DirectoryMember): { value: string } | null {
  const identities = [member.fullName, ...member.aliases].filter(Boolean);
  for (const identity of identities) {
    if (containsPhrase(query, normalizeText(identity))) {
      return { value: identity };
    }
  }

  const queryTokens = query.split(' ').filter(Boolean);
  if (queryTokens.length === 1) {
    const token = queryTokens[0];
    for (const identity of identities) {
      const identityTokens = normalizeText(identity).split(' ').filter(Boolean);
      for (const identityToken of identityTokens) {
        if (identityToken.length >= 4 && levenshtein(token, identityToken, 1) <= 1) {
          return { value: identity };
        }
      }
    }
  }
  return null;
}

/**
 * Offline exact lookup over the bundled directory.
 *
 * Rule: the question must contain a full name, alias, role or feature, or a
 * single name token with at most one spelling mistake. This is deliberately
 * conservative so an offline answer is never a guess.
 */
export function lookupOffline(
  rawQuery: string,
  members: DirectoryMember[],
): OfflineLookupResult | null {
  const query = normalizeText(rawQuery);
  if (!query || members.length === 0) {
    return null;
  }

  for (const member of members) {
    const identity = matchIdentity(query, member);
    if (identity) {
      return { member, matchedValue: identity.value, matchedKind: 'name' };
    }
  }

  for (const member of members) {
    if (containsPhrase(query, normalizeText(member.role))) {
      return { member, matchedValue: member.role, matchedKind: 'role' };
    }
  }

  for (const member of members) {
    if (containsPhrase(query, normalizeText(member.feature))) {
      return { member, matchedValue: member.feature, matchedKind: 'feature' };
    }
  }

  return null;
}

export function offlineSuggestions(members: DirectoryMember[]): string[] {
  return members
    .flatMap((member) => [member.fullName, ...member.aliases.slice(0, 1), member.role, member.feature])
    .slice(0, 12);
}
