#!/usr/bin/env python3
"""Validate the approved dataset and print a release checklist summary.

This is deliberately separate from build_index.py so a CI job or a reviewer can
run the privacy and completeness checks without producing build artifacts.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.data import DatasetError, MemberStore  # noqa: E402

REQUIRED_KEYS = [
    "fullName",
    "registrationNumber",
    "aliases",
    "githubUsername",
    "role",
    "skills",
    "targetUser",
    "problem",
    "contribution",
    "feature",
    "outcomeMetric",
    "evidenceLinks",
    "testerFeedback",
    "introductionDraft",
]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path(__file__).resolve().parents[1] / "data" / "members.json")
    parser.add_argument("--min-members", type=int, default=4)
    parser.add_argument("--max-members", type=int, default=6)
    args = parser.parse_args()

    try:
        store = MemberStore(args.data)
    except DatasetError as exc:
        print("DATASET ERROR\n" + str(exc), file=sys.stderr)
        return 1

    errors: list[str] = []
    warnings: list[str] = []
    if not (args.min_members <= store.count <= args.max_members):
        errors.append(f"Expected {args.min_members}-{args.max_members} members, found {store.count}.")

    alias_owner: dict[str, str] = {}
    for member in store.members:
        missing = [key for key in REQUIRED_KEYS if key not in member]
        if missing:
            errors.append(f"{member.get('id', '?')}: missing keys {missing}")
        for alias in [member["fullName"], *member.get("aliases", [])]:
            normalized = alias.strip().lower()
            if normalized in alias_owner and alias_owner[normalized] != member["id"]:
                warnings.append(f"Alias '{alias}' is shared by {alias_owner[normalized]} and {member['id']}.")
            alias_owner[normalized] = member["id"]
        if not member.get("evidenceLinks"):
            errors.append(f"{member['id']}: at least one evidence link is required.")
        if not member.get("testerFeedback"):
            warnings.append(f"{member['id']}: no tester feedback recorded.")
        if "TODO" in str(member) or "REPLACE" in str(member):
            errors.append(f"{member['id']}: contains a TODO/REPLACE placeholder.")
        if member["id"].endswith("-demo"):
            warnings.append(f"{member['id']}: looks like demo fixture data, not a real member.")

    kinds = Counter(link["type"] for member in store.members for link in member.get("evidenceLinks", []))
    print(f"Dataset: {args.data}")
    print(f"Members: {store.count}")
    print(f"Fingerprint: {store.fingerprint}")
    print("Evidence link types: " + (", ".join(f"{kind}={count}" for kind, count in sorted(kinds.items())) or "none"))

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}", file=sys.stderr)

    if errors:
        print(f"Validation failed with {len(errors)} error(s).", file=sys.stderr)
        return 1
    print("Dataset validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
