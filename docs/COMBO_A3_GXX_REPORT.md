# AgriSoko Pocket GXX — UI/UX and AI System Report

**Integrated Mobile and Artificial Intelligence — Group Assignment 3**

| Field | Value |
| --- | --- |
| Group code | `GXX` |
| Application | AgriSoko Pocket GXX |
| Package | `rw.ines.agrisoko.pocket.gxx` |
| Repository | `https://github.com/<org>/agrisoko-pocket-gxx` |
| Release | `v1.0.0` |
| APK | `build/AgriSokoPocket_GXX.apk` |
| AI model | `agrisoko-tfidf-v1` |
| Confidence threshold | `0.45` |
| Report date | `<date>` |

> Replace `GXX`, `<org>`, `<date>` and every `<fill in>` with the group's real values before export.
> Do not add a metric, tester name, quotation or link that is not traceable to `evidence/` or the
> repository.

---

## 1. Executive summary

AgriSoko Pocket is demonstrating its work to potato cooperatives, employers and innovation partners in
Musanze. A visitor needs to know, quickly and honestly, **who did what, and what evidence supports
it**. This project delivers two integrated parts:

- **AgriSoko Pocket GXX** — a React Native (Expo) Android application that answers natural-language
  questions about the team, presents a confidence-scored match with the reason for the match, shows an
  evidence-backed professional introduction, and works offline for exact name, nickname, role and
  feature lookup.
- **A deterministic member-matching API** — a FastAPI service backed by a scikit-learn TF-IDF
  retrieval engine that reorganises approved facts from a single signed dataset. It never generates a
  new claim, metric, link or quote.

The engineering priority throughout is **trustworthiness over fluency**. When the engine is not
confident, it says so and offers suggestions instead of inventing an answer.

## 2. Product goals and users

| Item | Statement |
| --- | --- |
| Primary user | A cooperative member, employer or partner visiting the AgriSoko demonstration |
| Job to be done | Identify the right team member for a topic, and see the evidence behind the claim |
| Success looks like | The visitor reaches the correct profile in one question, online or offline |
| Non-goal | Acting as a general chatbot, or answering questions that are not about the team |
| Non-goal | Producing biographies, metrics or testimonials that no member wrote |

## 3. UI/UX design

### 3.1 Screens

| Screen | Purpose | Key UX decision |
| --- | --- | --- |
| Home | Purpose, intended users, group code, app version, AI/live/offline status | The group code and status are visible immediately, because the brief and the defense both depend on them |
| Ask | Free-text natural-language question | Validation runs before any request, so an empty or over-long question never reaches the network |
| Result | Matched member, confidence meter, reason, matched terms, generated introduction, evidence links, source badge | The confidence value and the reason sit **above** the introduction, so the visitor can judge the match before reading it |
| Directory | Manual selection of any member | Deliberately **no AI search** here: it proves the profiles stand on their own |
| Member profile | Role, skills, problem, contribution, feature, measured evidence, working links | Every claim is paired with the link or file that supports it |
| About | Data source, model approach, limitations, API status, repository URL, APK version | States the limitations plainly rather than hiding them |

### 3.2 Navigation

A typed bottom-tab navigator (Home, Ask, Directory, About) hosts a typed stack for the profile and
result routes. Route parameters are declared in `mobile/src/navigation/types.ts`, so an incorrect
navigation call is a compile-time error rather than a runtime crash.

### 3.3 Accessibility and large text

- Every interactive control carries an `accessibilityLabel` and, where useful, an `accessibilityHint`.
- Long-form content uses `maxFontSizeMultiplier` so a large system font increases readability instead
  of breaking the layout.
- The palette in `mobile/src/theme.ts` is contrast-checked against the dark surfaces it is drawn on.
- Status is never communicated by colour alone: the source badge and state banners always pair colour
  with a written label (`Live AI match`, `Cached result`, `Offline match`).

### 3.4 Failure and empty states

| Situation | User-visible behaviour |
| --- | --- |
| Empty, whitespace, too short, too long or non-alphanumeric question | Inline validation message; no request is sent |
| Request exceeds the configured timeout (8000 ms) | Timeout state with a retry action |
| Server reachable but failing | "Server unavailable" state; the **last successful result is preserved** |
| No confident match | No-match screen with an explanation of the threshold and suggested names, roles and features |
| Network unavailable | Automatic offline lookup, clearly labelled `Offline match` |
| Evidence link cannot open | A visible message, instead of a silent failure |

### 3.5 Appearance

Included in `evidence/` as screenshots at phone resolution: Home, Ask, Result (match), Result
(no match), Directory, Member profile, About, large-text profile, and the offline result.

## 4. System architecture

```
AgriSoko Pocket GXX
├── mobile/     React Native + Expo + TypeScript  ──►  Android APK
│   src/config, context, components, hooks, navigation, screens, services, data
├── ai-api/     Python + FastAPI + scikit-learn
│   app/ (config, schemas, data, normalization, engine, main)
│   data/members.json        approved source of truth
│   scripts/                 validate_data, build_index, evaluate, sync_mobile_data
│   artifacts/               index, fingerprint, model metadata
│   evaluation/              results.json, RESULTS.md
│   tests/                   pytest suite
├── docs/       this report
├── evidence/   video, contributions, test log, feedback, AI use
└── build/      AgriSokoPocket_GXX.apk
```

### 4.1 Data flow

1. `ai-api/data/members.json` holds one signed record per member. It is the only source of profile
   facts in the whole system.
2. `scripts/validate_data.py` enforces the schema, required fields, approved field names and a privacy
   check before anything else runs.
3. `scripts/build_index.py` builds the TF-IDF index and writes the model metadata together with a
   SHA-256 fingerprint of the dataset bytes into `ai-api/artifacts/`.
4. The API serves `/health`, `/members`, `/members/{id}`, `/ask` and `/model-info`. Every response
   carries the model version and the dataset fingerprint, so a reported answer can be traced back to
   the exact dataset that produced it.
5. `scripts/sync_mobile_data.py` copies only the safe directory fields into
   `mobile/src/data/members.bundled.json`. This is what powers offline lookup.
6. The app calls `/ask` when online, caches the last successful answer in AsyncStorage, and falls back
   to bundled lookup when the network is unavailable — always labelling which of the three sources the
   visitor is seeing.

## 5. AI approach

| Aspect | Decision |
| --- | --- |
| Task | Retrieve the best-matching member for a natural-language question |
| Documents | One document per member, built from full name, aliases, role, skills, feature, problem, contribution, target user and evidence summary |
| Vectorizer | scikit-learn `FeatureUnion` of `TfidfVectorizer` word (1,2)-grams and `TfidfVectorizer(char_wb)` 3–5 shingles with character weight 0.6 |
| Similarity | Cosine similarity between the question vector and each member document |
| Confidence | `0.6 × cosine + 0.4 × query-term coverage` |
| Identity boost | An exact full-name or alias phrase raises the score to **0.97** |
| Ambiguity guard | Two competing exact identities return no match rather than guessing |
| Threshold | **0.45**, justified by the recorded sweep in `ai-api/evaluation/RESULTS.md` |
| Grounding | Responses are assembled from approved fields only |

### 5.1 Why the confidence formula is not raw cosine

Word-level TF-IDF cosine on short questions against short documents is naturally low: in the recorded
suite no correct answer exceeded 0.34 raw cosine. A threshold of 0.45 applied to raw cosine would
therefore reject every correct answer. The confidence score combines retrieval similarity with
**query-term coverage** — the share of meaningful query terms that actually appear in the member
document — so a short, specific question such as "who built offline mode?" can reach a defensible
score, while an unrelated question still cannot.

The character-level `char_wb` features are included so that typographical variants
("Sammuel" → "Samuel") still match. This behaviour is covered by an explicit test.

### 5.2 Grounding rules

- The engine selects a member; the response text is assembled from that member's approved fields.
- No field is paraphrased into a claim the member did not write.
- An unmatched question returns `match: null`, an explanation of the threshold and suggestions.
- Aliases are used for matching but are not presented as legal names.

### 5.3 Limitations (also shown in the app)

- Matching is lexical. A paraphrase that shares no vocabulary with a profile can fall below the
  threshold; the app then reports no confident match.
- Confidence is a retrieval score, not a probability that a profile is true.
- Offline mode supports exact name, nickname, role and feature lookup only. TF-IDF does not run on the
  phone, and the full evidence link list is not shown offline.
- The quality of every profile is bounded by `members.json`. A missing metric stays missing.

## 6. Evaluation

Full results, the threshold sweep, the confusion matrix, the error table and per-query output live in
[`ai-api/evaluation/RESULTS.md`](../ai-api/evaluation/RESULTS.md) and `results.json`.

| Metric | Value |
| --- | --- |
| Member queries | 15 (name or alias, role and feature for each of the five members) |
| Deliberate no-match queries | 5 |
| Top-1 member accuracy | 1.000 (15/15) |
| No-match rejection accuracy | 1.000 (5/5) |
| Errors at threshold 0.45 | 0 |
| Threshold sweep | 0.30–0.45 all clean; degradation begins at 0.50 |

The sweep is the justification for 0.45: it is the highest threshold that keeps every deliberate
no-match question rejected **and** every correct member question answered. Raising it to 0.50 already
loses a correct answer.

These figures are produced by `ai-api/evaluation/queries.json` against the five approved records in
`ai-api/data/members.json`, and are reproducible with `python scripts/evaluate.py`. The dataset
fingerprint recorded in `ai-api/evaluation/RESULTS.md` identifies the exact dataset behind them.

## 7. Testing

| Layer | What is checked | How |
| --- | --- | --- |
| Dataset | Schema, required fields, approved field names, privacy | `python scripts/validate_data.py` |
| Engine | Ranking, alias boost, typo tolerance, ambiguity guard, threshold behaviour | `python -m pytest` (41 tests) |
| API | Every endpoint, status codes, grounding, degraded mode with an empty dataset | `python -m pytest` via FastAPI `TestClient` |
| Evaluation | Accuracy, rejection, sweep, errors | `python scripts/evaluate.py` |
| Mobile types | Typed navigation, config and props | `npx tsc --noEmit` |
| Mobile logic | Offline lookup, normalisation, question validation | `npm run check` |
| Mobile project | Dependency and configuration health | `npx expo-doctor` (18/18 checks passed) |
| Devices | Install and run the release APK | see `evidence/TEST_LOG.md` |
| Testers | Task-based sessions with consent | see `evidence/FEEDBACK.md` |

Every test result recorded in `evidence/TEST_LOG.md` must come from an actual run. Where a check was
not performed, the log says so.

## 8. Repository collaboration

- One public repository containing `mobile/`, `ai-api/`, `docs/` and `evidence/`.
- One GitHub issue per assessed feature with an owner, acceptance criteria and a module label.
- A named feature branch per member, with one substantial pull request linked to the issue.
- Each member reviews at least one other member's pull request with a substantive comment or requested
  check.
- Only tested work is merged into `main`; the assessed state is tagged `v1.0.0` with a GitHub Release
  carrying the APK.

The per-member issue, branch, pull request, review, merged commit, test and demonstration timestamp are
recorded in `evidence/CONTRIBUTIONS.pdf`.

## 9. Ethics, privacy and AI disclosure

- Only approved professional fields are stored. No private address, phone number, national ID or
  grade appears in the dataset.
- No fabricated metric, tester count, quotation or repository link appears anywhere in the project.
- AI tool usage is disclosed honestly in `evidence/AI_USE.md`; where no tool was used, the file says so.
- Testers gave consent before being quoted, and were told the purpose of the session.
- The About screen discloses the model, the data source and the limitations to the end user.

## 10. Known limitations and future work

| Limitation | Possible next step |
| --- | --- |
| Lexical matching misses pure paraphrases | Add a small embedding model behind the same grounded response contract |
| Offline mode does not run retrieval on-device | Ship a quantised on-device index |
| Profiles are only as strong as `members.json` | Add a review checklist that requires a measured outcome per member |
| Single-language vocabulary | Add Kinyarwanda aliases and role terms to the dataset |
| Dataset is loaded at start-up | Reload on file change, or serve from a database |

## 11. Requirement traceability

| Requirement | Where it is satisfied |
| --- | --- |
| Natural-language question input | `mobile/src/screens/AskScreen.tsx` |
| AI result with confidence and reason | `mobile/src/screens/ResultScreen.tsx`, `ai-api/app/engine.py` |
| Evidence-based member introduction | `ai-api/app/engine.py`, `mobile/src/components/EvidenceLinkList.tsx` |
| Member profile with contribution, skills, evidence, links | `mobile/src/screens/MemberProfileScreen.tsx` |
| Manual member directory without AI | `mobile/src/screens/DirectoryScreen.tsx` |
| No-match safety with suggestions | `ai-api/app/engine.py`, `mobile/src/screens/ResultScreen.tsx` |
| Offline lookup, labelled | `mobile/src/services/offline.ts`, `mobile/src/context/TeamContext.tsx` |
| Loading, timeout, retry, server-unavailable | `mobile/src/services/api.ts`, `mobile/src/components/StateBanner.tsx` |
| About screen with limitations and links | `mobile/src/screens/AboutScreen.tsx` |
| Standalone Android release | `mobile/eas.json`, `build/AgriSokoPocket_GXX.apk` |
| Repository evidence | `evidence/`, GitHub issues, pull requests, `v1.0.0` release |

## 12. Signatures

Each member confirms that they authored their contribution, reviewed their own approved record, and can
explain the technical decisions in their part of the system during the defense.

| Member | Registration no. | Contribution area | Signature | Date |
| --- | --- | --- | --- | --- |
| Kiir Deng Kur | 2424671 | Product and repository lead | | |
| Menzi Prince Peter | 2528149 | AI and data engineer | | |
| Uwase Teta Diolinda | 2526870 | API and integration engineer | | |
| Shyaka Peter Guy | 252670 | Mobile UI and navigation engineer | | |
| Umutoni Liliane | 2527968 | Offline, quality and evidence engineer | | |
