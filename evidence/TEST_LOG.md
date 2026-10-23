# COMBO_A3_GXX - Test log

Group code: **GXX** · Release: `v1.0.0` · APK: `build/AgriSokoPocket_GXX.apk` ·
Commit under test: `<hash>` · Date: `<date>`

Fill this table from real runs. Do not copy expected values: run the commands, paste the output.

## 1. Automated checks

| # | Command | Where | Expected | Actual | Pass |
| --- | --- | --- | --- | --- | --- |
| 1 | `python -m pytest` (in `ai-api/`) | AI service | all tests pass | | |
| 2 | `python scripts/validate_data.py` | AI service | dataset valid, no privacy findings | | |
| 3 | `python scripts/build_index.py` | AI service | index built, fingerprint printed | | |
| 4 | `python scripts/evaluate.py` | AI service | accuracy + sweep written | | |
| 5 | `npm run typecheck` (in `mobile/`) | Mobile | no TypeScript errors | | |
| 6 | `npm run test:offline` | Mobile | all offline lookup checks pass | | |
| 7 | `npm run test:validation` | Mobile | all validation checks pass | | |

## 2. AI query suite

Three queries per member plus at least five deliberate no-match questions. Machine-readable results
live in `ai-api/evaluation/results.json`; the table below is the human record.

### Member queries

| # | Member | Kind | Query | Returned member | Confidence | Correct |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | name or alias | | | | |
| 2 | | role or skill | | | | |
| 3 | | contribution or feature | | | | |
| 4 | | name or alias | | | | |
| 5 | | role or skill | | | | |
| 6 | | contribution or feature | | | | |
| 7 | | name or alias | | | | |
| 8 | | role or skill | | | | |
| 9 | | contribution or feature | | | | |
| 10 | | name or alias | | | | |
| 11 | | role or skill | | | | |
| 12 | | contribution or feature | | | | |
| 13 | | name or alias | | | | |
| 14 | | role or skill | | | | |
| 15 | | contribution or feature | | | | |
| 16 | | name or alias | | | | |
| 17 | | role or skill | | | | |
| 18 | | contribution or feature | | | | |

| Metric | Value |
| --- | --- |
| Top-1 member accuracy | |
| No-match rejection accuracy | |
| Threshold used | 0.45 |
| Threshold justification | |

### Deliberate no-match queries

| # | Query | Expected | Returned | Confidence | Rejected | Suggested names offered |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | no match | | | | |
| 2 | | no match | | | | |
| 3 | | no match | | | | |
| 4 | | no match | | | | |
| 5 | | no match | | | | |

## 3. API contract tests

| # | Test | Method and path | Expected | Actual | Pass |
| --- | --- | --- | --- | --- | --- |
| 1 | Service status | `GET /health` | 200, status, version, group code | | |
| 2 | Safe directory | `GET /members` | 200, directory fields only | | |
| 3 | One profile | `GET /members/{id}` | 200, complete approved record | | |
| 4 | Unknown member | `GET /members/unknown` | 404 with a clear message | | |
| 5 | Live match | `POST /ask` | 200, match, confidence, reason, introduction | | |
| 6 | No-match | `POST /ask` unrelated | 200, `match: null`, suggestions | | |
| 7 | Empty question | `POST /ask {"query":""}` | 422 validation error | | |
| 8 | Missing question | `POST /ask {}` | 422 validation error | | |
| 9 | Over-long question | 301 characters | 422 validation error | | |
| 10 | Model information | `GET /model-info` | vectorizer, threshold, fingerprint, limitations | | |
| 11 | Empty dataset | service started with `[]` | degraded health, `POST /ask` returns 503 | | |

## 4. Device matrix

At least two Android devices or two materially different Android configurations.

| # | Device | Android version | Screen | Connection | Install from APK | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | Wi-Fi | | | |
| 2 | | | | Mobile data | | | |

### State coverage on device

| State | How it was produced | Observed behaviour | Pass |
| --- | --- | --- | --- |
| Loading | Ask while online | progress indicator, button disabled | |
| Success | Name query | member, confidence, reason, introduction | |
| No match | Unrelated question | explanation plus suggestions | |
| Server error | Stop the API, ask | banner, last result kept | |
| Timeout | Point the app at an unreachable host | timeout banner, retry offered | |
| Offline | Airplane mode, exact name query | `Offline match` label, no crash | |
| Recovery | Reconnect, retry | `Live AI match` label returns | |
| Large text | Android font size 130 % | no clipped text, no overlap | |
| Failed link | Evidence URL with no handler | visible "could not open" message | |

## 5. Reproducible issues found and fixed

At least two, each linked to a GitHub issue and a fixing commit. Never invent a defect.

| # | Issue | Reported by | Steps to reproduce | Observed | Expected | Fix commit | Verified by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |

## 6. Unresolved issues

| Issue | Why it remains | User-visible limitation documented in the app |
| --- | --- | --- |
| | | |

## 7. Environment

| Tool | Version |
| --- | --- |
| Node.js | |
| npm | |
| Python | |
| scikit-learn | |
| FastAPI | |
| Expo SDK | |
| EAS CLI | |
| Android device(s) | |
