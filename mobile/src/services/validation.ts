import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH } from '../config';

export interface QueryValidation {
  valid: boolean;
  message?: string;
}

/** Shared validation used by the Ask screen and the scripted checks. */
export function validateQuery(rawValue: string): QueryValidation {
  const value = rawValue.trim();

  if (!value) {
    return { valid: false, message: 'Type a name, nickname, role or feature before asking.' };
  }
  if (value.length < MIN_QUERY_LENGTH) {
    return {
      valid: false,
      message: `Add at least ${MIN_QUERY_LENGTH} characters so the question is specific.`,
    };
  }
  if (value.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      message: `Keep the question under ${MAX_QUERY_LENGTH} characters (currently ${value.length}).`,
    };
  }
  if (!/[a-zA-Z0-9]/.test(value)) {
    return { valid: false, message: 'Use letters or numbers in the question.' };
  }
  return { valid: true };
}

export function offlineCandidateCount(rawValue: string): number {
  return rawValue.trim().length >= MIN_QUERY_LENGTH ? 1 : 0;
}
