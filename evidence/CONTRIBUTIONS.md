# COMBO_A3_G-10-6870 - Contribution document

Group code: **G-10-6870** · Repository: `https://github.com/ug2424671-collab/agrisoko-pocket-g10-6870` ·
Release tag: `v1.0.0` · Final commit: `<hash>`

Every member signs the row that describes their own work. A signature confirms that the listed
contribution is accurate. Record any disagreement honestly in the notes at the end.

## Members and roles

| # | Name | Registration no. | Primary role | Review responsibility | GitHub |
| --- | --- | --- | --- | --- | --- |
| 1 | Kiir Deng Kur | 2424671 | Product and repository lead | Product scope and contribution evidence | [ug2424671-collab](https://github.com/ug2424671-collab) |
| 2 | Menzi Prince Peter | 2528149 | AI and data engineer | API tests and no-match safety | [ug2528149-cell](https://github.com/ug2528149-cell) |
| 3 | Uwase Teta Diolinda | 2526870 | API and integration engineer | Mobile networking and error handling | [TetaDiolinda](https://github.com/TetaDiolinda) |
| 4 | Shyaka Peter Guy | 252670 | Mobile UI and navigation engineer | UI and UX evidence | [peternickson4-max](https://github.com/peternickson4-max) |
| 5 | Umutoni Liliane | 2527968 | Offline, quality and evidence engineer | AI query evaluation | [lilianeumutoni302](https://github.com/lilianeumutoni302) |

## Requirement to owner map

Fill the Issue, Branch, Pull request, Review, Merged commit and Demo timestamp columns from the real
GitHub history and the recorded demo. Do not write a link or a timestamp that does not exist.

| Requirement | Owner | Issue | Branch | Pull request | Review | Merged commit | Test evidence | Demo timestamp |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Member dataset schema and signed records | Menzi Prince Peter | | | | | | `ai-api/tests/test_data.py` | |
| TF-IDF matching engine, alias boost, threshold | Menzi Prince Peter | | | | | | `ai-api/tests/test_engine.py` | |
| Query suite and evaluation report | Umutoni Liliane | | | | | | `ai-api/scripts/evaluate.py`, `RESULTS.md` | |
| FastAPI endpoints and grounding controls | Uwase Teta Diolinda | | | | | | `ai-api/tests/test_api.py` | |
| Deployment and reachable API URL | Uwase Teta Diolinda | | | | | | `/health`, `/model-info` screenshots | |
| Home, Ask, Result screens | Shyaka Peter Guy | | | | | | device matrix | |
| Directory and member profile screens | Shyaka Peter Guy | | | | | | device matrix | |
| Typed navigation, accessibility, theme | Shyaka Peter Guy | | | | | | `npm run check` | |
| AsyncStorage cache and cache source labels | Umutoni Liliane | | | | | | `npm run test:offline` | |
| NetInfo connectivity, timeout, retry states | Umutoni Liliane | | | | | | device matrix, issue repro | |
| Bundled directory sync for offline lookup | Umutoni Liliane | | | | | | `scripts/sync_mobile_data.py` | |
| EAS configuration and APK build | Shyaka Peter Guy | | | | | | `build/AgriSokoPocket_G-10-6870.apk` | |
| Test log, feedback log, report, demo video | Umutoni Liliane | | | | | | `evidence/` | |
| README, release tag `v1.0.0`, release asset | Kiir Deng Kur | | | | | | release page | |
| Repository setup, issues, merge policy | Kiir Deng Kur | | | | | | issue list | |
| Mobile networking, timeout and error handling review | Uwase Teta Diolinda | | | | | | `mobile/src/services/api.ts` | |

## Merged commits traceable to v1.0.0

Fill from `git log` after the repository is pushed. Each row must name a commit that is actually
reachable from the `v1.0.0` tag.

| Member | Files | Commit | Verified by |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |
| | | | |
| | | | |

## Peer reviews

Each member reviews at least one other member's pull request with a substantive comment or requested
check. Record the real review, not a placeholder.

| Reviewer | Reviewed pull request (author) | Type of comment | Link |
| --- | --- | --- | --- |
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
| Kiir Deng Kur | | |
| Menzi Prince Peter | | |
| Uwase Teta Diolinda | | |
| Shyaka Peter Guy | | |
| Umutoni Liliane | | |

## Disagreements and corrections

Record honestly any disagreement about ownership, evidence or credit, and how the group resolved it.

- The first draft of the dataset gave Menzi Prince Peter the alias "Peter", which collided with Shyaka
  Peter Guy. The group removed the shared alias so an ambiguous name cannot silently return the wrong
  member. This is recorded here because it changed the dataset that `GET /members` returns.

## Truthfulness statement

No metric, tester count, stakeholder statement or impact claim appears in this document, in the
app, in the API or in any profile unless traceable evidence exists in this repository. Where no
verified outcome exists, the text states what was built and tested and nothing more.
