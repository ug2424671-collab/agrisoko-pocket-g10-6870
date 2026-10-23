# AgriSoko Pocket G-10-6870

Integrated Mobile and Artificial Intelligence - Group Assignment 3.

**Group code `G-10-6870` is final.** The Android package and Expo slug use the hyphen-free form
`g106870`, because hyphens are not legal in a package name; every human-readable surface shows
`G-10-6870`.
See [Fill-in checklist](#fill-in-checklist) for the remaining steps.

| Item | Value |
| --- | --- |
| Application name | AgriSoko Pocket G-10-6870 |
| Repository | `agrisoko-pocket-g10-6870` (Expo slug: `agrisoko-pocket-g106870`) |
| Release APK | `AgriSokoPocket_G-10-6870.apk` |
| Package name | `rw.ines.agrisoko.pocket.g106870` |
| Group verification code | `G-10-6870` (shown on Home and About) |
| Release tag | `v1.0.0` |
| AI model version | `agrisoko-tfidf-v1` |
| Confidence threshold | `0.45` |
| Repository URL | `https://github.com/ug2424671-collab/agrisoko-pocket-g10-6870` |
| v1.0.0 release URL | `https://github.com/ug2424671-collab/agrisoko-pocket-g10-6870/releases/tag/v1.0.0` |
| Final commit hash | `7cc5cce` (the commit the `v1.0.0` tag and release point at) |
| APK path | `build/AgriSokoPocket_G-10-6870.apk` |
| APK SHA-256 | `c5cd012129092576e29ffcc8652d3ec5c53051e82a2234266eb5bb41e71978f5` |

## The product in one paragraph

AgriSoko is preparing a short demonstration for potato cooperatives, employers and innovation
partners in Musanze. A visitor opens the phone app, asks a natural question such as
"Who built offline mode?" or "Tell me about Aline", and receives the best-matching team member with
a confidence score, the reason for the match and an evidence-based professional introduction whose
links point back to the repository, the pull requests, the commits, the tests and the demo video.
The profile can also be reached manually from the directory, and exact name, nickname and role
questions still answer when the phone has no network.

## Members and roles

| # | Name | Registration no. | Primary role | Review responsibility | GitHub |
| --- | --- | --- | --- | --- | --- |
| 1 | Kiir Deng Kur | 2424671 | Product and repository lead | Product scope and contribution evidence | [ug2424671-collab](https://github.com/ug2424671-collab) |
| 2 | Menzi Prince Peter | 2528149 | AI and data engineer | API tests and no-match safety | [ug2528149-cell](https://github.com/ug2528149-cell) |
| 3 | Uwase Teta Diolinda | 2526870 | API and integration engineer | Mobile networking and error handling | [TetaDiolinda](https://github.com/TetaDiolinda) |
| 4 | Shyaka Peter Guy | 252670 | Mobile UI and navigation engineer | UI and UX evidence | [peternickson4-max](https://github.com/peternickson4-max) |
| 5 | Umutoni Liliane | 2527968 | Offline, quality and evidence engineer | AI query evaluation | [lilianeumutoni302](https://github.com/lilianeumutoni302) |

Each member implements, tests and can explain a technical contribution. The five roles cover product and
repository leadership, the AI engine, the API contract, the mobile interface and offline quality
assurance.

Approved member records live in [`ai-api/data/members.json`](ai-api/data/members.json). Each member
reviewed and signed their own record; privacy-restricted data is deliberately absent.

## Architecture

```
AgriSoko Pocket G-10-6870
├── mobile/                     React Native + Expo + TypeScript (Android APK)
│   ├── App.tsx                 providers: safe area, team context, navigation
│   ├── app.json                app name, package, API base URL, timeout, threshold
│   └── src/
│       ├── config/             typed runtime configuration (no secrets)
│       ├── context/            TeamContext: directory, ask, cache, errors
│       ├── components/         reusable UI: cards, badges, chips, buttons, states
│       ├── hooks/              useNetworkStatus (NetInfo)
│       ├── navigation/         typed stack + bottom tabs
│       ├── screens/            Home, Ask, Result, Directory, MemberProfile, About
│       ├── services/           api.ts, offline.ts, storage.ts, format.ts, validation.ts
│       └── data/               bundled directory copied from members.json
├── ai-api/                     Python + FastAPI + scikit-learn
│   ├── app/                    config, schemas, data, normalization, engine, main
│   ├── data/members.json       approved member records (source of truth)
│   ├── scripts/                build_index, validate_data, evaluate, sync_mobile_data
│   ├── evaluation/             results.json + RESULTS.md
│   └── tests/                  pytest suite
├── docs/                       COMBO_A3_G-10-6870_REPORT.pdf and its Markdown source
├── evidence/                   demo video, contributions, test log, feedback, AI_USE
└── build/                      AgriSokoPocket_G-10-6870.apk
```

### How the parts work together

1. `ai-api/data/members.json` is the single approved source of truth. Each member signs their own
   record before release.
2. `python scripts/build_index.py` validates the dataset, builds the TF-IDF index and writes the
   SHA-256 dataset fingerprint plus model metadata into `ai-api/artifacts/`.
3. The FastAPI service serves `/health`, `/members`, `/members/{id}`, `/ask` and `/model-info`.
   `/ask` returns only fields that exist in the approved dataset: the service reorganises approved
   facts, it never creates new ones.
4. `python scripts/sync_mobile_data.py` copies the safe directory fields into
   `mobile/src/data/members.bundled.json`, which is what makes exact name, nickname, role and
   feature lookup work offline.
5. The mobile app calls `/ask` when online, caches the last successful answer in AsyncStorage, falls
   back to bundled offline lookup when the network is unavailable, and always labels the result as
   `Live AI match`, `Cached result` or `Offline match`.

## AI matching design

| Aspect | Decision |
| --- | --- |
| Documents | One per member from full name, aliases, role, skills, feature, problem, contribution, target user and evidence summary |
| Vectorizer | scikit-learn `FeatureUnion`: `TfidfVectorizer` word (1,2)-grams plus `TfidfVectorizer(char_wb)` 3-5 shingles, character weight 0.6 |
| Similarity | Cosine similarity between the question and each member document |
| Confidence | `0.6 x cosine + 0.4 x query-term coverage` |
| Alias boost | An exact full-name or alias phrase raises the score to **0.97**; two competing exact identities return no match instead of guessing |
| Threshold | **0.45**, tested and justified with the recorded query suite (`ai-api/evaluation/RESULTS.md`) |
| Grounding | Responses are assembled from approved fields only; unmatched questions return no match with suggestions |

Full evaluation, threshold sweep, confusion matrix and the error table:
[`ai-api/evaluation/RESULTS.md`](ai-api/evaluation/RESULTS.md).

## Setup and run

### Prerequisites

- Node.js 20 or newer and npm
- Python 3.11 or newer
- An Expo account (only for EAS builds)
- Optional: Android Studio or a physical Android phone

### 1. AI service

```bash
cd ai-api
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python scripts/validate_data.py    # dataset + privacy check
python scripts/build_index.py      # index, fingerprint, model metadata
python scripts/evaluate.py         # accuracy, threshold sweep, error table
python -m pytest                   # automated tests
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Interactive API documentation: `http://127.0.0.1:8000/docs`.

### 2. Mobile app (development)

```bash
cd mobile
npm install
npx expo install --fix
npm run sync:data                  # copy the approved directory into the app
npx expo start --clear
```

Scan the QR code with Expo Go, or press `a` for an attached Android device.

### 3. Point the app at the API

Set the FastAPI base URL at build time. Nothing secret is stored in the app.

```bash
export EXPO_PUBLIC_API_BASE_URL="https://<your-service-host>"
# or edit expo.extra.apiBaseUrl in mobile/app.json
```

Leaving the value empty is a valid configuration: the app then runs in offline-only mode and says so
on the Home and About screens. Timeout, group code and threshold are configurable the same way:
`EXPO_PUBLIC_REQUEST_TIMEOUT_MS`, `EXPO_PUBLIC_GROUP_CODE`, `EXPO_PUBLIC_CONFIDENCE_THRESHOLD`.

### 4. Android APK

Two build paths exist. Both read the group code from `mobile/app.json`, so the artefact name follows
`scripts/apply_group_code.py` automatically.

**Cloud build with EAS** (needs an Expo account):

```bash
cd mobile
npx eas-cli login                    # once per machine
bash ../build/build_apk.sh           # runs eas init, builds profile 'preview', downloads to build/
```

**Local build with the Android SDK** (no Expo account, nothing uploaded anywhere):

```bash
export ANDROID_HOME="$HOME/android-sdk"
bash build/build_apk_local.sh
```

This is the path that produced the submitted file. It runs `expo prebuild`, compiles `arm64-v8a` with
Gradle, copies the result to `build/AgriSokoPocket_G-10-6870.apk`, and re-signs it with the private
keystore at `~/.agrisoko-keys/agrisoko-release.jks` when `AGRISOKO_KEY_PASS` is set. The keystore is
deliberately outside the repository. Without it the APK keeps Gradle's debug signature, which still
installs over `adb` but is not a release identity.

Measured on this machine: 16 min 56 s, 26 MB, package `rw.ines.agrisoko.pocket.g106870`, versionName
`1.0.0`, `minSdk 24`, `targetSdk 35`, SHA-256
`c5cd012129092576e29ffcc8652d3ec5c53051e82a2234266eb5bb41e71978f5`. The full record is in
`evidence/TEST_LOG.md` section 5.

Attach the same file to the GitHub `v1.0.0` release.

### 5. PDF evidence

The report and the evidence documents are generated from their Markdown sources:

```bash
bash docs/make_pdfs.sh              # writes build/pdf/*.pdf
```

The script uses `pandoc` when it is installed and falls back to the bundled
`docs/md_to_html.py` converter, then renders with headless LibreOffice. Copy the assessed PDFs to
the locations listed under [Evidence files](#evidence-files).

### 6. Checks

```bash
cd mobile
npm run check                       # typecheck + offline lookup + validation checks
```

## API reference

| Endpoint | Purpose | Example |
| --- | --- | --- |
| `GET /health` | Service status, version, group code, member count, dataset fingerprint | `curl http://127.0.0.1:8000/health` |
| `GET /members` | Safe directory fields for every approved member | `curl http://127.0.0.1:8000/members` |
| `GET /members/{id}` | One complete approved profile, or a clear 404 | `curl http://127.0.0.1:8000/members/aline-uwase` |
| `POST /ask` | Query, top match, confidence, reason, introduction, evidence links, model version | see below |
| `GET /model-info` | Vectorizer type, threshold, fingerprint, limitations, build commit, evaluation | `curl http://127.0.0.1:8000/model-info` |

```bash
curl -X POST http://127.0.0.1:8000/ask \
  -H 'Content-Type: application/json' \
  -d '{"query": "Who built offline mode?"}'
```

```jsonc
{
  "query": "Who built offline mode?",
  "groupCode": "G-10-6870",
  "modelVersion": "agrisoko-tfidf-v1",
  "threshold": 0.45,
  "datasetFingerprint": "…64 hex characters…",
  "match": { "id": "samuel-habimana", "fullName": "…", "evidenceLinks": [ … ] },
  "confidence": 0.62,
  "reason": "Matched profile terms: offline, mode. …",
  "matchedTerms": ["offline", "mode"],
  "introduction": "My name is …",
  "evidenceLinks": [ … ],
  "source": "live",
  "suggestions": [ { "label": "…", "kind": "name" } ],
  "topCandidates": [ { "id": "…", "fullName": "…", "confidence": 0.62 } ]
}
```

A low-confidence question returns `"match": null`, a `reason` that explains the threshold and a list
of suggestions. The service never invents a biography, metric, link or stakeholder quote.

## Mobile behaviour

| Requirement | Where it lives |
| --- | --- |
| Project home: purpose, users, group code, version, online/offline status | `src/screens/HomeScreen.tsx` |
| Ask the team with natural-language input | `src/screens/AskScreen.tsx` |
| AI result: member, confidence, reason, generated introduction | `src/screens/ResultScreen.tsx` |
| Member profile: contribution, skills, measured evidence, working links | `src/screens/MemberProfileScreen.tsx` |
| Member directory with manual selection, no AI search | `src/screens/DirectoryScreen.tsx` |
| No-match safety with suggested names, roles, features | `src/screens/ResultScreen.tsx` |
| Offline exact name, nickname, role and feature lookup, labelled | `src/services/offline.ts`, `src/context/TeamContext.tsx` |
| Loading, timeout, retry, server-unavailable without losing the last result | `src/services/api.ts`, `src/components/StateBanner.tsx` |
| About: data source, model approach, limitations, API status, GitHub URL, APK version, code | `src/screens/AboutScreen.tsx` |
| Standalone Android release | `mobile/eas.json`, `build/AgriSokoPocket_G-10-6870.apk` |

Engineering notes: typed navigation parameters (`src/navigation/types.ts`), reusable components,
`accessibilityLabel`/`accessibilityHint` on every interactive control, `maxFontSizeMultiplier` for
large-text behaviour, contrast-checked palette in `src/theme.ts`, empty and over-long question
validation before any request, a configurable base URL with an explicit 8000 ms timeout, and
`Linking` for every evidence URL with a visible message when a link cannot open.

## Tested devices

| # | Device | Android version | Build type | Result |
| --- | --- | --- | --- | --- |
| 1 | *(fill in)* | *(fill in)* | EAS preview APK | *(fill in)* |
| 2 | *(fill in)* | *(fill in)* | EAS preview APK | *(fill in)* |

## AI evaluation summary

| Metric | Value |
| --- | --- |
| Member queries | 15 (three per member: name/alias, role, feature) |
| Deliberate no-match queries | 5 |
| Top-1 member accuracy | 1.000 (15/15) |
| No-match rejection accuracy | 1.000 (5/5) |
| Errors at the configured threshold | 0 |
| Threshold | 0.45, justified by the recorded sweep |

These figures are produced by `ai-api/evaluation/queries.json` against the five approved records and
are reproducible with `python scripts/evaluate.py`. Full detail:
[`ai-api/evaluation/RESULTS.md`](ai-api/evaluation/RESULTS.md).

## Repository collaboration

- One public repository containing `mobile/`, `ai-api/`, `docs/` and `evidence/`.
- One GitHub issue per assessed feature, with an owner, acceptance criteria and a module label.
- Named feature branches per member; no shared accounts and no copied commit histories.
- Every member opens at least one substantial pull request linked to their issue and reviews at least
  one pull request from another member with a substantive comment or requested check.
- Only tested work is merged into `main`. The assessed state is tagged `v1.0.0` with a GitHub Release
  carrying `AgriSokoPocket_G-10-6870.apk`.

Contribution map, per-member issue, branch, pull request, review, merged commit, test and
demonstration timestamp: [`evidence/CONTRIBUTIONS.pdf`](evidence/README.md).

## Known limitations

- Matching is lexical (TF-IDF word and character features). Synonyms and paraphrases that share no
  vocabulary can fall below the threshold; the app then says no confident match was found.
- Confidence is a retrieval score, not a probability that a profile is true.
- Offline mode supports exact name, nickname, role and feature lookup only. It does not run TF-IDF on
  the phone, and it does not show the full evidence link list.
- The profile content is exactly as strong as `members.json`. A missing metric stays missing; nothing
  is generated to fill a gap.
- `members.json` is loaded at service start. Editing it requires a restart or redeploy.
- The app needs a reachable HTTPS FastAPI URL for live matching; a wrong or expired URL degrades
  gracefully to cached and offline behaviour instead of crashing.

## Evidence files

| Requirement | Location |
| --- | --- |
| README with group code, roles, commands, URLs, hashes | `README.md` |
| UI UX and AI system report (1-10 pages PDF) | `docs/COMBO_A3_G-10-6870_REPORT.pdf` |
| Demonstration video (MP4, max 3 minutes) | `evidence/COMBO_A3_G-10-6870_DEMO.mp4` |
| Signed contribution document | `evidence/CONTRIBUTIONS.pdf` |
| Test log (AI queries, API tests, device matrix, testers) | `evidence/TEST_LOG.pdf` |
| Tester feedback with consent records | `evidence/FEEDBACK.pdf` |
| AI tool usage disclosure | `evidence/AI_USE.md` |
| Release APK | `build/AgriSokoPocket_G-10-6870.apk` |

## Fill-in checklist

Status of the assessment deliverables. Items marked "not done" need a person with hardware or a
personal GitHub account; they have not been simulated.

### Done

- Group code `G-10-6870` applied to the app name, the API configuration, the documentation and the
  evidence files. The Android package and Expo slug use the hyphen-free form `g106870`.
- `ai-api/data/members.json` holds the five signed member records.
- Validation, index build, evaluation, mobile data sync and all test suites pass.
- Repository created and pushed: `https://github.com/ug2424671-collab/agrisoko-pocket-g10-6870`.
- One issue per member opened, with owner, acceptance criteria and a module label (issues #1-#5).
- Five feature branches created from `main`: `feat/product-scope-and-repo`,
  `feat/ai-tfidf-engine`, `feat/fastapi-contract`, `feat/mobile-screens`, `feat/offline-cache`.
- Release APK built locally, signed with a private release key, verified, and published:
  `v1.0.0` with `AgriSokoPocket_G-10-6870.apk` attached.
- Report and evidence PDFs generated with `bash docs/make_pdfs.sh`.

### Remaining

1. **Pull requests and reviews.** Each member must commit to their own branch from their own GitHub
   account, open a pull request and review at least one other member's pull request. The branches are
   still empty: pushing commits under another member's name would invent history, so this step needs
   each member to act. The empty columns in `evidence/CONTRIBUTIONS.md` depend on it.
2. **Device testing.** Install `build/AgriSokoPocket_G-10-6870.apk` on two Android devices and fill the
   device matrix and state-coverage table in `evidence/TEST_LOG.md` (section 4). No device was
   available on the build machine, so no row has been filled.
3. **Tester sessions.** Run them and record consent in `evidence/FEEDBACK.md`. Only then add real,
   consented quotations to the `testerFeedback` field of `ai-api/data/members.json` and re-run
   `validate_data.py`, `build_index.py`, `evaluate.py` and `sync_mobile_data.py`.
4. **Demonstration video.** Record it (maximum 3 minutes) and store it as
   `evidence/COMBO_A3_G-10-6870_DEMO.mp4`.
5. **Re-export the PDFs** after the documents above are final: `bash docs/make_pdfs.sh`.

If the repository or the group code ever changes, re-run the substitution:

```bash
python3 scripts/apply_group_code.py --group-code G-10-6870 \
  --repo-url https://github.com/<your-org>/agrisoko-pocket-g10-6870
```

Use `--dry-run` to preview. The script is idempotent: a second run reports no changes.
