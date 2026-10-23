/**
 * Scripted offline lookup checks.
 *
 * The same pure function the app uses at runtime is exercised here, so the
 * offline rule is verifiable without a device. The checks run against the real
 * shipped bundle in `src/data/members.bundled.json`, so a stale or broken
 * `sync:data` step fails this script instead of passing silently.
 *
 *   npm run test:offline
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import bundled from '../src/data/members.bundled.json';
import bundledMeta from '../src/data/bundledMeta.json';
import { lookupOffline, normalizeText } from '../src/services/offline';
import type { DirectoryMember } from '../src/types';

const MEMBERS = bundled as DirectoryMember[];

if (!Array.isArray(MEMBERS) || MEMBERS.length === 0) {
  throw new Error(
    'src/data/members.bundled.json has no members. Run npm run sync:data after editing ai-api/data/members.json.',
  );
}

/**
 * The About screen prints `bundledMeta.datasetFingerprint`. If the bundle was
 * never re-synced after the dataset changed, that screen shows a fingerprint
 * that disagrees with the data the app is actually serving. Check it here so a
 * forgotten `npm run sync:data` fails instead of shipping.
 */
const metaChecks: string[] = [];
let metaFailures = 0;

function checkMeta(label: string, ok: boolean, detail: string) {
  if (!ok) metaFailures += 1;
  metaChecks.push(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(54)} ${detail}`);
}

const sourcePath = fileURLToPath(
  new URL('../../ai-api/data/members.json', import.meta.url).href,
);
if (existsSync(sourcePath)) {
  const digest = createHash('sha256').update(readFileSync(sourcePath)).digest('hex');
  checkMeta(
    'bundle fingerprint matches ai-api/data/members.json',
    digest === bundledMeta.datasetFingerprint,
    `${bundledMeta.datasetFingerprint.slice(0, 12)}... vs ${digest.slice(0, 12)}...`,
  );
} else {
  metaChecks.push(`SKIP  dataset source not present at ${sourcePath}`);
}

checkMeta(
  'bundled member count matches members.bundled.json',
  bundledMeta.memberCount === MEMBERS.length,
  `${bundledMeta.memberCount} vs ${MEMBERS.length}`,
);
checkMeta(
  'bundled group code is the real code',
  /^G-\d{2}-\d{4}$/.test(bundledMeta.groupCode),
  bundledMeta.groupCode,
);

const byId = new Map(MEMBERS.map((member) => [member.id, member]));

/** First alias of a member that is not already part of their full name. */
function nicknameOf(id: string): string | null {
  const member = byId.get(id);
  if (!member) return null;
  const nameWords = member.fullName.toLowerCase().split(/\s+/);
  const nickname = member.aliases.find(
    (alias) => !nameWords.includes(alias.toLowerCase()),
  );
  return nickname ?? member.fullName.split(/\s+/)[0];
}

interface Case {
  query: string;
  expectedId: string | null;
  note: string;
}

const CASES: Case[] = [];

for (const member of MEMBERS) {
  const firstName = member.fullName.split(/\s+/)[0];
  const nickname = nicknameOf(member.id);
  CASES.push({ query: firstName, expectedId: member.id, note: 'first name' });
  if (nickname && nickname !== firstName) {
    CASES.push({ query: nickname, expectedId: member.id, note: 'nickname' });
  }
  CASES.push({ query: member.role, expectedId: member.id, note: 'role' });
  CASES.push({ query: member.feature, expectedId: member.id, note: 'full feature phrase' });
}

CASES.push(
  { query: 'Where is the potato price?', expectedId: null, note: 'no member signal' },
  { query: 'asdkjhasd', expectedId: null, note: 'gibberish' },
  { query: 'who is the president of Rwanda?', expectedId: null, note: 'unrelated public figure' },
);

const lines: string[] = [
  `Offline lookup checks (bundle: ${MEMBERS.length} real members)`,
  '',
  ...metaChecks,
  '',
];
let failures = metaFailures;

for (const testCase of CASES) {
  const result = lookupOffline(testCase.query, MEMBERS);
  const actual = result?.member.id ?? null;
  const passed = actual === testCase.expectedId;
  if (!passed) {
    failures += 1;
  }
  lines.push(
    `${passed ? 'PASS' : 'FAIL'}  ${testCase.query.slice(0, 52).padEnd(52)} -> ${String(actual).padEnd(20)} (${testCase.note})`,
  );
}

lines.push('', `Normalisation spot check: "${normalizeText('  Éric  Niyonzima! ')}"`);
lines.push(failures === 0 ? 'All offline checks passed.' : `${failures} check(s) failed.`);
console.log(lines.join('\n'));
if (failures > 0) {
  throw new Error(`${failures} offline check(s) failed`);
}
