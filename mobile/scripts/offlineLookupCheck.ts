/**
 * Scripted offline lookup checks.
 *
 * The same pure function the app uses at runtime is exercised here, so the
 * offline rule is verifiable without a device:
 *
 *   npm run test:offline
 */
import { lookupOffline, normalizeText } from '../src/services/offline';
import type { DirectoryMember } from '../src/types';

const MEMBERS: DirectoryMember[] = [
  {
    id: 'aline-uwase',
    fullName: 'Aline Uwase',
    aliases: ['Aline', 'Ally'],
    githubUsername: 'aline-demo',
    role: 'AI and data engineer',
    skills: ['scikit-learn', 'TF-IDF'],
    targetUser: 'cooperative members',
    feature: 'Evidence-grounded member matching engine',
  },
  {
    id: 'samuel-habimana',
    fullName: 'Samuel Habimana',
    aliases: ['Samuel', 'Sam'],
    githubUsername: 'samuel-demo',
    role: 'Offline and quality engineer',
    skills: ['AsyncStorage', 'NetInfo'],
    targetUser: 'visitors without network',
    feature: 'Offline exact-name lookup with cache source labels',
  },
];

interface Case {
  query: string;
  expectedId: string | null;
  note: string;
}

const CASES: Case[] = [
  { query: 'Tell me about Aline', expectedId: 'aline-uwase', note: 'exact first name' },
  { query: 'Ally', expectedId: 'aline-uwase', note: 'nickname' },
  { query: 'who is the AI and data engineer?', expectedId: 'aline-uwase', note: 'role' },
  { query: 'Sammuel', expectedId: 'samuel-habimana', note: 'one-letter name typo' },
  {
    query: 'who built the offline exact name lookup with cache source labels',
    expectedId: 'samuel-habimana',
    note: 'full feature phrase',
  },
  { query: 'Where is the potato price?', expectedId: null, note: 'no member signal' },
  { query: 'asdkjhasd', expectedId: null, note: 'gibberish' },
];

const lines: string[] = ['Offline lookup checks', ''];
let failures = 0;

for (const testCase of CASES) {
  const result = lookupOffline(testCase.query, MEMBERS);
  const actual = result?.member.id ?? null;
  const passed = actual === testCase.expectedId;
  if (!passed) {
    failures += 1;
  }
  lines.push(
    `${passed ? 'PASS' : 'FAIL'}  ${testCase.query.padEnd(52)} -> ${String(actual).padEnd(18)} (${testCase.note})`,
  );
}

lines.push('', `Normalisation spot check: "${normalizeText('  Éric  Niyonzima! ')}"`);
lines.push(failures === 0 ? 'All offline checks passed.' : `${failures} check(s) failed.`);
console.log(lines.join('\n'));
if (failures > 0) {
  throw new Error(`${failures} offline check(s) failed`);
}
