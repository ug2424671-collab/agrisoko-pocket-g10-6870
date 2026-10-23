# COMBO_A3_GXX - AI tool usage disclosure

Group code: **GXX** · Date: `<date>`

AI tools may support brainstorming, explanation, debugging or code review. They do not replace
authorship, testing, truthful profiles, GitHub collaboration or the individual defense. Replace the
rows below with your group's real usage, or write **"No AI used"** if that is the truth.

## Tools used

| Tool | Version or model | Used by | Purpose |
| --- | --- | --- | --- |
| | | | |

## Requests that shaped the work

Only record requests that actually changed a file or a decision. Quote the important part, not the
whole conversation.

| # | Tool | Request or prompt (summary) | Outcome accepted | Files affected | Check performed |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

## What was checked by a human

For every generated or edited artefact, state how the group verified it.

| Artefact | Verification |
| --- | --- |
| `ai-api/data/members.json` | Each member read their own record and confirmed every claim, link and metric. |
| TF-IDF engine and threshold | Ran `python scripts/evaluate.py`; inspected the error table and the threshold sweep. |
| API responses | Ran `python -m pytest`; hand-checked `POST /ask` for a matched and a no-match question. |
| Mobile screens | Ran `npm run check` and tested on physical Android devices. |
| Profiles and introductions | Confirmed each introduction contains only claims traceable to `members.json` and the repository. |

## What was not delegated

- No fabricated metric, tester count, stakeholder quote or repository link.
- No invented GitHub history: every branch, commit, pull request and review exists on GitHub.
- No unattended generation of member profiles: each member wrote and signed their own record.
- No secret, token or credential was pasted into an AI tool or committed to the repository.

## Integrity statement

We understand that copied repositories, shared accounts, fabricated collaboration history, falsified
tests and invented stakeholder feedback are handled under the academic integrity rules. The evidence
in `evidence/` and the repository history describe what actually happened.

Signed (one line per member):

| Member | Signature | Date |
| --- | --- | --- |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
