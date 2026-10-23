# COMBO_A3_G-10-6870 - Test log

Group code: **G-10-6870** · Release: `v1.0.0` · APK: `build/AgriSokoPocket_G-10-6870.apk` ·
Commit under test: `<hash>` · Date: `<date>`

Fill this table from real runs. Do not copy expected values: run the commands, paste the output.
Values already entered in sections 1, 2, 6 and 7 come from actual runs recorded during development;
re-run everything against the final tagged commit and update any value that changes.

## 1. Automated checks

| # | Command | Where | Expected | Actual | Pass |
| --- | --- | --- | --- | --- | --- |
| 1 | `python -m pytest` (in `ai-api/`) | AI service | all tests pass | 41 passed, 1 warning in 2.59s | yes |
| 2 | `python scripts/validate_data.py` | AI service | dataset valid, no privacy findings | 5 members, validation passed, 5 warnings for missing tester feedback (expected), fingerprint `167269e…8306` | yes |
| 3 | `python scripts/build_index.py` | AI service | index built, fingerprint printed | 4472 features, fingerprint `167269e…8306` | yes |
| 4 | `python scripts/evaluate.py` | AI service | accuracy + sweep written | top-1 1.000, rejection 1.000, 0 errors | yes |
| 5 | `npm run typecheck` (in `mobile/`) | Mobile | no TypeScript errors | no errors | yes |
| 6 | `npm run test:offline` | Mobile | all offline lookup checks pass | 23 checks passed over 5 real members | yes |
| 7 | `npm run test:validation` | Mobile | all validation checks pass | 7 checks passed | yes |
| 8 | `npx expo-doctor` (in `mobile/`) | Mobile project | no dependency or config issues | 18/18 checks passed | yes |

## 2. AI query suite

Three queries per member plus five deliberate no-match questions. Machine-readable results
live in `ai-api/evaluation/results.json`; the table below is the human record.

### Member queries

| # | Member | Kind | Query | Returned member | Confidence | Correct |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Kiir Deng Kur | name | Tell me about Kiir Deng Kur | kiir-deng-kur | 0.970 | yes |
| 2 | Kiir Deng Kur | role | Who is the product and repository lead? | kiir-deng-kur | 0.574 | yes |
| 3 | Kiir Deng Kur | feature | Who wrote the project report and README? | kiir-deng-kur | 0.511 | yes |
| 4 | Menzi Prince Peter | alias | Oblack | menzi-prince-peter | 0.970 | yes |
| 5 | Menzi Prince Peter | role | Who is the AI and data engineer? | menzi-prince-peter | 0.486 | yes |
| 6 | Menzi Prince Peter | feature | Who built the TF-IDF matching engine? | menzi-prince-peter | 0.531 | yes |
| 7 | Uwase Teta Diolinda | name | Uwase Teta Diolinda | uwase-teta-diolinda | 0.970 | yes |
| 8 | Uwase Teta Diolinda | role | Who owns the FastAPI contract? | uwase-teta-diolinda | 0.533 | yes |
| 9 | Uwase Teta Diolinda | feature | Who built the ask endpoint with grounding controls? | uwase-teta-diolinda | 0.519 | yes |
| 10 | Shyaka Peter Guy | alias | Peter Guy | shyaka-peter-guy | 0.970 | yes |
| 11 | Shyaka Peter Guy | role | Who worked on mobile UI and navigation? | shyaka-peter-guy | 0.553 | yes |
| 12 | Shyaka Peter Guy | feature | Who built the profile result screen? | shyaka-peter-guy | 0.528 | yes |
| 13 | Umutoni Liliane | alias | Lily | umutoni-liliane | 0.970 | yes |
| 14 | Umutoni Liliane | role | Which member is the quality engineer? | umutoni-liliane | 0.473 | yes |
| 15 | Umutoni Liliane | feature | Who implemented offline lookup with AsyncStorage? | umutoni-liliane | 0.567 | yes |

| Metric | Value |
| --- | --- |
| Top-1 member accuracy | 1.000 (15/15) |
| No-match rejection accuracy | 1.000 (5/5) |
| Threshold used | 0.45 |
| Threshold justification | Every threshold from 0.30 to 0.47 keeps all deliberate no-match questions rejected and all member questions correct; 0.48 already loses one correct answer. The group chose 0.45 because the lowest correct match in the suite scores 0.473, and 0.45 leaves a visible margin below it. The recorded sweep is in `ai-api/evaluation/RESULTS.md`. |

> Paste the exact confidence values from `ai-api/evaluation/results.json` if they differ from the
> values above after the final re-run.

### Deliberate no-match queries

| # | Query | Expected | Returned | Confidence | Rejected | Suggested names offered |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Who won the 2026 World Cup? | no match | no match | 0.038 | yes | 5 names plus roles and features |
| 2 | What is the potato price tomorrow? | no match | no match | 0.187 | yes | 5 names plus roles and features |
| 3 | Who is the president of Rwanda? | no match | no match | 0.041 | yes | 5 names plus roles and features |
| 4 | Who built the payment system? | no match | no match | 0.236 | yes | 5 names plus roles and features |
| 5 | Help | no match | no match | 0.008 | yes | 5 names plus roles and features |

### Ambiguous-name behaviour

Added because the dataset contains two members whose names share the first name "Peter".

| Query | Result | Why |
| --- | --- | --- |
| `Peter` | shyaka-peter-guy at 0.970 | The shared alias was removed from Menzi Prince Peter during review, so exactly one identity claims the phrase. |
| `Peter Guy` | shyaka-peter-guy at 0.970 | Two-word alias resolves to one member. |
| `Menzi` | menzi-prince-peter at 0.970 | Unambiguous given name. |

## 3. API contract tests

| # | Test | Method and path | Expected | Actual | Pass |
| --- | --- | --- | --- | --- | --- |
| 1 | Service status | `GET /health` | 200, status, version, group code | 200, `status: ok`, 5 members, fingerprint returned | yes |
| 2 | Safe directory | `GET /members` | 200, directory fields only | 200, 5 members, directory fields only | yes |
| 3 | One profile | `GET /members/{id}` | 200, complete approved record | 200, `Kiir Deng Kur \| Product and repository lead` | yes |
| 4 | Unknown member | `GET /members/unknown` | 404 with a clear message | 404 | yes |
| 5 | Live match | `POST /ask` | 200, match, confidence, reason, introduction | 200, matched Umutoni Liliane with grounded fields | yes |
| 6 | No-match | `POST /ask` unrelated | 200, `match: null`, suggestions | 200, `match: null`, reason names the 0.45 threshold | yes |
| 7 | Empty question | `POST /ask {"query":""}` | 422 validation error | 422 | yes |
| 8 | Missing question | `POST /ask {}` | 422 validation error | 422 | yes |
| 9 | Over-long question | 301 characters | 422 validation error | 422 | yes |
| 10 | Model information | `GET /model-info` | vectorizer, threshold, fingerprint, limitations | 200, threshold 0.45, evaluation top-1 1.0 | yes |
| 11 | Empty dataset | service started with `[]` | degraded health, `POST /ask` returns 503 | covered by `ai-api/tests/test_api.py` | yes |

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

## 5. Release APK build

Built on this machine with the Android SDK, JDK 17 and Gradle, without an Expo/EAS account, using
`build/build_apk_local.sh`. The build was repeated; every value below is copied from the final run.

| Check | Command | Result |
| --- | --- | --- |
| Native project generated | `npx expo prebuild --platform android` | `android/` created, package `rw.ines.agrisoko.pocket.g106870` |
| Release build | `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` | `BUILD SUCCESSFUL in 16m 56s`, 380 actionable tasks (209 executed, 171 up-to-date) |
| Artifact name | `build/build_apk_local.sh` | `build/AgriSokoPocket_G-10-6870.apk` |
| Size | `ls -lh` | 26 MB |
| Package | `aapt2 dump badging` | `rw.ines.agrisoko.pocket.g106870`, versionCode 1, versionName 1.0.0 |
| Launcher label | `aapt2 dump badging` | `AgriSoko Pocket G-10-6870` |
| SDK levels | `aapt2 dump badging` | `sdkVersion 24`, `targetSdkVersion 35`, compileSdk 35 |
| ABI packaged | `aapt2 dump badging` | `arm64-v8a` (single ABI for the demo device) |
| Zip alignment | `zipalign -c -v 4` | aligned |
| Signature | `apksigner verify --print-certs` | valid; `CN=AgriSoko Pocket G-10-6870, OU=INES, O=AgriSoko Pocket, L=Kigali, C=RW` |
| SHA-256 | `sha256sum` | `c9cb2ce87234b5a825696ff32da69b136bc4f51bf220968d16f4143359436fbb` |

### What is inside the APK

| Check | Method | Result |
| --- | --- | --- |
| Hermes bundle present | `unzip -l` | `assets/index.android.bundle`, 1.8 MB |
| Hermes runtime | `unzip -l` | `lib/arm64-v8a/libhermes.so` |
| Group code compiled in | `grep -a` on the bundle | `G-10-6870` found |
| Member data compiled in | `grep -a` on the bundle | `Kiir Deng Kur` found |
| Source labels compiled in | `grep -a` on the bundle | `Offline match`, `Cached result` found |
| Threshold compiled in | `grep -a` on the bundle | `0.45` found |
| Repository URL compiled in | `grep -a` on the bundle | `https://github.com/ug2424671-collab/agrisoko-pocket-g10-6870` found |

### Build defects found and fixed

| Defect | How it showed up | Fix |
| --- | --- | --- |
| Missing `babel-preset-expo` | Metro aborted immediately: `Cannot find module 'babel-preset-expo'` | Added the dependency (`260cb3b`) |
| Gradle daemon killed twice during compilation | 6.6 GB machine; all four ABIs plus parallel workers exhausted RAM and swap | Single ABI, `org.gradle.parallel=false`, `workers.max=1`, `-Xmx2048m`, in-process Kotlin compiler |

### Still not done

The APK has **not** been installed on a physical device, so the device matrix and the state-coverage
table below are still empty. That work needs real hardware and a real tester; it has not been simulated.

## 6. Reproducible issues found and fixed

At least two, each linked to a GitHub issue and a fixing commit. Never invent a defect.

| # | Issue | Reported by | Steps to reproduce | Observed | Expected | Fix commit | Verified by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Ambiguous shared alias | Menzi Prince Peter | Ask `Peter` while both records list "Peter" as an alias | The retrieval step had two competing exact identities | One member, or a safe no-match | `e1d43e0` | The bare `Peter` alias was removed; `Peter` now resolves to `shyaka-peter-guy` alone, and `validate_data.py` reports no shared alias |
| 2 | Offline check tested a hardcoded fixture | Umutoni Liliane | Run `npm run test:offline` after changing the dataset | The check passed even though it never read `members.bundled.json` | The check must fail on a stale bundle | `e1d43e0` | Now runs 23 checks against the real bundle |
| 3 | The app could not be bundled at all | Shyaka Peter Guy | Run `npx expo export --platform android` on a clean install | Metro failed with `Cannot find module 'babel-preset-expo'` | A production Android bundle is produced | `260cb3b` | `npx expo export` now emits a 2.75 MB Hermes bundle, and the release APK builds |

Note on issue 3: `npm run check` had never caught this because it only runs Node scripts and never
invokes Metro. The defect was found by running a real production bundle, not by a unit test, which is
why the release build is now part of the recorded verification rather than an afterthought.

## 7. Unresolved issues

| Issue | Why it remains | User-visible limitation documented in the app |
| --- | --- | --- |
| No tester feedback recorded in the dataset | No consented external session had been held when this log was written | `ai-api/data/members.json` leaves `testerFeedback` empty rather than storing a quotation nobody gave; `validate_data.py` warns until real entries are added |
| Lexical matching misses pure paraphrases | TF-IDF matches words and character fragments, not meaning | The About screen states the model is lexical and that a paraphrase may be refused |
| No on-device retrieval offline | The index is not shipped in the APK | The About screen states offline mode supports exact name, nickname, role and feature lookup only |
| `members.json` is read at start-up | The service loads the dataset once | The README records that editing the dataset requires a restart or redeploy |

## 8. Environment

| Tool | Version |
| --- | --- |
| Node.js | 22.23.3 |
| npm | 10.9.9 |
| Python | 3.14.4 |
| scikit-learn | 1.9.1 |
| FastAPI | 0.161.1 |
| Pydantic | 2.14.1 |
| Uvicorn | 0.54.0 |
| Expo SDK | 54.0.38 |
| JDK | 17.0.20.1 (Ubuntu 17.0.20.1+1-1-26.04) |
| Gradle | 8.14.3 (wrapper) |
| Android SDK | build-tools 36.0.0, platform 35, NDK 27.1.12297006 |
| Android device(s) | **none available on the build machine** — see section 4 |
| Host | 6.6 GiB RAM, 4 GiB swap, Linux x86_64 |
