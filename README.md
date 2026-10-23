# AgriSoko Pocket GXX

Integrated Mobile and Artificial Intelligence - Group Assignment 3.

**Group code placeholder: `GXX`. Replace every `GXX` with the lecturer-assigned code, then rename the
repository, the app name and the APK asset accordingly.**
`README.md` also lists every place that still needs your group's data: see
[Fill-in checklist](#fill-in-checklist).

| Item | Value |
| --- | --- |
| Application name | AgriSoko Pocket GXX |
| Repository | `agrisoko-pocket-gxx` |
| Release APK | `AgriSokoPocket_GXX.apk` |
| Package name | `rw.ines.agrisoko.pocket.gxx` |
| Group verification code | `GXX` (shown on Home and About) |
| Release tag | `v1.0.0` |
| AI model version | `agrisoko-tfidf-v1` |
| Confidence threshold | `0.45` |
| Repository URL | `https://github.com/<org>/agrisoko-pocket-gxx` |
| v1.0.0 release URL | `https://github.com/<org>/agrisoko-pocket-gxx/releases/tag/v1.0.0` |
| Final commit hash | `<paste the commit that matches this ZIP>` |
| APK path | `build/AgriSokoPocket_GXX.apk` |

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
| 1 | *(fill in)* | *(fill in)* | Product and GitHub lead | Product scope and contribution evidence | *(username)* |
| 2 | *(fill in)* | *(fill in)* | AI and data engineer | API tests and no-match safety | *(username)* |
| 3 | *(fill in)* | *(fill in)* | API and integration engineer | Mobile networking and error handling | *(username)* |
| 4 | *(fill in)* | *(fill in)* | Mobile UI and navigation engineer | UI and UX evidence | *(username)* |
| 5 | *(fill in)* | *(fill in)* | Offline and quality engineer | AI query evaluation | *(username)* |
| 6 | *(fill in)* | *(fill in)* | Release and evidence engineer | Repository traceability | *(username)* |

Four-member groups combine roles 4 to 6 as described in the assignment brief. Every member
implements, tests and can explain a technical contribution.

Approved member records live in [`ai-api/data/members.json`](ai-api/data/members.json). Each member
reviewed and signed their own record; privacy-restricted data is deliberately absent.

## Architecture

```
AgriSoko Pocket GXX
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
├── docs/                       COMBO_A3_GXX_REPORT.pdf and its Markdown source
├── evidence/                   demo video, contributions, test log, feedback, AI_USE
└── build/                      AgriSokoPocket_GXX.apk
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

### 4. Android APK (EAS)

```bash
cd mobile
npx eas-cli login
npx eas-cli init                    # writes the real projectId into app.json
npx eas-cli build --platform android --profile preview
```

Download the resulting `AgriSokoPocket_GXX.apk` and place it in `build/`. Attach the same file to the
GitHub `v1.0.0` release.

Local alternative with an Android SDK present:

```bash
npx eas-cli build --platform android --profile preview --local
```

### 5. Checks

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
  "groupCode": "GXX",
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
| Standalone Android release | `mobile/eas.json`, `build/AgriSokoPocket_GXX.apk` |

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
| Member queries | 12 (three per member: name/alias, role, feature) |
| Deliberate no-match queries | 5 |
| Top-1 member accuracy | see `ai-api/evaluation/RESULTS.md` |
| No-match rejection accuracy | see `ai-api/evaluation/RESULTS.md` |
| Threshold | 0.45, justified by the recorded sweep |

## Repository collaboration

- One public repository containing `mobile/`, `ai-api/`, `docs/` and `evidence/`.
- One GitHub issue per assessed feature, with an owner, acceptance criteria and a module label.
- Named feature branches per member; no shared accounts and no copied commit histories.
- Every member opens at least one substantial pull request linked to their issue and reviews at least
  one pull request from another member with a substantive comment or requested check.
- Only tested work is merged into `main`. The assessed state is tagged `v1.0.0` with a GitHub Release
  carrying `AgriSokoPocket_GXX.apk`.

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
| UI UX and AI system report (1-10 pages PDF) | `docs/COMBO_A3_GXX_REPORT.pdf` |
| Demonstration video (MP4, max 3 minutes) | `evidence/COMBO_A3_GXX_DEMO.mp4` |
| Signed contribution document | `evidence/CONTRIBUTIONS.pdf` |
| Test log (AI queries, API tests, device matrix, testers) | `evidence/TEST_LOG.pdf` |
| Tester feedback with consent records | `evidence/FEEDBACK.pdf` |
| AI tool usage disclosure | `evidence/AI_USE.md` |
| Release APK | `build/AgriSokoPocket_GXX.apk` |

## Fill-in checklist

1. Replace `GXX` everywhere: `mobile/app.json` (`name`, `slug`, `package`, `extra.groupCode`,
   `extra.eas.projectId`), `ai-api/app/config.py` (`GROUP_CODE`), `mobile/src/config/index.ts`
   (`REPOSITORY_URL`), `README.md`, `docs/`, `evidence/`.
2. Rename the repository to `agrisoko-pocket-gxx` and the release asset to `AgriSokoPocket_GXX.apk`.
3. Replace the placeholder JSON in `ai-api/data/members.json` with the six signed member records.
4. Run `python scripts/validate_data.py`, `build_index.py`, `evaluate.py`, `sync_mobile_data.py`.
5. Re-run `npm run check` inside `mobile/`.
6. Build the APK, install it on two Android devices, record the demo, complete every evidence file.
7. Tag `v1.0.0`, publish the release with the APK, and paste the final commit hash in the table above.
