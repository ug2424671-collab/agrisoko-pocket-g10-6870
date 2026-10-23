#!/usr/bin/env python3
"""Validate members.json, build the TF-IDF index and write release metadata.

Usage (from ai-api/):
    python scripts/build_index.py
    python scripts/build_index.py --check-only
    python scripts/build_index.py --data tests/fixtures/members.sample.json --allow-empty
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import joblib  # noqa: E402

from app.config import ARTIFACTS_DIR, BUILD_COMMIT, DEFAULT_THRESHOLD, GROUP_CODE, MODEL_VERSION  # noqa: E402
from app.data import DatasetError, MemberStore, fingerprint_file  # noqa: E402
from app.engine import MatchingEngine  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "members.json")
    parser.add_argument("--out", type=Path, default=ARTIFACTS_DIR)
    parser.add_argument("--threshold", type=float, default=DEFAULT_THRESHOLD)
    parser.add_argument("--check-only", action="store_true", help="Validate without writing artifacts.")
    parser.add_argument("--allow-empty", action="store_true", help="Allow an empty dataset (scaffolding/tests).")
    args = parser.parse_args()

    try:
        store = MemberStore(args.data)
        if store.count == 0 and not args.allow_empty:
            raise DatasetError("members.json is empty. Add the approved 4-6 member records for release.")
    except DatasetError as exc:
        print("DATASET ERROR\n" + str(exc), file=sys.stderr)
        return 1

    engine = MatchingEngine(store.members, threshold=args.threshold)
    built_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    fingerprint = fingerprint_file(args.data)

    print(f"Group code:      {GROUP_CODE}")
    print(f"Dataset:         {args.data}")
    print(f"Members:         {store.count}")
    print(f"Fingerprint:     {fingerprint}")
    print(f"Threshold:       {args.threshold:.2f}")
    print(f"Features:        {engine.feature_count}")

    if args.check_only:
        print("Validation passed; no artifacts written (--check-only).")
        return 0

    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "fingerprint.txt").write_text(fingerprint + "\n", encoding="utf-8")

    metadata = {
        "groupCode": GROUP_CODE,
        "schemaVersion": 1,
        "modelVersion": MODEL_VERSION,
        "vectorizerType": (
            "scikit-learn FeatureUnion: TfidfVectorizer word (1,2) + TfidfVectorizer char_wb (3,5)"
        ),
        "similarity": "cosine",
        "confidenceMethod": "0.6 x TF-IDF cosine + 0.4 x query-term coverage; exact identity -> 0.97.",
        "threshold": args.threshold,
        "aliasBoost": "Exact full-name or alias phrase -> 0.97; competing exact identities -> no match.",
        "datasetFingerprint": fingerprint,
        "datasetFile": str(args.data),
        "memberCount": store.count,
        "featureCount": engine.feature_count,
        "buildCommit": BUILD_COMMIT,
        "builtAt": built_at,
    }
    (args.out / "model_meta.json").write_text(
        json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    if store.count:
        joblib.dump(
            {
                "vectorizer": engine.vectorizer,
                "matrix": engine.matrix,
                "memberIds": [member["id"] for member in store.members],
                "threshold": args.threshold,
                "fingerprint": fingerprint,
                "modelVersion": MODEL_VERSION,
            },
            args.out / "tfidf_index.joblib",
            compress=3,
        )

    summary = {
        "memberIds": [member["id"] for member in store.members],
        "memberCount": store.count,
        "featureCount": engine.feature_count,
        "aliases": {member["id"]: member.get("aliases", []) for member in store.members},
        "builtAt": built_at,
        "buildCommit": BUILD_COMMIT,
    }
    (args.out / "index_summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Wrote artifacts to {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
