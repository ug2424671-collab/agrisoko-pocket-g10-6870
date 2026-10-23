/** Shared types for the mobile client. They mirror the FastAPI response schema. */

export type SourceKind = 'live' | 'cached' | 'offline';

export interface EvidenceLink {
  label: string;
  url: string;
  type: string;
}

export interface TesterFeedback {
  category: string;
  quote: string;
  consent: boolean;
  name?: string | null;
}

export interface DirectoryMember {
  id: string;
  fullName: string;
  aliases: string[];
  githubUsername: string;
  role: string;
  skills: string[];
  targetUser: string;
  feature: string;
}

export interface MemberProfile extends DirectoryMember {
  registrationNumber: string;
  problem: string;
  contribution: string;
  outcomeMetric: string;
  evidenceLinks: EvidenceLink[];
  testerFeedback: TesterFeedback[];
  introductionDraft: string;
  issueUrl?: string | null;
  branchName?: string | null;
  pullRequestUrl?: string | null;
  reviewedCommitUrl?: string | null;
  mergedCommitUrl?: string | null;
  reviewedPullRequestUrl?: string | null;
  demoVideoUrl?: string | null;
  demoTimestamp?: string | null;
  personalClipUrl?: string | null;
}

export interface Suggestion {
  label: string;
  kind: 'name' | 'role' | 'feature';
}

export interface Candidate {
  id: string;
  fullName: string;
  confidence: number;
}

export interface AskResponse {
  query: string;
  groupCode: string;
  modelVersion: string;
  threshold: number;
  datasetFingerprint: string;
  match: MemberProfile | null;
  confidence: number;
  reason: string;
  matchedTerms: string[];
  introduction: string | null;
  evidenceLinks: EvidenceLink[];
  source: 'live';
  suggestions: Suggestion[];
  topCandidates: Candidate[];
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  groupCode: string;
  modelVersion: string;
  memberCount: number;
  datasetFingerprint: string;
  dataSource: string;
}

export interface EvaluationSummary {
  top1Accuracy: number;
  noMatchRejectionAccuracy: number;
  queryCount: number;
  memberQueryCount: number;
  noMatchQueryCount: number;
  threshold: number;
  generatedAt?: string | null;
  errorCount: number;
}

export interface ModelInfoResponse {
  groupCode: string;
  modelVersion: string;
  vectorizerType: string;
  features: string;
  similarity: string;
  confidenceMethod: string;
  threshold: number;
  aliasBoost: string;
  datasetFingerprint: string;
  memberCount: number;
  buildCommit: string;
  builtAt: string;
  limitations: string[];
  evaluation: EvaluationSummary | null;
}

/** What the Result screen renders, whatever the source was. */
export interface AnswerView {
  query: string;
  source: SourceKind;
  confidence: number;
  threshold: number;
  reason: string;
  matchedTerms: string[];
  introduction: string | null;
  evidenceLinks: EvidenceLink[];
  member: MemberProfile | null;
  suggestions: Suggestion[];
  topCandidates: Candidate[];
  modelVersion: string;
  datasetFingerprint: string;
  storedAt: number;
  offlineLookup?: OfflineLookupResult | null;
}

export interface OfflineLookupResult {
  member: DirectoryMember;
  matchedValue: string;
  matchedKind: 'name' | 'alias' | 'role' | 'feature';
}

export interface ApiErrorShape {
  kind: 'timeout' | 'network' | 'server' | 'invalid' | 'not-configured';
  message: string;
  status?: number;
}
