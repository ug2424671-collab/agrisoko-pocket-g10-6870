#!/usr/bin/env python3
"""Copy the approved directory into the mobile app for offline browsing.

Run after every change to ai-api/data/members.json:

    python scripts/sync_mobile_data.py

The generated file contains directory fields only. Full profiles, tester
feedback and registration numbers are fetched from the API and cached at
runtime by the app.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import GROUP_CODE, MODEL_VERSION  # noqa: E402
from app.data import DatasetError, MemberStore  # noqa: E402


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=root / "data" / "members.json")
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=root.parent / "mobile" / "src" / "data",
    )
    args = parser.parse_args()

    try:
        store = MemberStore(args.data)
    except DatasetError as exc:
        print("DATASET ERROR\n" + str(exc), file=sys.stderr)
        return 1

    args.out_dir.mkdir(parents=True, exist_ok=True)
    directory = store.directory()
    (args.out_dir / "members.bundled.json").write_text(
        json.dumps(directory, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    meta = {
        "groupCode": GROUP_CODE,
        "modelVersion": MODEL_VERSION,
        "memberCount": len(directory),
        "datasetFingerprint": store.fingerprint,
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": "ai-api/data/members.json",
    }
    (args.out_dir / "bundledMeta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Synced {len(directory)} member(s) to {args.out_dir}")
    print(f"Fingerprint: {store.fingerprint}")
    if not directory:
        print("WARNING: the bundled directory is empty; the offline demo will show no members.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
