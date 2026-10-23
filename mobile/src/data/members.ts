import bundledMembers from './members.bundled.json';
import bundledMetaJson from './bundledMeta.json';
import type { DirectoryMember, MemberProfile } from '../types';

/**
 * Directory data copied from the approved dataset by
 * `python ai-api/scripts/sync_mobile_data.py`.
 *
 * Only directory fields are bundled. Full profiles and the introduce step
 * always need the AI service (or the cached copy of a live answer).
 */
export interface BundledMeta {
  groupCode: string;
  modelVersion: string;
  memberCount: number;
  datasetFingerprint: string;
  generatedAt: string;
  source: string;
}

export const BUNDLED_MEMBERS = bundledMembers as DirectoryMember[];
export const BUNDLED_META = bundledMetaJson as BundledMeta;

/**
 * Build the offline-only view of a member. It contains approved directory
 * facts, never an invented biography.
 */
export function toOfflineProfile(member: DirectoryMember): MemberProfile {
  return {
    ...member,
    registrationNumber: 'Available online',
    problem: 'Full problem statement is served by the AI service.',
    contribution: 'Open the profile while online to read the full contribution.',
    outcomeMetric: 'Offline mode shows directory facts only; measured evidence needs the service.',
    evidenceLinks: [],
    testerFeedback: [],
    introductionDraft:
      `Offline directory record: ${member.fullName} is the ${member.role} of AgriSoko Pocket ${BUNDLED_META.groupCode}. ` +
      `Owned feature: ${member.feature}. Reconnect to load the full evidence-based introduction.`,
    issueUrl: null,
    branchName: null,
    pullRequestUrl: null,
    reviewedCommitUrl: null,
    mergedCommitUrl: null,
    reviewedPullRequestUrl: null,
    demoVideoUrl: null,
    demoTimestamp: null,
    personalClipUrl: null,
  };
}
