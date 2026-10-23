/**
 * Validation checks for the Ask screen rules: empty, whitespace, too short,
 * too long and non-alphanumeric questions must never reach the API.
 *
 *   npm run test:validation
 */
import { validateQuery } from '../src/services/validation';
import { MIN_QUERY_LENGTH, MAX_QUERY_LENGTH } from '../src/config';

const CASES: Array<{ value: string; valid: boolean; note: string }> = [
  { value: '', valid: false, note: 'empty question' },
  { value: '     ', valid: false, note: 'whitespace only' },
  { value: 'ab', valid: false, note: `shorter than ${MIN_QUERY_LENGTH}` },
  { value: 'a'.repeat(MAX_QUERY_LENGTH + 1), valid: false, note: `longer than ${MAX_QUERY_LENGTH}` },
  { value: '?????', valid: false, note: 'no letters or digits' },
  { value: 'Who built offline mode?', valid: true, note: 'valid feature question' },
  { value: 'Aline', valid: true, note: 'valid name question' },
];

const lines: string[] = ['Ask screen validation checks', ''];
let failures = 0;

for (const item of CASES) {
  const result = validateQuery(item.value);
  const passed = result.valid === item.valid;
  if (!passed) {
    failures += 1;
  }
  lines.push(
    `${passed ? 'PASS' : 'FAIL'}  ${item.note.padEnd(24)} valid=${String(result.valid).padEnd(5)} ${result.message ?? ''}`,
  );
}

lines.push(failures === 0 ? 'All validation checks passed.' : `${failures} check(s) failed.`);
console.log(lines.join('\n'));
if (failures > 0) {
  throw new Error(`${failures} validation check(s) failed`);
}
process.exit(0);
