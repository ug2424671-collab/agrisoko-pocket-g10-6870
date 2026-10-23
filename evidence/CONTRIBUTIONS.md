# COMBO_A3_GXX - Contribution document

Group code: **GXX** · Repository: `https://github.com/<org>/agrisoko-pocket-gxx` ·
Release tag: `v1.0.0` · Final commit: `<hash>`

Every member signs the row that describes their own work. A signature confirms that the listed
contribution is accurate. Record any disagreement honestly in the notes at the end.

## Members and roles

| # | Name | Registration no. | Primary role | Review responsibility | GitHub |
| --- | --- | --- | --- | --- | --- |
| 1 | | | Product and GitHub lead | Product scope and contribution evidence | |
| 2 | | | AI and data engineer | API tests and no-match safety | |
| 3 | | | API and integration engineer | Mobile networking and error handling | |
| 4 | | | Mobile UI and navigation engineer | UI and UX evidence | |
| 5 | | | Offline and quality engineer | AI query evaluation | |
| 6 | | | Release and evidence engineer | Repository traceability | |

## Requirement to owner map

| Requirement | Owner | Issue | Branch | Pull request | Review | Merged commit | Test evidence | Demo timestamp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Member dataset schema and signed records | AI and data engineer | | | | | | `ai-api/tests/test_data.py` | |
| TF-IDF matching engine, alias boost, threshold | AI and data engineer | | | | | | `ai-api/tests/test_engine.py` | |
| Query suite and evaluation report | AI and data engineer | | | | | | `ai-api/scripts/evaluate.py`, `RESULTS.md` | |
| FastAPI endpoints and grounding controls | API and integration engineer | | | | | | `ai-api/tests/test_api.py` | |
| Deployment and reachable API URL | API and integration engineer | | | | | | `/health`, `/model-info` screenshots | |
| Home, Ask, Result screens | Mobile UI and navigation engineer | | | | | | device matrix | |
| Directory and member profile screens | Mobile UI and navigation engineer | | | | | | device matrix | |
| Typed navigation, accessibility, theme | Mobile UI and navigation engineer | | | | | | `npm run check` | |
| AsyncStorage cache and cache source labels | Offline and quality engineer | | | | | | `npm run test:offline` | |
| NetInfo connectivity, timeout, retry states | Offline and quality engineer | | | | | | device matrix, issue repro | |
| Bundled directory sync for offline lookup | Offline and quality engineer | | | | | | `scripts/sync_mobile_data.py` | |
| EAS configuration and APK build | Release and evidence engineer | | | | | | `build/AgriSokoPocket_GXX.apk` | |
| Test log, feedback log, report, demo video | Release and evidence engineer | | | | | | `evidence/` | |
| README, release tag `v1.0.0`, release asset | Product and GitHub lead | | | | | | release page | |
| Repository setup, issues, milestones, merge policy | Product and GitHub lead | | | | | | issue list | |

## Merged commits traceable to v1.0.0

| Member | Files | Commit | Verified by |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## Peer reviews

| Reviewer | Reviewed pull request (author) | Type of comment | Link |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## Signatures

By signing, each member confirms that the contribution rows above that name them are accurate and
that their own profile record in `ai-api/data/members.json` is truthful and privacy-safe.

| Member | Signature | Date |
| --- | --- | --- |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |

## Disagreements and corrections

Record honestly any disagreement about ownership, evidence or credit, and how the group resolved it.

-

## Truthfulness statement

No metric, tester count, stakeholder statement or impact claim appears in this document, in the
app, in the API or in any profile unless traceable evidence exists in this repository. Where no
verified outcome exists, the text states what was built and tested and nothing more.
