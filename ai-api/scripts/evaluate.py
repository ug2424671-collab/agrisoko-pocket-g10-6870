#!/usr/bin/env python3
"""Evaluate retrieval quality and justify the confidence threshold.

Outputs:
  evaluation/results.json   machine-readable results used by GET /model-info
  evaluation/RESULTS.md     error table, confusion matrix and threshold sweep
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import DEFAULT_THRESHOLD, MODEL_VERSION  # noqa: E402
from app.data import DatasetError, MemberStore, fingerprint_file  # noqa: E402
from app.engine import MatchingEngine  # noqa: E402

SWEEP = [0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65]


def load_queries(path: Path) -> list[dict[str, Any]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    queries = payload.get("queries") if isinstance(payload, dict) else payload
    if not isinstance(queries, list) or not queries:
        raise ValueError("queries file must contain a non-empty 'queries' array")
    return queries


def run(engine: MatchingEngine, queries: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for item in queries:
        expected = item.get("expectedMemberId")
        result = engine.match(item["query"])
        matched = result["match"]
        predicted = matched["id"] if matched else None
        top_candidate = result["top_candidates"][0] if result["top_candidates"] else None
        retrieval_id = top_candidate["id"] if top_candidate else None
        rows.append(
            {
                "query": item["query"],
                "kind": item.get("kind", "unspecified"),
                "expectedMemberId": expected,
                "predictedMemberId": predicted,
                "topCandidateId": retrieval_id,
                "confidence": result["confidence"],
                "returnedMatch": matched is not None,
                "correct": predicted == expected,
                "retrievalCorrect": retrieval_id == expected,
                "reason": result["reason"],
            }
        )
    return rows


def summarize(rows: list[dict[str, Any]], threshold: float) -> dict[str, Any]:
    member_rows = [row for row in rows if row["expectedMemberId"]]
    no_match_rows = [row for row in rows if not row["expectedMemberId"]]
    member_correct = sum(1 for row in member_rows if row["correct"])
    retrieval_correct = sum(1 for row in member_rows if row["retrievalCorrect"])
    rejected = sum(1 for row in no_match_rows if not row["returnedMatch"])
    errors = [row for row in rows if not row["correct"]]
    frame = pd.DataFrame(rows)
    per_kind = {
        str(kind): {
            "count": int(group["correct"].count()),
            "correct": int(group["correct"].sum()),
            "accuracy": round(float(group["correct"].mean()), 3),
        }
        for kind, group in frame.groupby("kind", sort=True)
    }
    return {
        "threshold": threshold,
        "queryCount": len(rows),
        "memberQueryCount": len(member_rows),
        "noMatchQueryCount": len(no_match_rows),
        "top1Accuracy": round(member_correct / len(member_rows), 3) if member_rows else 0.0,
        "top1RetrievalAccuracy": round(retrieval_correct / len(member_rows), 3) if member_rows else 0.0,
        "noMatchRejectionAccuracy": round(rejected / len(no_match_rows), 3) if no_match_rows else 0.0,
        "perKind": per_kind,
        "errorCount": len(errors),
    }


def confusion_matrix(rows: list[dict[str, Any]], member_ids: list[str]) -> str:
    labels = [*member_ids, "NO_MATCH"]
    counts = {expected: {predicted: 0 for predicted in labels} for expected in labels}
    for row in rows:
        expected = row["expectedMemberId"] or "NO_MATCH"
        predicted = row["predictedMemberId"] or "NO_MATCH"
        counts[expected][predicted] += 1

    header = "| expected \\ predicted | " + " | ".join(labels) + " |"
    divider = "| --- | " + " | ".join("---" for _ in labels) + " |"
    body = [
        "| " + expected + " | " + " | ".join(str(counts[expected][predicted]) for predicted in labels) + " |"
        for expected in labels
    ]
    return "\n".join([header, divider, *body])


def results_markdown(
    summary: dict[str, Any],
    sweep_rows: list[dict[str, Any]],
    rows: list[dict[str, Any]],
    member_ids: list[str],
    fingerprint: str,
    dataset: Path,
    queries_path: Path,
) -> str:
    errors = [row for row in rows if not row["correct"]]
    lines = [
        "# AI evaluation results",
        "",
        f"- Model: `{MODEL_VERSION}`",
        f"- Dataset: `{dataset}`",
        f"- Dataset SHA-256: `{fingerprint}`",
        f"- Query file: `{queries_path}`",
        f"- Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"- Threshold: **{summary['threshold']:.2f}**",
        "",
        "## Summary",
        "",
        "| Metric | Value |",
        "| --- | --- |",
        f"| Top-1 member accuracy (returned profile) | {summary['top1Accuracy']:.3f} |",
        f"| Top-1 retrieval accuracy (rank 1, before threshold) | {summary['top1RetrievalAccuracy']:.3f} |",
        f"| No-match rejection accuracy | {summary['noMatchRejectionAccuracy']:.3f} |",
        f"| Member queries | {summary['memberQueryCount']} |",
        f"| No-match queries | {summary['noMatchQueryCount']} |",
        f"| Errors | {summary['errorCount']} |",
        "",
        "## Accuracy by query kind",
        "",
        "| Kind | Correct | Total | Accuracy |",
        "| --- | --- | --- | --- |",
        *[
            f"| {kind} | {stats['correct']} | {stats['count']} | {stats['accuracy']:.3f} |"
            for kind, stats in summary["perKind"].items()
        ],
        "",
        "## Threshold sweep",
        "",
        "The configured threshold is 0.45. The sweep below records how member",
        "accuracy and no-match rejection change if it moves; the chosen value must",
        "keep every deliberate no-match question rejected.",
        "",
        "| Threshold | Top-1 | Rejection | Errors |",
        "| --- | --- | --- | --- |",
    ]
    for item in sweep_rows:
        lines.append(
            f"| {item['threshold']:.2f} | {item['top1Accuracy']:.3f} | "
            f"{item['noMatchRejectionAccuracy']:.3f} | {item['errorCount']} |"
        )

    lines += [
        "",
        "## Confusion matrix",
        "",
        confusion_matrix(rows, member_ids),
        "",
        "## Error table",
        "",
    ]
    if not errors:
        lines.append("No errors at the configured threshold.")
    else:
        lines += [
            "| Query | Kind | Expected | Returned | Confidence | Why |",
            "| --- | --- | --- | --- | --- | --- |",
        ]
        for row in errors:
            lines.append(
                f"| {row['query']} | {row['kind']} | {row['expectedMemberId'] or 'NO_MATCH'} | "
                f"{row['predictedMemberId'] or 'NO_MATCH'} | {row['confidence']:.3f} | {row['reason']} |"
            )

    lines += [
        "",
        "## Per-query results",
        "",
        "| Query | Kind | Expected | Returned | Confidence | Correct |",
        "| --- | --- | --- | --- | --- | --- |",
    ]
    for row in rows:
        lines.append(
            f"| {row['query']} | {row['kind']} | {row['expectedMemberId'] or 'NO_MATCH'} | "
            f"{row['predictedMemberId'] or 'NO_MATCH'} | {row['confidence']:.3f} | "
            f"{'yes' if row['correct'] else 'NO'} |"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "members.json")
    parser.add_argument(
        "--queries",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "evaluation" / "queries.json",
    )
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] / "evaluation")
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    args = parser.parse_args()

    queries_path = args.queries
    if not queries_path.exists():
        fallback = Path(__file__).resolve().parents[1] / "tests" / "fixtures" / "queries.sample.json"
        if not fallback.exists():
            print(f"Queries not found: {queries_path}", file=sys.stderr)
            return 1
        print(f"WARNING: {queries_path} not found; using synthetic fixture {fallback}")
        queries_path = fallback

    try:
        store = MemberStore(args.data)
    except DatasetError as exc:
        print("DATASET ERROR\n" + str(exc), file=sys.stderr)
        return 1
    if not store.members:
        print("Dataset is empty; add approved member records before evaluating.", file=sys.stderr)
        return 1

    queries = load_queries(queries_path)
    engine = MatchingEngine(store.members, threshold=args.threshold)
    rows = run(engine, queries)
    summary = summarize(rows, args.threshold)

    sweep_rows = []
    for threshold in SWEEP:
        sweep_engine = MatchingEngine(store.members, threshold=threshold)
        sweep_rows.append(summarize(run(sweep_engine, queries), threshold))

    fingerprint = fingerprint_file(args.data)
    args.out.mkdir(parents=True, exist_ok=True)
    payload = {
        "modelVersion": MODEL_VERSION,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "datasetFile": str(args.data),
        "datasetFingerprint": fingerprint,
        "queriesFile": str(queries_path),
        "threshold": args.threshold,
        **{key: value for key, value in summary.items() if key != "threshold"},
        "thresholdSweep": sweep_rows,
        "queries": rows,
    }
    (args.out / "results.json").write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (args.out / "RESULTS.md").write_text(
        results_markdown(summary, sweep_rows, rows, [member["id"] for member in store.members], fingerprint, args.data, queries_path),
        encoding="utf-8",
    )

    print(json.dumps(summary, indent=2))
    print(f"Wrote {args.out / 'results.json'} and {args.out / 'RESULTS.md'}")
    if summary["errorCount"]:
        print("Errors remain; inspect the error table before release.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
