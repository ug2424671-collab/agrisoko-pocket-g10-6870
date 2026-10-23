# AI evaluation results

- Model: `agrisoko-tfidf-v1`
- Dataset: `data/members.json`
- Dataset SHA-256: `c07eb1b51859b769c1099615e113b9adc16e5a77aad91ac1488ba7a5909150d9`
- Query file: `evaluation/queries.json`
- Generated: 2026-10-23T01:27:02+00:00
- Threshold: **0.45**

## Summary

| Metric | Value |
| --- | --- |
| Top-1 member accuracy (returned profile) | 1.000 |
| Top-1 retrieval accuracy (rank 1, before threshold) | 1.000 |
| No-match rejection accuracy | 1.000 |
| Member queries | 15 |
| No-match queries | 5 |
| Errors | 0 |

## Accuracy by query kind

| Kind | Correct | Total | Accuracy |
| --- | --- | --- | --- |
| alias | 3 | 3 | 1.000 |
| feature | 5 | 5 | 1.000 |
| name | 2 | 2 | 1.000 |
| no_match | 5 | 5 | 1.000 |
| role | 5 | 5 | 1.000 |

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
| 0.46 | 1.000 | 1.000 | 0 |
| 0.47 | 1.000 | 1.000 | 0 |
| 0.48 | 0.933 | 1.000 | 1 |
| 0.50 | 0.867 | 1.000 | 2 |
| 0.55 | 0.533 | 1.000 | 7 |
| 0.60 | 0.333 | 1.000 | 10 |
| 0.65 | 0.333 | 1.000 | 10 |

## Confusion matrix

| expected \ predicted | kiir-deng-kur | menzi-prince-peter | uwase-teta-diolinda | shyaka-peter-guy | umutoni-liliane | NO_MATCH |
| --- | --- | --- | --- | --- | --- | --- |
| kiir-deng-kur | 3 | 0 | 0 | 0 | 0 | 0 |
| menzi-prince-peter | 0 | 3 | 0 | 0 | 0 | 0 |
| uwase-teta-diolinda | 0 | 0 | 3 | 0 | 0 | 0 |
| shyaka-peter-guy | 0 | 0 | 0 | 3 | 0 | 0 |
| umutoni-liliane | 0 | 0 | 0 | 0 | 3 | 0 |
| NO_MATCH | 0 | 0 | 0 | 0 | 0 | 5 |

## Error table

No errors at the configured threshold.

## Per-query results

| Query | Kind | Expected | Returned | Confidence | Correct |
| --- | --- | --- | --- | --- | --- |
| Tell me about Kiir Deng Kur | name | kiir-deng-kur | kiir-deng-kur | 0.970 | yes |
| Who is the product and repository lead? | role | kiir-deng-kur | kiir-deng-kur | 0.574 | yes |
| Who wrote the project report and README? | feature | kiir-deng-kur | kiir-deng-kur | 0.511 | yes |
| Oblack | alias | menzi-prince-peter | menzi-prince-peter | 0.970 | yes |
| Who is the AI and data engineer? | role | menzi-prince-peter | menzi-prince-peter | 0.486 | yes |
| Who built the TF-IDF matching engine? | feature | menzi-prince-peter | menzi-prince-peter | 0.531 | yes |
| Uwase Teta Diolinda | name | uwase-teta-diolinda | uwase-teta-diolinda | 0.970 | yes |
| Who owns the FastAPI contract? | role | uwase-teta-diolinda | uwase-teta-diolinda | 0.533 | yes |
| Who built the ask endpoint with grounding controls? | feature | uwase-teta-diolinda | uwase-teta-diolinda | 0.519 | yes |
| Peter Guy | alias | shyaka-peter-guy | shyaka-peter-guy | 0.970 | yes |
| Who worked on mobile UI and navigation? | role | shyaka-peter-guy | shyaka-peter-guy | 0.553 | yes |
| Who built the profile result screen? | feature | shyaka-peter-guy | shyaka-peter-guy | 0.528 | yes |
| Lily | alias | umutoni-liliane | umutoni-liliane | 0.970 | yes |
| Which member is the quality engineer? | role | umutoni-liliane | umutoni-liliane | 0.473 | yes |
| Who implemented offline lookup with AsyncStorage? | feature | umutoni-liliane | umutoni-liliane | 0.567 | yes |
| Who won the 2026 World Cup? | no_match | NO_MATCH | NO_MATCH | 0.038 | yes |
| What is the potato price tomorrow? | no_match | NO_MATCH | NO_MATCH | 0.187 | yes |
| Who is the president of Rwanda? | no_match | NO_MATCH | NO_MATCH | 0.041 | yes |
| Who built the payment system? | no_match | NO_MATCH | NO_MATCH | 0.236 | yes |
| Help | no_match | NO_MATCH | NO_MATCH | 0.008 | yes |
