# AI evaluation results

- Model: `agrisoko-tfidf-v1`
- Dataset: `tests/fixtures/members.sample.json`
- Dataset SHA-256: `edddf9af047f9f3a669712aa6c103f847973a2813c163c32b8df13419268cf2f`
- Query file: `tests/fixtures/queries.sample.json`
- Generated: 2026-10-23T00:25:53+00:00
- Threshold: **0.45**

## Summary

| Metric | Value |
| --- | --- |
| Top-1 member accuracy (returned profile) | 1.000 |
| Top-1 retrieval accuracy (rank 1, before threshold) | 1.000 |
| No-match rejection accuracy | 1.000 |
| Member queries | 12 |
| No-match queries | 5 |
| Errors | 0 |

## Accuracy by query kind

| Kind | Correct | Total | Accuracy |
| --- | --- | --- | --- |
| alias | 2 | 2 | 1.000 |
| feature | 4 | 4 | 1.000 |
| name | 2 | 2 | 1.000 |
| no_match | 5 | 5 | 1.000 |
| role | 4 | 4 | 1.000 |

## Threshold sweep

The configured threshold is 0.45. The sweep below records how member
accuracy and no-match rejection change if it moves; the chosen value must
keep every deliberate no-match question rejected.

| Threshold | Top-1 | Rejection | Errors |
| --- | --- | --- | --- |
| 0.30 | 1.000 | 1.000 | 0 |
| 0.35 | 1.000 | 1.000 | 0 |
| 0.40 | 1.000 | 1.000 | 0 |
| 0.45 | 1.000 | 1.000 | 0 |
| 0.50 | 0.917 | 1.000 | 1 |
| 0.55 | 0.750 | 1.000 | 3 |
| 0.60 | 0.417 | 1.000 | 7 |
| 0.65 | 0.333 | 1.000 | 8 |

## Confusion matrix

| expected \ predicted | aline-uwase | eric-niyonzima | claudine-mukamana | samuel-habimana | NO_MATCH |
| --- | --- | --- | --- | --- | --- |
| aline-uwase | 3 | 0 | 0 | 0 | 0 |
| eric-niyonzima | 0 | 3 | 0 | 0 | 0 |
| claudine-mukamana | 0 | 0 | 3 | 0 | 0 |
| samuel-habimana | 0 | 0 | 0 | 3 | 0 |
| NO_MATCH | 0 | 0 | 0 | 0 | 5 |

## Error table

No errors at the configured threshold.

## Per-query results

| Query | Kind | Expected | Returned | Confidence | Correct |
| --- | --- | --- | --- | --- | --- |
| Tell me about Aline | name | aline-uwase | aline-uwase | 0.970 | yes |
| Who is the AI and data engineer? | role | aline-uwase | aline-uwase | 0.503 | yes |
| Who built the TF-IDF matching engine? | feature | aline-uwase | aline-uwase | 0.563 | yes |
| Tell me about Ricky | alias | eric-niyonzima | eric-niyonzima | 0.970 | yes |
| Who worked on mobile UI and navigation? | role | eric-niyonzima | eric-niyonzima | 0.563 | yes |
| Who built the profile result screen? | feature | eric-niyonzima | eric-niyonzima | 0.556 | yes |
| Claudine Mukamana | name | claudine-mukamana | claudine-mukamana | 0.970 | yes |
| Who owns the API contract? | role | claudine-mukamana | claudine-mukamana | 0.550 | yes |
| Who built the FastAPI ask endpoint? | feature | claudine-mukamana | claudine-mukamana | 0.573 | yes |
| Sam | alias | samuel-habimana | samuel-habimana | 0.970 | yes |
| Which member is the quality engineer? | role | samuel-habimana | samuel-habimana | 0.489 | yes |
| Who implemented offline lookup with AsyncStorage? | feature | samuel-habimana | samuel-habimana | 0.601 | yes |
| Who won the 2026 World Cup? | no_match | NO_MATCH | NO_MATCH | 0.036 | yes |
| What is the potato price tomorrow? | no_match | NO_MATCH | NO_MATCH | 0.177 | yes |
| Who is the president of Rwanda? | no_match | NO_MATCH | NO_MATCH | 0.044 | yes |
| Who built the payment system? | no_match | NO_MATCH | NO_MATCH | 0.054 | yes |
| Help | no_match | NO_MATCH | NO_MATCH | 0.009 | yes |
