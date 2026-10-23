import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../config';
import type {
  AskResponse,
  ApiErrorShape,
  HealthResponse,
  MemberProfile,
  ModelInfoResponse,
} from '../types';
import { describeHttpStatus } from './format';
import { BUNDLED_META, BUNDLED_MEMBERS } from '../data/members';
import type { DirectoryMember } from '../types';

export class ApiError extends Error {
  readonly shape: ApiErrorShape;

  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.name = 'ApiError';
    this.shape = shape;
  }
}

export const isApiConfigured = API_BASE_URL.length > 0;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError({
      kind: 'not-configured',
      message: 'No online AI service is configured in this build.',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      let detail = describeHttpStatus(response.status);
      try {
        const body = (await response.json()) as { detail?: unknown };
        if (typeof body.detail === 'string' && body.detail.length) {
          detail = body.detail;
        } else if (Array.isArray(body.detail) && body.detail.length) {
          const first = body.detail[0] as { msg?: string };
          detail = first?.msg ?? detail;
        }
      } catch {
        // Keep the status-based message.
      }
      throw new ApiError({
        kind: response.status === 422 ? 'invalid' : 'server',
        message: detail,
        status: response.status,
      });
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError({
        kind: 'timeout',
        message: `No response within ${REQUEST_TIMEOUT_MS} ms.`,
      });
    }
    throw new ApiError({
      kind: 'network',
      message: 'The AI service is unreachable from this device.',
    });
  } finally {
    clearTimeout(timer);
  }
}

export function askTeam(query: string): Promise<AskResponse> {
  return request<AskResponse>('/ask', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export function fetchDirectory(): Promise<DirectoryMember[]> {
  return request<DirectoryMember[]>('/members');
}

export function fetchMember(memberId: string): Promise<MemberProfile> {
  return request<MemberProfile>(`/members/${encodeURIComponent(memberId)}`);
}

export function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health');
}

export function fetchModelInfo(): Promise<ModelInfoResponse> {
  return request<ModelInfoResponse>('/model-info');
}

export const bundledDirectory: DirectoryMember[] = BUNDLED_MEMBERS;
export const bundledMeta = BUNDLED_META;

export function findBundledMember(memberId: string): DirectoryMember | undefined {
  return bundledDirectory.find((member) => member.id === memberId);
}
